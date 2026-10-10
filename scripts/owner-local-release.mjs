import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { requireExactMainCI } from "./check-release-ci.mjs";
import { parseCandidateUpload } from "./parse-candidate-upload.mjs";
import { activeVersion, guardedPromote, verifyCandidateMetadata } from "./guarded-promote.mjs";

const repo = fileURLToPath(new URL("../", import.meta.url));
const storefront = path.join(repo, "frontend");
const origin = "https://agents.proofandstate.com";
const repoName = "AyobamiH/agent-shop-products";
const accountId = "6ddcbcb8474f1a7e460b2f0aabec0e2f";
const workerName = "agent-shop";
const versionPath = "https://api.cloudflare.com/client/v4/accounts/" + accountId +
  "/workers/scripts/" + workerName;
const localTokenFile = path.join(os.homedir(), ".config/woe-ops/secrets/cloudflare/agent-shop.env");
const privateReceiptDir = path.join(os.homedir(), ".config/woe-ops/agent-shop-release-receipts");

export function confirmLocalRelease({ branch, clean, localSha, remoteSha, ciRuns }) {
  if (branch !== "main" || !clean) throw Error("LOCAL_MAIN_DIRTY_OR_WRONG_BRANCH");
  return requireExactMainCI(localSha, "refs/heads/main", remoteSha, ciRuns);
}

export function managedCredentialFromFile(filename) {
  const stats = statSync(filename);
  if (!stats.isFile() || (stats.mode & 0o077) !== 0) throw Error("TOKEN_FILE_PERMISSION_UNSAFE");
  const entries = new Map();
  for (const line of readFileSync(filename, "utf8").split(/\r?\n/)) {
    const index = line.indexOf("=");
    if (index < 1) continue;
    const key = line.slice(0, index);
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    entries.set(key, value);
  }
  if (entries.get("CLOUDFLARE_ACCOUNT_ID") !== accountId ||
      !entries.get("CLOUDFLARE_API_TOKEN") ||
      !/^[0-9a-f]{32}$/i.test(entries.get("CLOUDFLARE_API_TOKEN_ID") || "")) {
    throw Error("MANAGED_SCOPED_CREDENTIAL_UNAVAILABLE");
  }
  return { token: entries.get("CLOUDFLARE_API_TOKEN"), accountId };
}

function execute(command, args, { cwd = repo, env = process.env, timeout = 180000 } = {}) {
  const result = spawnSync(command, args, {
    cwd, env, encoding: "utf8", timeout, maxBuffer: 8_000_000,
  });
  if (result.status !== 0) {
    // Child stderr may accidentally include API tokens. Never return it.
    throw Error("LOCAL_RELEASE_COMMAND_FAILED_" +
      path.basename(command).replace(/[^a-z0-9.-]/gi, "").slice(0, 25));
  }
  return result.stdout;
}

export function localMainAdmission({ git = execute, gh = execute } = {}) {
  const branch = git("git", ["branch", "--show-current"]).trim();
  const dirty = git("git", ["status", "--porcelain"]).trim();
  const localSha = git("git", ["rev-parse", "HEAD"]).trim();
  const remoteSha = gh("gh", ["api", "repos/" + repoName + "/git/ref/heads/main",
    "--jq", ".object.sha"]).trim();
  const response = gh("gh", ["api", "repos/" + repoName +
    "/actions/workflows/frontend-ci.yml/runs?head_sha=" + encodeURIComponent(localSha) +
    "&event=push&per_page=30"]);
  let result;
  try { result = JSON.parse(response); }
  catch { throw Error("GITHUB_CI_MALFORMED"); }
  return confirmLocalRelease({
    branch, clean: dirty === "", localSha, remoteSha,
    ciRuns: result.workflow_runs,
  });
}

async function cloudflare(method, location, token) {
  let response;
  try {
    response = await fetch(versionPath + location, {
      method, headers: { Authorization: "Bearer " + token },
      signal: AbortSignal.timeout(20000),
    });
  } catch { throw Error("CLOUDFLARE_CONTROL_PLANE_UNAVAILABLE"); }
  let data;
  try { data = await response.json(); } catch { throw Error("CLOUDFLARE_BAD_JSON"); }
  if (!response.ok || data.success !== true) {
    throw Error("CLOUDFLARE_CONTROL_PLANE_HTTP_" + response.status);
  }
  return data.result;
}

async function currentVersion(token) {
  return activeVersion(await cloudflare("GET", "/deployments", token));
}

function availableBun() {
  const options = [
    process.env.AGENT_SHOP_BUN_BIN,
    path.join(os.homedir(), ".bun/bin/bun"),
    path.join(os.homedir(), ".npm/_npx/22f2fe8d8bc13000/node_modules/.bin/bun"),
    "bun",
  ].filter(Boolean);
  for (const candidate of options) {
    if (candidate === "bun" || existsSync(candidate)) return candidate;
  }
  throw Error("BUN_RUNTIME_UNAVAILABLE");
}

