# Signed agent action receipts

A production prompt for building an evidence-bound execution system in which consequential agent actions require transaction-specific approval, execute exactly once, are independently verified and produce offline-verifiable signed receipts.

This prompt is based on a working TypeScript implementation that protects one bounded repository-patch action. It starts with one action deliberately rather than claiming to secure arbitrary tool calls.

## Requirements

- Node.js 22.5 or newer with ESM and strict TypeScript.
- Git and a local filesystem.
- Durable SQL storage such as SQLite or PostgreSQL.
- Separate Ed25519 keys for approval authority and receipt signing.
- SHA-256 support.
- A disposable Git repository for the end-to-end demonstration.
- A child-process API so mutation can be isolated from proposal, approval and signing.

No graph framework, hosted authority or external cryptography package is required. Prefer Node's standard cryptography primitives and the repository's existing SQL layer.

## Prompt: build independently verifiable receipts for agent actions

Paste everything below the line into an AI coding assistant. Replace bracketed names where the repository requires them, but keep the trust boundaries, canonicalisation rules and failure semantics unchanged.

---

Build a production-grade signed receipt system for consequential agent actions.

Protect one action first:

```text
agentproof.repository_patch.v1
```

It must prepare an exact allowlisted patch against a clean local Git repository, bind approval to that prepared state, execute through a separate process, independently verify repository state, recover deterministically and emit a signed Receipt V2.

Do not begin with a generic tool framework. Complete and verify this action end to end, then expose extension points.

## Terminal objective

The implementation must prove:

1. the exact approved transaction was executed;
2. one idempotency key causes at most one repository mutation;
3. an identical retry returns the original signed receipt;
4. verification re-observes state instead of trusting an executor success claim;
5. the receipt binds authority, transaction, correlation, policy, evidence and outcome;
6. signature validity and signer trust are evaluated separately;
7. interrupted execution is reconciled from observed state;
8. compensation creates a linked successor receipt and never rewrites history.

## Five trust roles

Keep these roles distinct in code and data.

### Proposer

- Describes intent and acceptance criteria.
- Prepares a bounded transaction.
- Cannot approve it.
- Cannot sign its receipt.

### Approval authority

- Approves or rejects one exact prepared request.
- Binds the decision to request digest, transaction ID, correlation ID, authority environment, issuer, expiry and nonce.
- Uses different key material from the receipt signer.
- Cannot mutate through the executor interface.

### Executor

- Accepts only a valid, unexpired, unused approval.
- Applies only the prepared bounded mutation.
- Runs separately from the proposer.
- Has neither approval nor receipt-signing private keys.

### Receipt signer

- Signs independently assembled verified evidence through an injected signing provider.
- Does not perform the mutation.
- Cannot sign an executor's unverified claim as success.

### Offline verifier

- Reconstructs canonical signature bytes.
- Recomputes digests and verifies Ed25519.
- Applies a caller-supplied trusted fingerprint and authority policy.
- Returns identities only from the signed payload.
- Does not trust the executor, transport envelope or embedded public key by default.

A development build may run processes under one OS account. Document that this is capability separation, not an operating-system sandbox.

## Package shape

Create a small ESM TypeScript package with modules for:

```text
actions/repository-patch
approval
canonical-json
crypto
execution-and-reconciliation
receipts
storage
cli
```

Also provide:

```text
docs/trust-model.md
docs/signed-receipt-v2.md
docs/repository-patch-v1.md
test/unit
test/integration
test/adversarial
```

Use strict TypeScript and no `any`.

Package imports must not:

- make network calls;
- inspect environment variables;
- discover repositories;
- create files;
- start services;
- start background timers.

Every operation receives an explicit absolute state directory and repository root.

## Repository-patch request

Support only:

