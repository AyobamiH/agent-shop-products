import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, symlinkSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveSfx } from "../products/hyperframes-media/scripts/lib/sfx.mjs";

function sandbox(t) {
  const root = mkdtempSync(join(tmpdir(), "catalog-sfx-safety-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const project = join(root, "project");
  const library = join(root, "licensed-library");
  mkdirSync(project); mkdirSync(library);
  return { root, project, library };
}
const cues = [{ id: "beat-1", name: "pop" }];
const offline = (project, sfxLibDir) =>
  resolveSfx({ cues, heygenOK: false, headers: {}, hyperframesDir: project, sfxLibDir });

test("no explicit licensed library skips all effects", async (t) => {
  const { project } = sandbox(t);
  const result = await offline(project, null);
  assert.equal(result.sfx.length, 0);
  assert.equal(result.anomalies.length, 1);
});

test("approved local source copies the intended file", async (t) => {
  const { project, library } = sandbox(t);
  writeFileSync(join(library, "pop.mp3"), "synthetic-test-audio");
  writeFileSync(join(library, "manifest.json"), JSON.stringify({ pop: { file: "pop.mp3", duration: 1.5 } }));
  const result = await offline(project, library);
  assert.equal(result.sfx.length, 1);
  assert.equal(readFileSync(join(project, "assets", "sfx", "pop.mp3"), "utf8"), "synthetic-test-audio");
});

test("manifest traversal cannot copy outside the licensed source", async (t) => {
  const { root, project, library } = sandbox(t);
  writeFileSync(join(root, "outside.mp3"), "do-not-copy");
  writeFileSync(join(library, "manifest.json"), JSON.stringify({ pop: { file: "../outside.mp3", duration: 1.5 } }));
  const result = await offline(project, library);
  assert.equal(result.sfx.length, 0);
  assert.equal(existsSync(join(project, "assets", "sfx", "outside.mp3")), false);
});

test("source symlinks cannot escape the licensed source", async (t) => {
  const { root, project, library } = sandbox(t);
  writeFileSync(join(root, "outside.mp3"), "do-not-copy");
  symlinkSync(join(root, "outside.mp3"), join(library, "pop.mp3"));
  writeFileSync(join(library, "manifest.json"), JSON.stringify({ pop: { file: "pop.mp3", duration: 1.5 } }));
  const result = await offline(project, library);
  assert.equal(result.sfx.length, 0);
});

test("destination symlink cannot escape the project boundary", async (t) => {
  const { root, project, library } = sandbox(t);
  const outside = join(root, "outside");
  mkdirSync(outside);
  mkdirSync(join(project, "assets"));
  symlinkSync(outside, join(project, "assets", "sfx"));
  writeFileSync(join(library, "pop.mp3"), "synthetic-test-audio");
  writeFileSync(join(library, "manifest.json"), JSON.stringify({ pop: { file: "pop.mp3", duration: 1.5 } }));
  await offline(project, library);
  assert.equal(existsSync(join(outside, "pop.mp3")), false, "library data escaped through the destination symlink");
});

test("nested library names cannot create external directories", async (t) => {
  const { root, project, library } = sandbox(t);
  const outside = join(root, "outside");
  mkdirSync(outside);
  mkdirSync(join(library, "nested"));
  writeFileSync(join(library, "nested", "pop.mp3"), "synthetic-test-audio");
  writeFileSync(join(library, "manifest.json"), JSON.stringify({ pop: { file: "nested/pop.mp3", duration: 1.5 } }));
  mkdirSync(join(project, "assets"));
  mkdirSync(join(project, "assets", "sfx"));
  symlinkSync(outside, join(project, "assets", "sfx", "nested"));
  const result = await offline(project, library);
  assert.equal(result.sfx.length, 0);
  assert.equal(existsSync(join(outside, "pop.mp3")), false);
});

test("existing destination symlink cannot point outside project", async (t) => {
  const { root, project, library } = sandbox(t);
  const outside = join(root, "unwritten.mp3");
  writeFileSync(join(library, "pop.mp3"), "synthetic-test-audio");
  writeFileSync(join(library, "manifest.json"), JSON.stringify({ pop: { file: "pop.mp3", duration: 1.5 } }));
  mkdirSync(join(project, "assets", "sfx"), { recursive: true });
  symlinkSync(outside, join(project, "assets", "sfx", "pop.mp3"));
  const result = await offline(project, library);
  assert.equal(result.sfx.length, 0);
  assert.equal(existsSync(outside), false);
});