function checkPublic(targetOrigin) {
  const environment = { ...process.env, ACCEPTANCE_ORIGIN: targetOrigin, CANONICAL_ORIGIN: origin };
  delete environment.CLOUDFLARE_API_TOKEN;
  delete environment.GITHUB_TOKEN;
  const data = execute(process.execPath, ["scripts/verify-deployed-surface.mjs"], {
    cwd: storefront, env: environment, timeout: 120000,
  });
  let result;
  try { result = JSON.parse(data.trim()); }
  catch { throw Error("PUBLIC_ACCEPTANCE_NOT_JSON"); }
  if (result.status !== "PASS" || result.products !== 33 ||
      result.externalCapabilities !== 990 || result.codingBugs !== 20 ||
      result.commerceActive !== false || result.privateKitOffer !== "planned") {
    throw Error("PUBLIC_ACCEPTANCE_REJECTED");
  }
  return result;
}

function saveReceipt(receipt) {
  mkdirSync(privateReceiptDir, { recursive: true, mode: 0o700 });
  const filename = path.join(privateReceiptDir, receipt.sha + ".json");
  writeFileSync(filename, JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600 });
  return filename;
}

export async function runLocalRelease({ verifyOnly = false } = {}) {
  const admission = localMainAdmission();
  const sha = admission.sha;
  const scoped = managedCredentialFromFile(localTokenFile);
  const priorId = await currentVersion(scoped.token);
  const prior = await cloudflare("GET", "/versions/" + priorId, scoped.token);
  try {
    verifyCandidateMetadata(prior, sha);
    const publicAcceptance = checkPublic(origin);
    const receipt = {
      status: "ALREADY_ACTIVE", sha, versionId: priorId,
      ciVerdict: "PASS", publicAcceptance, checkedAt: new Date().toISOString(),
      channel: "owner-local-scoped-cloudflare",
      githubEnvironmentSecretUsed: false,
      commerceActive: false,
    };
    if (!verifyOnly) receipt.receiptPath = saveReceipt(receipt);
    return receipt;
  } catch {
    if (verifyOnly) throw Error("CURRENT_PRODUCTION_NOT_AT_EXACT_GREEN_HEAD");
  }

  const bun = availableBun();
  const buildEnv = { ...process.env, VITE_SITE_ORIGIN: origin };
  execute(bun, ["install", "--frozen-lockfile"], { cwd: storefront, env: buildEnv });
  execute(bun, ["run", "test"], { cwd: storefront, env: buildEnv });
  execute(bun, ["x", "tsc", "--noEmit"], { cwd: storefront, env: buildEnv });
  execute(bun, ["run", "lint"], { cwd: storefront, env: buildEnv });
  execute(bun, ["run", "build"], { cwd: storefront, env: buildEnv });
  execute(bun, ["x", "wrangler@4.135.0", "deploy", "--dry-run",
    "--config", "wrangler.jsonc", "--outdir", "/tmp/agent-shop-owner-release-" + sha.slice(0, 8)],
    { cwd: storefront, env: buildEnv });

  // Source drift or another owner release between build and promotion is fatal.
  localMainAdmission();
  if (await currentVersion(scoped.token) !== priorId) {
    throw Error("PRODUCTION_CHANGED_BEFORE_CANDIDATE_UPLOAD");
  }

  const runtimeEnv = {
    ...buildEnv, CLOUDFLARE_API_TOKEN: scoped.token, CLOUDFLARE_ACCOUNT_ID: scoped.accountId,
  };
  const uploaded = execute(bun, ["x", "wrangler@4.135.0", "versions", "upload",
    "--config", "wrangler.jsonc", "--preview-alias", "release-" + sha.slice(0, 8),
    "--tag", sha, "--message", "owner scoped release " + sha],
  { cwd: storefront, env: runtimeEnv });
  const { versionId, previewURL } = parseCandidateUpload(uploaded, sha);
  const preview = checkPublic(previewURL);
  const candidate = await cloudflare("GET", "/versions/" + versionId, scoped.token);
  verifyCandidateMetadata(candidate, sha);

  localMainAdmission();
  if (await currentVersion(scoped.token) !== priorId) {
    throw Error("PRODUCTION_CHANGED_BEFORE_PROMOTION");
  }
  const promoted = await guardedPromote({
    sha, versionId, accountId: scoped.accountId, token: scoped.token,
    expectedPreviousVersion: priorId,
    publicVerifier: async (target) => checkPublic(target),
  });
  const receipt = {
    ...promoted, sha, ciVerdict: "PASS", preview,
    channel: "owner-local-scoped-cloudflare",
    githubEnvironmentSecretUsed: false, commerceActive: false,
    verifiedAt: new Date().toISOString(),
  };
  receipt.receiptPath = saveReceipt(receipt);
  return receipt;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args[0] && args[0] !== "--verify-only")) {
    console.error("Usage: node scripts/owner-local-release.mjs [--verify-only]");
    process.exitCode = 2;
  } else {
    runLocalRelease({ verifyOnly: args[0] === "--verify-only" })
      .then((receipt) => {
        // Never print managed token values or raw provider responses.
        console.log(JSON.stringify(receipt));
      })
      .catch((err) => {
        console.error("OWNER_LOCAL_RELEASE_FAILED " +
          (err instanceof Error ? err.message.slice(0, 120) : "UNKNOWN"));
        process.exitCode = 1;
      });
  }
}