```ts
type RepositoryPatchOperation =
  | { kind: "write"; path: string; contentBase64: string }
  | { kind: "delete"; path: string };

interface RepositoryPatchRequest {
  schema: "agentproof.protocol.repository-patch-request";
  schemaVersion: "1.0.0";
  actionType: "agentproof.repository_patch.v1";
  correlationId: string;
  stateDirectory: string;
  action: {
    type: "agentproof.repository_patch.v1";
    repositoryRoot: string;
    operations: RepositoryPatchOperation[];
  };
  intent: {
    summary: string;
    requestedBy: string;
    acceptanceCriteria: string[];
  };
  policy: {
    allowedRepositoryRoot: string;
    allowedTrackedPaths: string[];
    allowedNewPaths: string[];
    maxPatchBytes: number;
    maxFiles: number;
  };
}
```

For the reproducible demonstration use:

```text
maxPatchBytes = 1024
maxFiles = 1
allowedTrackedPaths = ["protected.txt"]
allowedNewPaths = []
```

The action must not commit, push, tag, deploy or mutate remotes.

## Preparation

Preparation is read-only.

Reject:

- non-absolute roots;
- a repository outside the allowed root;
- dirty worktrees;
- detached HEAD;
- symlinks;
- submodules;
- path traversal or absolute operation paths;
- `.git` writes;
- undeclared tracked or new files;
- duplicate operations for one path;
- malformed Base64;
- unsupported operations;
- byte or file-count overflow;
- secret-bearing paths or obvious secret content;
- before-state changes during preparation.

Create an immutable prepared transaction containing:

- independent transaction ID and correlation ID;
- action type;
- explicit state directory;
- repository root, branch and HEAD;
- remote configuration digest;
- complete before-manifest digest;
- exact operations;
- before and expected-after digests per path;
- intent and acceptance criteria;
- policy;
- preparation timestamp;
- request digest.

The request digest covers the complete canonical prepared transaction except the digest field itself.

Approval targets that digest, not a summary.

## Canonical JSON

Use one canonical JSON function for all signing and hashing.

It must:

- recursively sort object keys by Unicode code-unit order;
- preserve array order and JSON string code points;
- preserve `null`;
- normalise negative zero to zero;
- reject non-finite numbers;
- reject `undefined`, functions, symbols and bigint;
- reject non-plain objects and cycles;
- reject duplicate keys while parsing CLI JSON.

Do not rely on ordinary object insertion order as a security boundary.

## Approval protocol

Create a deterministic approval request containing:

```ts
interface ApprovalRequest {
  schema: "agentproof.protocol.approval-request";
  schemaVersion: "1.0.0";
  actionType: "agentproof.repository_patch.v1";
  transactionId: string;
  correlationId: string;
  requestDigest: string;
  intentSummary: string;
  authorityEnvironmentRequired: "development" | "production";
  expiresAt: string;
  nonce: string;
}
```

The development demonstration uses a ten-minute expiry.

The authority signs a payload containing:

- decision: `approved` or `rejected`;
- action type;
- transaction ID;
- correlation ID;
- request digest;
- authority environment;
- issuer;
- issued and expiry timestamps;
- nonce.

Use proof fields:

```ts
interface SignatureProof {
  algorithm: "Ed25519";
  publicKeyPem: string;
  keyFingerprint: string;
  payloadDigest: string;
  signatureBase64: string;
}
```

Provide a separate development authority:

```text
agentproof-dev-authority --development
```

It must require the explicit `--development` flag.

Development approval must fail when execution requires production authority.

The primary CLI must have no:

```text
--force
--skip-approval
--auto-approve
```

and no implicit development-authority fallback.

## Execution request

Require:

```ts
interface ExecutionRequest {
  schema: "agentproof.protocol.execution-request";
  schemaVersion: "1.0.0";
  actionType: "agentproof.repository_patch.v1";
  transactionId: string;
  correlationId: string;
  stateDirectory: string;
  idempotencyKey: string;
  requiredAuthorityEnvironment: "development" | "production";
  trustedAuthorityFingerprints: string[];
  approvalDecision: {
    payload: unknown;
    proof: SignatureProof;
  };
}
```

Replace `unknown` with the exact approval payload type during implementation.

