import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { confirmLocalRelease, localMainAdmission, managedCredentialFromFile } from "./owner-local-release.mjs";

const sha = "d".repeat(40);
const run = {
  head_sha: sha, head_branch: "main", event: "push",
  status: "completed", conclusion: "success",
};

test("owner-local release requires clean current main and completed exact push CI", () => {
  assert.deepEqual(confirmLocalRelease({
    branch: "main", clean: true, localSha: sha,
    remoteSha: sha, ciRuns: [run],
  }), { sha, ciVerdict: "PASS" });
  for (const opts of [
    { branch: "feature" }, { clean: false }, { remoteSha: "a".repeat(40) },
    { ciRuns: [{ ...run, conclusion: "failure" }] },
    { ciRuns: [{ ...run, event: "pull_request" }] },
  ]) {
    assert.throws(() => confirmLocalRelease({
      branch: "main", clean: true, localSha: sha,
      remoteSha: sha, ciRuns: [run], ...opts,
    }));
  }
});

test("GH local admission consumes only GitHub's current main and exact push run", () => {
  const executed = [];
  const mock = (cmd, args) => {
    executed.push({ cmd, args });
    if (cmd === "git" && args[0] === "branch") return "main\n";
    if (cmd === "git" && args[0] === "status") return "";
    if (cmd === "git" && args[0] === "rev-parse") return sha + "\n";
    if (cmd === "gh" && args.includes(".object.sha")) return sha + "\n";
    if (cmd === "gh" && args[1].includes("/actions/workflows/")) {
      return JSON.stringify({ workflow_runs: [run] });
    }
    throw Error("MOCK_UNEXPECTED_COMMAND");
  };
  assert.deepEqual(localMainAdmission({ git: mock, gh: mock }), {
    sha, ciVerdict: "PASS",
  });
  assert.ok(executed.every((entry) => ["gh", "git"].includes(entry.cmd)));
  assert.ok(!executed.some((entry) => entry.args.some((a) => /token/i.test(a))));
});

test("managed account token must be present, correctly scoped and chmod 0600", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "agent-shop-token-test-"));
  const file = path.join(dir, "test.env");
  try {
    const line = [
      "CLOUDFLARE_API_TOKEN=synthetic-not-real-token-1",
      "CLOUDFLARE_API_TOKEN_ID=" + "a".repeat(32),
      "CLOUDFLARE_ACCOUNT_ID=6ddcbcb8474f1a7e460b2f0aabec0e2f",
    ].join("\n");
    writeFileSync(file, line + "\n", { mode: 0o600 });
    const safe = managedCredentialFromFile(file);
    assert.equal(safe.accountId, "6ddcbcb8474f1a7e460b2f0aabec0e2f");
    assert.equal(safe.token, "synthetic-not-real-token-1");
    chmodSync(file, 0o644);
    assert.throws(() => managedCredentialFromFile(file), /TOKEN_FILE_PERMISSION_UNSAFE/);
    chmodSync(file, 0o600);
    writeFileSync(file, line.replace("6ddcbcb8474f1a7e460b2f0aabec0e2f", "b".repeat(32)));
    assert.throws(() => managedCredentialFromFile(file), /MANAGED_SCOPED_CREDENTIAL_UNAVAILABLE/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
