import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const VERSION_RE = /Worker Version ID:\s*([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})/gi;
const ALIAS_RE = /Version Preview Alias URL:\s*(https:\/\/[a-z0-9.-]+\/?)/gi;

export function parseCandidateUpload(raw, sha) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw Error("INVALID_EXACT_SHA");
  const versions = [...raw.matchAll(VERSION_RE)].map((m) => m[1]);
  const aliases = [...raw.matchAll(ALIAS_RE)].map((m) => m[1]);
  if (versions.length !== 1 || aliases.length !== 1) throw Error("AMBIGUOUS_CANDIDATE_UPLOAD");
  const url = new URL(aliases[0]);
  const expectedHost = "release-" + sha.slice(0, 8) + "-agent-shop.woeinvests.workers.dev";
  if (url.protocol !== "https:" || url.hostname !== expectedHost || url.pathname !== "/") {
    throw Error("UNEXPECTED_CANDIDATE_ORIGIN");
  }
  return { versionId: versions[0].toLowerCase(), previewURL: url.origin };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const [file, sha] = process.argv.slice(2);
    if (!file || !sha) throw Error("USAGE_PARSE_CANDIDATE");
    const { versionId, previewURL } = parseCandidateUpload(readFileSync(file, "utf8"), sha);
    process.stdout.write("version_id=" + versionId + "\npreview_url=" + previewURL + "\n");
  } catch (err) {
    console.error("candidate_upload_invalid=" + (err instanceof Error ? err.message : "UNKNOWN"));
    process.exitCode = 1;
  }
}
