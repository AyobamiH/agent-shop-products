/** One-effect upload controller. Reads authoritative Cloudflare state before
 * any write, reserves one source-bound attempt, then reconciles the effect.
 * Never asks a failed CLI to upload again automatically.
 */
import { observeExactCandidate, listExactCandidate } from "./worker-version-reconciliation.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function reserveOneShotVersionAttempt({ folder, sha, priorVersionId, sourceTree }) {
  if (!/^[a-f0-9]{40}$/.test(sha) ||
      !/^[a-f0-9]{40}$/.test(sourceTree) ||
      !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(priorVersionId)) {
    throw Error("UPLOAD_INTENT_IDENTITY_INVALID");
  }
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  const filename = join(folder, "upload-attempt-" + sha + ".json");
  writeFileSync(filename, JSON.stringify({
    sha, sourceTree, priorVersionId, intent: "one_cloudflare_version_upload",
    reservedAt: new Date().toISOString(),
  }) + "\n", { mode: 0o600, flag: "wx" });
  return filename;
}

export async function reconcileOrUpload({ sha, readPage, reserveAttempt, upload, delay }) {
  const first = await listExactCandidate({ sha, readPage });
  if (first) return { ...first, source: "recovered_existing_exact_version" };
  if (typeof reserveAttempt !== "function" || typeof upload !== "function") {
    throw Error("CANDIDATE_UPLOAD_EXECUTOR_MISSING");
  }
  await reserveAttempt(); // Atomically journal source-bound one-shot intent before side effect.
  let stdout = "";
  let cliFailure = null;
  try {
    stdout = await upload();
    if (typeof stdout !== "string") throw Error("CANDIDATE_CLI_OUTPUT_INVALID");
  } catch (error) {
    cliFailure = error instanceof Error ? error.message : "CANDIDATE_CLI_UNKNOWN_FAILURE";
  }
  // Even a zero-exit CLI acknowledgement is insufficient. An interrupted
  // upload may complete at the provider after the child has exited.
  const candidate = await observeExactCandidate({ sha, readPage, delay });
  if (!candidate) {
    throw Error(cliFailure ? "CANDIDATE_UPLOAD_UNCONFIRMED_AFTER_CLI_FAILURE" : "CANDIDATE_UPLOAD_UNCONFIRMED");
  }
  return {
    ...candidate,
    source: cliFailure ? "recovered_after_ambiguous_cli" : "confirmed_provider_after_cli",
  };
}
