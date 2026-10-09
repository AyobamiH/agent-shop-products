import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const SHA_RE = /^[0-9a-f]{40}$/;
const ID_RE = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const WORKER = "agent-shop";
const ORIGIN = "https://agents.proofandstate.com";
const EXPECTED_BINDINGS = {
  COMMERCE_DB: { type: "d1", id: "f3fa2e0b-bb41-4c51-8b44-25f699baa39b" },
  PRIVATE_KITS: { type: "r2_bucket", bucket_name: "agent-shop-private-kits" },
  COMMERCE_RATE_LIMITER: { type: "ratelimit" },
};

export function verifyCandidateMetadata(result, sha) {
  if (!result || result.annotations?.["workers/tag"] !== sha) {
    throw Error("CANDIDATE_SHA_MISMATCH");
  }
  const bindings = result.resources?.bindings;
  if (!Array.isArray(bindings)) throw Error("CANDIDATE_BINDINGS_MISSING");
  for (const [name, requirement] of Object.entries(EXPECTED_BINDINGS)) {
    const matching = bindings.filter((x) => x.name === name);
    if (matching.length !== 1 || Object.entries(requirement).some(([key, value]) =>
      matching[0][key] !== value
    )) throw Error("CANDIDATE_BINDING_MISMATCH_" + name);
  }
  if (bindings.some((b) => b.name === "COMMERCE_ENABLED" &&
    (b.text === "true" || b.value === "true"))) {
    throw Error("UNAPPROVED_CHECKOUT_BINDING");
  }
  return true;
}

export function activeVersion(deployments) {
  const current = deployments?.deployments?.[0];
  const versions = current?.versions;
  if (!Array.isArray(versions) || versions.length !== 1 ||
      versions[0]?.percentage !== 100 || !ID_RE.test(versions[0]?.version_id ?? "")) {
    throw Error("UNEXPECTED_DEPLOYMENT_TRAFFIC_SPLIT");
  }
  return versions[0].version_id;
}

