// sfx.mjs — sound effects for the media audio engine. Provider-gated (NOT a
// per-cue merge): the decision is made once, by whether HeyGen is configured —
// mirroring how TTS and BGM degrade.
//
//   HeyGen credential present  →  retrieve EVERY cue from HeyGen's audio library
//        (/v3/audio/sounds, type=sound_effects, min_score=0.4). The local
//        library is NOT consulted.
//   HeyGen credential absent   →  resolve cues only against an explicitly
//        supplied, separately licensed library (--sfx-lib).
//
// A cue that matches nothing is skipped (recorded as an anomaly); SFX never
// blocks a render. Every cue sits at volume ~0.35, under voice + BGM.

import { constants, copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { downloadTo, searchSounds } from "./heygen.mjs";

const SFX_VOLUME = 0.35;
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "x";
const r3 = (x) => Number(x.toFixed(3));
const isWithin = (root, path) => {
  const rel = relative(root, path);
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
};

// cues: [{ id, name }] (id = the line/frame/scene the cue fires in). Returns
// { sfx: [{ id, name, file, source, offset_s, duration_s, volume }], anomalies }.
export async function resolveSfx({ cues, heygenOK, headers, hyperframesDir, sfxLibDir }) {
  const sfx = [];
  const anomalies = [];

  // Dedupe identical (id,name) cues — the same effect named twice in one line
  // downloads/copies once.
  const seen = new Set();
  const uniq = cues.filter((c) => {
    const k = `${c.id}:${c.name}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (heygenOK) {
    for (const { id, name } of uniq) {
      try {
        // SFX hits score low (~0.5–0.67), below the API's default 0.7 which
        // silently drops most named cues — floor to 0.4. (BGM/music score high
        // and keep the default.)
        const results = await searchSounds(name, "sound_effects", headers, {
          limit: 3,
          minScore: 0.4,
        });
        if (!results.length) {
          anomalies.push(`sfx "${name}" (id ${id}): no HeyGen match — skipped`);
          continue;
        }
        const top = results[0];
        const file = `assets/sfx/${slug(name)}.mp3`;
        await downloadTo(top.audio_url, join(hyperframesDir, file));
        sfx.push({
          id,
          name,
          file,
          source: "heygen",
          offset_s: 0,
          duration_s: typeof top.duration === "number" ? r3(top.duration) : 1.0,
          volume: SFX_VOLUME,
        });
      } catch (e) {
        anomalies.push(`sfx "${name}" (id ${id}): retrieval failed — ${e.message}`);
      }
    }
    return { sfx, anomalies };
  }

  if (!sfxLibDir) {
    if (uniq.length)
      anomalies.push(
        "no HeyGen credential and no user-provided licensed SFX library (pass --sfx-lib <directory>) — all cues dropped",
      );
    return { sfx, anomalies };
  }

  // ── offline: explicitly supplied licensed library ──
  const manifestPath = join(sfxLibDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    if (uniq.length)
      anomalies.push(`no manifest.json in licensed SFX library at ${sfxLibDir} — all cues dropped`);
    return { sfx, anomalies };
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (e) {
    anomalies.push(`SFX manifest parse failed (${e.message}) — all cues dropped`);
    return { sfx, anomalies };
  }
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    anomalies.push("SFX manifest must be a JSON object — all cues dropped");
    return { sfx, anomalies };
  }
  // Build lookups: by manifest key, by file basename, and by slug of either, so
  // a cue can name "whoosh", "whoosh.mp3", or "ui click" (→ slug match).
  const byKey = new Map();
  for (const [key, entry] of Object.entries(manifest)) {
    if (typeof entry?.file !== "string" || typeof entry.duration !== "number" ||
        !Number.isFinite(entry.duration) || entry.duration <= 0) continue;
    const rec = { key, file: entry.file, duration: entry.duration };
    byKey.set(key, rec);
    byKey.set(entry.file, rec);
    byKey.set(slug(key), rec);
    byKey.set(slug(entry.file.replace(/\.\w+$/, "")), rec);
  }
  const libraryRoot = realpathSync(sfxLibDir);
  const projectRoot = realpathSync(hyperframesDir);
  const outputRoot = resolve(hyperframesDir, "assets", "sfx");
  mkdirSync(outputRoot, { recursive: true });
  const safeOutputRoot = realpathSync(outputRoot);
  if (!isWithin(projectRoot, safeOutputRoot)) {
    anomalies.push("SFX output directory resolves outside project — all cues skipped");
    return { sfx, anomalies };
  }
  for (const { id, name } of uniq) {
    const hit = byKey.get(name) ?? byKey.get(slug(name));
    if (!hit) {
      const known = [...new Set([...byKey.values()].map((v) => v.key))].slice(0, 8).join(", ");
      anomalies.push(
        `sfx "${name}" (id ${id}): not in licensed library — skipped (have: ${known}…)`,
      );
      continue;
    }
    // Manifest entries are flat licensed filenames, never directory paths.
    if (basename(hit.file) !== hit.file || hit.file === "." || hit.file === "..") {
      anomalies.push(`sfx "${name}" (id ${id}): unsafe or nested library filename — skipped`);
      continue;
    }
    const candidate = resolve(libraryRoot, hit.file);
    const dest = resolve(outputRoot, hit.file);
    if (!isWithin(libraryRoot, candidate)) {
      anomalies.push(`sfx "${name}" (id ${id}): licensed library file is missing or outside the library — skipped`);
      continue;
    }
    let src;
    try {
      src = realpathSync(candidate);
    } catch {
      anomalies.push(`sfx "${name}" (id ${id}): licensed library file is missing — skipped`);
      continue;
    }
    if (!isWithin(libraryRoot, src)) {
      anomalies.push(`sfx "${name}" (id ${id}): licensed library file resolves outside the library — skipped`);
      continue;
    }
    if (!isWithin(outputRoot, dest)) {
      anomalies.push(`sfx "${name}" (id ${id}): unsafe file path in licensed library manifest — skipped`);
      continue;
    }
    const destRel = relative(resolve(hyperframesDir), dest).split(sep).join("/");
    mkdirSync(dirname(dest), { recursive: true });
    const safeParent = realpathSync(dirname(dest));
    if (safeParent !== safeOutputRoot && !isWithin(safeOutputRoot, safeParent)) {
      anomalies.push(`sfx "${name}" (id ${id}): destination resolves outside project — skipped`);
      continue;
    }
    try {
      const existing = lstatSync(dest, { throwIfNoEntry: false });
      if (existing && (!existing.isFile() || existing.isSymbolicLink())) {
        anomalies.push(`sfx "${name}" (id ${id}): unsafe existing destination — skipped`);
        continue;
      }
      if (!existing) copyFileSync(src, dest, constants.COPYFILE_EXCL);
    } catch {
      anomalies.push(`sfx "${name}" (id ${id}): copy failed safely — skipped`);
      continue;
    }
    sfx.push({
      id,
      name,
      file: destRel,
      source: "local",
      offset_s: 0,
      duration_s: r3(hit.duration),
      volume: SFX_VOLUME,
    });
  }
  return { sfx, anomalies };
}