Before mutation verify:

- complete schema and version;
- action type;
- transaction and correlation IDs;
- request digest;
- approved decision;
- approval signature and fingerprint;
- authority environment;
- expiry and nonce;
- prepared state;
- exact before-state;
- unused approval;
- consistent idempotency binding.

Any mismatch fails before a write.

## Durable state

Persist at least:

```text
transactions
idempotency_claims
approval_consumption
transaction_events
receipts
```

Database constraints must enforce:

- unique transaction IDs;
- unique idempotency keys;
- one transaction and request digest per idempotency key;
- single-use approval payload digests;
- ordered event sequence numbers;
- unique receipt payload digests.

Do not use in-memory maps as the source of truth.

Use this state machine:

```text
PREPARED
  → APPROVAL_ACCEPTED
  → CLAIMED
  → EXECUTING
  → MUTATION_OBSERVED
  → VERIFIED
  → RECEIPT_SIGNED
  → COMPLETED

Failure and recovery states:
  REJECTED
  FAILED
  RECONCILIATION_REQUIRED
  COMPENSATION_REQUIRED
  COMPENSATED
```

Every transition appends an event containing transaction ID, correlation ID, sequence number, previous event digest, event digest, actor role, event type, timestamp and bounded metadata.

Never overwrite history to make the final state look cleaner.

## Exactly-once execution

Exactly-once means one externally observable mutation for one approved transaction and idempotency key.

Implement:

1. claim the idempotency key durably before mutation;
2. bind it to transaction ID and request digest;
3. reject the same key with different data;
4. allow one winner under concurrent claims;
5. store the terminal receipt with the claim;
6. return the exact original receipt bytes on identical retry;
7. reconcile non-terminal claims from observed state;
8. never rerun mutation merely because signing or response delivery failed.

The integration test must execute the same request twice and show identical SHA-256 values for both receipt files.

## Separate executor

Run mutation in a child process with a narrow JSON document.

It may receive:

- repository root;
- exact operations;
- expected HEAD and before digests;
- bounded policy;
- transaction ID.

It must not receive:

- authority private key;
- receipt-signing private key;
- arbitrary shell text;
- network credentials;
- unrelated environment variables.

Spawn with an explicit environment allowlist.

Capture bounded exit code, stdout, stderr and timing evidence. Exit code zero is not proof of success.

## Independent observation

After mutation, a verifier that did not perform it must re-read the repository.

Verify:

- repository identity;
- branch and HEAD;
- changed paths;
- expected file digests;
- no undeclared changes;
- unchanged remotes;
- bounded acceptance checks.

Represent the result as:

```ts
interface VerifiedEvidence {
  verifierVersion: string;
  observedAt: string;
  repository: {
    headSha: string;
    branch: string;
    remotesDigest: string;
    changedPaths: string[];
    afterManifestDigest: string;
  };
  operations: Array<{
    path: string;
    expectedAfterDigest: string | null;
    observedAfterDigest: string | null;
    matches: boolean;
  }>;
  checks: Array<{
    name: string;
    exitCode?: number;
    stdoutDigest?: string;
    stderrDigest?: string;
    passed: boolean;
  }>;
  outcome: "verified_success" | "verified_failure" | "unresolved";
}
```

Only `verified_success` can produce a success receipt.

`unresolved` remains unresolved.

## Signed Receipt V2

Use the exact domain separator:

```text
agentproof.signed-receipt.v2\0
```

Signature input:

```text
UTF-8("agentproof.signed-receipt.v2\0" + canonicalJson(payload))
```

Receipt shape:

```ts
interface SignedReceiptV2 {
  payload: {
    schema: "agentproof.signed-receipt";
    schemaVersion: "2.0.0";
    receiptId: string;
    actionType: "agentproof.repository_patch.v1";
    transactionId: string;
    correlationId: string;
    idempotencyKeyDigest: string;
    requestDigest: string;
    authority: {
      environment: "development" | "production";
      issuer: string;
      approvalPayloadDigest: string;
      authorityKeyFingerprint: string;
      expiresAt: string;
      nonce: string;
    };
    execution: {
      claimedAt: string;
      startedAt: string;
      observedAt: string;
      completedAt: string;
      executorVersion: string;
    };
    intent: {
      summary: string;
      requestedBy: string;
      acceptanceCriteria: string[];
    };
    policyDigest: string;
    evidence: VerifiedEvidence;
    result: {
      status: "verified_success" | "verified_failure" | "compensated";
      summary: string;
    };
    predecessorPayloadDigest?: string;
  };
  proof: SignatureProof;
}
```

`proof.payloadDigest` is SHA-256 of the exact domain-separated signature bytes.

Every verified identity and policy claim must come from the signed payload, never an unsigned wrapper.

## Validity is not trust

Derive the signer fingerprint from the canonical public key representation using SHA-256:

```text
sha256:<lowercase-hex>
```

An embedded public key proves signature self-consistency only.

The offline verifier requires a trusted fingerprint supplied out of band:

```text
agentproof verify-receipt \
  --input ./receipt.json \
  --trust-fingerprint sha256:<trusted-fingerprint>
```

Return separately:

```ts
{
  cryptographicallyValid: boolean;
  trusted: boolean;
  signerFingerprint: string;
  authorityEnvironment: "development" | "production" | null;
  reasons: string[];
}
```

A valid signature from an unpinned key must return:

```text
cryptographicallyValid = true
trusted = false
```

## Legacy receipts

Reject a legacy receipt format that failed to bind authority environment, transaction ID or correlation ID.

Even a mathematically valid legacy signature must return:

```text
trusted = false
reason = "legacy_unbound_receipt"
```

Do not rewrite, upgrade or re-sign historical receipts in place.

## Crash reconciliation

Filesystem mutation and SQL cannot form one atomic distributed transaction.

Test crashes:

- after claim, before mutation;
- during mutation;
- after mutation, before observation;
- after observation, before signing;
- after signing, before response delivery.

On restart:

1. load prepared state and event chain;
2. re-observe the repository;
3. classify it as exact-before, exact-after, divergent or unreadable;
4. continue only from that evidence;
5. sign success only for verified exact-after state;
6. return the stored receipt if already signed;
7. require compensation or escalation for divergence.

Never rerun a write solely because the last event says `EXECUTING`.

## Compensation

Compensation is a new authenticated action.

It must:

- require a trusted predecessor receipt;
- verify its signature, fingerprint and authority policy;
- confirm current state matches its verified after-state;
- restore the prepared before-state when possible;
- independently verify restoration;
- issue a new signed Receipt V2;
- bind the predecessor using `predecessorPayloadDigest`.

Never mutate the predecessor receipt.

The chain is append-only:

```text
verified action receipt
  → compensation receipt
  → optional later successor
```

Reject broken or untrusted chains.

## CLI and SDK

Implement:

```text
agentproof prepare repository-patch --input <request.json>
agentproof approval-request --input <prepared.json> --expires-at <iso> --nonce <nonce>
agentproof execute --input <execution.json> --receipt-key <private.pem>
agentproof status --input <status-query.json>
agentproof reconcile --input <status-query.json> --receipt-key <private.pem>
agentproof compensate --input <status-query.json> --receipt-key <private.pem> --trust-fingerprint <fingerprint> --authority-environment <environment>
agentproof verify-receipt --input <receipt.json> --trust-fingerprint <fingerprint> --required-authority-environment <environment>

agentproof-dev-authority --development keygen --private-key-output <private.pem>
agentproof-dev-authority --development decide --input <approval-request.json> --private-key <private.pem> --decision approved --issuer <issuer>
```

Stdout is machine-readable JSON. Human diagnostics go to stderr. Never print private keys.

Expose stable SDK operations:

```ts
prepareRepositoryPatch
createApprovalRequest
executeApprovedTransaction
getTransactionStatus
reconcileRepositoryPatch
compensateRepositoryPatchWithReceipt
verifyReceipt
```