export async function guardedPromote({
  sha, versionId, accountId, token, fetcher = fetch, publicVerifier,
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  if (!SHA_RE.test(sha) || !ID_RE.test(versionId) ||
      !/^[a-f0-9]{32}$/.test(accountId) || !token || !publicVerifier) {
    throw Error("GUARDED_RELEASE_CONFIGURATION_MISSING");
  }
  const base = "https://api.cloudflare.com/client/v4/accounts/" + accountId +
    "/workers/scripts/" + WORKER;
  const headers = { Authorization: "Bearer " + token, "Content-Type": "application/json" };
  async function api(method, path, body) {
    let response;
    try {
      response = await fetcher(base + path, {
        method, headers, ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(25000),
      });
    } catch { throw Error("CLOUDFLARE_TRANSPORT_UNAVAILABLE"); }
    let json;
    try { json = await response.json(); } catch { throw Error("CLOUDFLARE_MALFORMED_RESPONSE"); }
    if (!response.ok || json?.success !== true) {
      throw Error("CLOUDFLARE_HTTP_" + response.status);
    }
    return json.result;
  }
  const version = await api("GET", "/versions/" + versionId);
  verifyCandidateMetadata(version, sha);
  const deployments = await api("GET", "/deployments");
  const prior = activeVersion(deployments);
  if (prior === versionId) {
    const observed = await publicVerifier(ORIGIN);
    if (observed.status !== "PASS" || observed.commerceActive !== false ||
        observed.privateKitOffer !== "planned" || observed.products !== 33 ||
        observed.externalCapabilities !== 990 || observed.codingBugs !== 20) {
      throw Error("ACTIVE_VERSION_PUBLIC_ACCEPTANCE_FAILED");
    }
    return { status: "ALREADY_ACTIVE", sha, versionId, previousVersionId: prior, publicAcceptance: observed };
  }

  // Public convergence is eventually consistent. Never accept a single stale
  // 404 or brief TLS failure as a reason to roll back good code prematurely.
  // Every retry confirms that no other operator has replaced our candidate.
  async function verifyConvergedPublic() {
    for (let attempt = 1; attempt <= 5; attempt++) {
      if (activeVersion(await api("GET", "/deployments")) !== versionId) {
        throw Error("PRODUCTION_CHANGED_DURING_CONVERGENCE");
      }
      try {
        const observed = await publicVerifier(ORIGIN);
        if (observed?.status === "PASS" && observed.commerceActive === false &&
          observed.privateKitOffer === "planned" && observed.products === 33 &&
          observed.externalCapabilities === 990 && observed.codingBugs === 20) {
          return { ...observed, acceptedAttempt: attempt };
        }
      } catch { /* Only bounded redacted acceptance failures leave this scope. */ }
      if (attempt < 5) await delay(2000);
    }
    throw Error("PRODUCTION_OUTSIDE_IN_ACCEPTANCE_FAILED");
  }

  const payload = (id, message) => ({
    strategy: "percentage",
    versions: [{ version_id: id, percentage: 100 }],
    annotations: { "workers/message": message },
  });
  let deploymentId = "";
  try {
    try {
      const created = await api("POST", "/deployments", payload(versionId, "protected Agent Shop release " + sha + " commerce disabled"));
      deploymentId = created?.id || "";
    } catch (error) {
      // The POST may have committed before a transient network failure.
      // Never POST again until the control-plane state has been reconciled.
      if (activeVersion(await api("GET", "/deployments")) !== versionId) throw error;
    }
    if (activeVersion(await api("GET", "/deployments")) !== versionId) {
      throw Error("CANDIDATE_PROMOTION_NOT_CONVERGED");
    }
    const observed = await verifyConvergedPublic();
    if (activeVersion(await api("GET", "/deployments")) !== versionId) {
      throw Error("PRODUCTION_CHANGED_AFTER_READBACK");
    }
    return {
      status: "PASS", sha, versionId, previousVersionId: prior,
      deploymentId, publicAcceptance: observed,
    };
  } catch (error) {
    let rollbackResult = "not_safe_or_unverified";
    try {
      if (activeVersion(await api("GET", "/deployments")) === versionId) {
        try { await api("POST", "/deployments", payload(prior, "rollback failed Agent Shop release " + sha)); }
        catch { /* An ambiguous POST is verified by fresh control-plane readback. */ }
        rollbackResult = activeVersion(await api("GET", "/deployments")) === prior
          ? "verified_previous_version_restored" : "rollback_not_confirmed";
      } else {
        rollbackResult = "candidate_not_active_no_rollback_required";
      }
    } catch { rollbackResult = "rollback_status_unavailable"; }
    const code = error instanceof Error ? error.message : "UNKNOWN";
    throw Error("RELEASE_FAILED_" + code + "_ROLLBACK_" + rollbackResult);
  }
}

async function observePublic(origin) {
  const childEnv = { ...process.env, ACCEPTANCE_ORIGIN: origin, CANONICAL_ORIGIN: origin };
  delete childEnv.CLOUDFLARE_API_TOKEN;
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["frontend/scripts/verify-deployed-surface.mjs"], {
      cwd: fileURLToPath(new URL("../", import.meta.url)), env: childEnv, stdio: ["ignore", "pipe", "pipe"],
    });
    const cap = 16_384;
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, 100_000);
    child.stdout.on("data", (data) => { stdout = (stdout + data.toString()).slice(-cap); });
    child.stderr.on("data", (data) => { stderr = (stderr + data.toString()).slice(-cap); });
    child.on("error", (err) => { clearTimeout(timer); reject(Error("PUBLIC_CHECK_FAILED_" + err.name)); });
    child.on("close", (status) => {
      clearTimeout(timer);
      if (timedOut) return reject(Error("PUBLIC_CHECK_TIMEOUT"));
      if (status !== 0) return reject(Error("PUBLIC_CHECK_FAILED"));
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch { reject(Error("PUBLIC_CHECK_MALFORMED")); }
    });
  });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  (async () => {
    const { GITHUB_SHA, CANDIDATE_VERSION_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } = process.env;
    if (process.env.GITHUB_REF !== "refs/heads/main") throw Error("MAIN_BRANCH_ONLY");
    const proof = await guardedPromote({
      sha: GITHUB_SHA, versionId: CANDIDATE_VERSION_ID,
      accountId: CLOUDFLARE_ACCOUNT_ID, token: CLOUDFLARE_API_TOKEN,
      publicVerifier: observePublic,
    });
    const publicResult = { ...proof, verifiedAt: new Date().toISOString() };
    console.log(JSON.stringify(publicResult));
    if (process.env.GITHUB_STEP_SUMMARY) {
      const { appendFileSync } = await import("node:fs");
      appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        "## Guarded Agent Shop release\n\n" + JSON.stringify(publicResult, null, 2) + "\n");
    }
  })().catch((err) => {
    console.error("GUARDED_RELEASE_FAILED " + (err instanceof Error ? err.message : "UNKNOWN"));
    process.exitCode = 1;
  });
}
