import test from "node:test";
import assert from "node:assert/strict";
import { parseCandidateUpload } from "./parse-candidate-upload.mjs";
const sha = "0123456789abcdef0123456789abcdef01234567";
const uuid = "12345678-1234-1234-1234-123456789abc";
const receipt = [
  "Uploaded agent-shop",
  "Worker Version ID: " + uuid,
  "Version Preview Alias URL: https://release-01234567-agent-shop.woeinvests.workers.dev",
].join("\n");
test("parses exactly one immutable candidate and allowed preview origin", () =>
  assert.deepEqual(parseCandidateUpload(receipt, sha), {
    versionId: uuid, previewURL: "https://release-01234567-agent-shop.woeinvests.workers.dev",
  }));
test("rejects ambiguous version IDs", () =>
  assert.throws(() => parseCandidateUpload(receipt + "\nWorker Version ID: " + uuid, sha)));
test("rejects spoofed preview domains", () =>
  assert.throws(() => parseCandidateUpload(receipt.replace("woeinvests.workers.dev", "evil.example.com"), sha)));
test("rejects mismatched branch identity", () =>
  assert.throws(() => parseCandidateUpload(receipt, "f".repeat(40))));
test("rejects malformed SHA", () =>
  assert.throws(() => parseCandidateUpload(receipt, "latest")));