## Required tests

Write unit, integration and adversarial tests proving:

### Preparation

- a clean allowlisted one-file patch prepares;
- dirty, detached, symlinked, submodule or drifting repositories fail;
- path traversal and `.git` paths fail;
- undeclared paths and size limits fail.

### Approval

- transaction ID, correlation ID and request digest are bound;
- altered or expired decisions fail;
- one approval cannot authorise another transaction;
- development authority cannot satisfy production policy.

### Exactly once

- the first execution mutates once;
- identical retry returns byte-for-byte identical receipt;
- conflicting idempotency reuse fails;
- concurrent execution has one winner;
- approval consumption survives restart.

### Verification and receipts

- exit code zero with wrong state is failure;
- undeclared changes or remote drift fail;
- unpinned signer is valid but untrusted;
- changing any signed field breaks verification;
- duplicate-key JSON fails;
- legacy unbound receipt is never trusted;
- identities are derived only from signed payload.

### Recovery and compensation

- crash before mutation does not duplicate;
- crash after mutation reconciles exact-after state;
- crash after signing returns the stored receipt;
- divergent state cannot become success;
- compensation requires a trusted predecessor;
- successor binds predecessor digest;
- predecessor remains unchanged.

## Reproducible demonstration

Create a disposable repository:

```sh
LAB="$(mktemp -d)"
REPO="$LAB/repository"
STATE="$LAB/state"

mkdir -p "$REPO"
git -C "$REPO" init -b main
git -C "$REPO" config user.email agentproof@example.invalid
git -C "$REPO" config user.name "AgentProof Quickstart"

printf 'before\n' > "$REPO/protected.txt"
git -C "$REPO" add protected.txt
git -C "$REPO" commit -m baseline
```

Prepare one approved write changing `protected.txt` to:

```text
after
```

Use:

```text
correlationId = "readme-quickstart-001"
maxPatchBytes = 1024
maxFiles = 1
allowedTrackedPaths = ["protected.txt"]
```

Demonstrate:

1. prepare;
2. ten-minute approval request;
3. development authority key generation;
4. signed development approval;
5. independent receipt key generation;
6. execution;
7. offline verification using the pinned receipt fingerprint;
8. identical retry;
9. receipt SHA-256 equality;
10. compensation;
11. clean repository after compensation.

Expected verification:

```text
cryptographicallyValid: true
trusted: true
```

The compensation receipt must bind the original payload digest.

The final check must pass:

```sh
test "$(git -C "$REPO" status --porcelain)" = ""
```

## Security documentation

Document explicitly that the system does not prove:

- the proposer is benevolent;
- chosen verification commands are complete;
- the OS account is uncompromised;
- process separation is an OS sandbox;
- a development key is production authority;
- an embedded public key is trusted identity;
- SQL claiming and filesystem mutation form an atomic distributed commit.

Fail closed for altered approvals, expired authority, replay, inconsistent idempotency, untrusted fingerprints, before-state drift, path escapes, secret-bearing content, undeclared changes, missing evidence and broken predecessor chains.

## Completion contract

Do not report completion until:

- clean-checkout build and strict type checking pass;
- all unit, integration and adversarial tests pass;
- the disposable demonstration passes;
- retry receipts are byte-for-byte identical;
- validity and trust are distinguished;
- production policy rejects development authority;
- post-mutation crash reconciliation is proven;
- compensation emits a linked successor;
- the primary CLI has no approval bypass;
- the executor has no signing private keys;
- executor claims alone cannot create success receipts;
- limitations are documented honestly.

Finish with:

```text
Implemented:
Verified:
Exactly-once evidence:
Trust-boundary evidence:
Recovery evidence:
Compensation evidence:
Known limitations:
Next safe extension:
```

Name one additional bounded action as the next safe extension and explain which invariants are reused. Do not claim arbitrary-tool support until that action has its own preparation, authority, execution, observation, verification and receipt contract.
