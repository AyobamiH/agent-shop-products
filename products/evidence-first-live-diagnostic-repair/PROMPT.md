# Evidence-first live diagnostic and repair

A production prompt for diagnosing and repairing failures in systems that call external providers without creating duplicate side effects, hiding uncertain outcomes or mistaking local execution for provider success.

This prompt is based on a working automation system that publishes through official provider APIs. It generalises the same method for deployments, payments, email delivery, storage, messaging and other consequential external writes.

## Requirements

- An existing TypeScript or JavaScript service that performs external API writes.
- A durable SQL database or equivalent transaction store.
- Official provider read APIs, status endpoints, receipts or object lookup methods.
- A test runner.
- A way to run the local path without making an external write.
- Explicit authority for any real diagnostic write.
- An idempotency or correlation mechanism that can survive retries and restarts.

The prompt assumes that provider responses may be delayed, ambiguous or wrong for determining final state. A successful local function return is never sufficient evidence by itself.

## Prompt: diagnose and repair an external write path without duplicates

Paste everything below the line into an AI coding assistant. Replace bracketed provider and repository names where required, but preserve the evidence rules, write limits and terminal classifications.

---

Diagnose and permanently repair the failing external-write path in this repository.

Do not treat this as a one-off manual retry. The objective is to discover the actual defect, prove the provider-side outcome, repair the production code path, and leave behind a deterministic workflow that behaves correctly on retries, crashes and ambiguous responses.

The first supported operation should be one bounded external action such as:

```text
publish one approved social post
deploy one immutable release
send one approved transactional message
create one provider object
```

Choose the smallest action that reproduces the current failure. Do not broaden the live diagnostic to unrelated providers or actions.

## Core doctrine

Use this ordering of authority:

```text
provider-side readback
→ durable local evidence
→ request and response capture
→ runtime logs
→ source code
→ documentation
→ assumptions
```

When sources disagree, prefer the higher source and record the contradiction.

The following statements are not proof of success:

- the scheduler fired;
- the worker ran;
- the function returned;
- the HTTP client did not throw;
- the provider returned `200` or `201`;
- a container or job was created;
- a local row says `published`;
- a log line says `success`;
- the process exited with code zero.

Success means the intended provider-side object or effect was independently found through an official read path and matched against the approved payload.

## Required outcome model

Every diagnostic or production attempt must end in exactly one terminal classification:

```ts
type ExternalWriteOutcome =
  | "verified_present"
  | "confirmed_absent"
  | "verified_rejected"
  | "unresolved";
```

Definitions:

### `verified_present`

Use only when official provider readback proves that the intended effect exists and matches the approved identity and payload.

### `confirmed_absent`

Use only when all authoritative read paths prove the effect does not exist, the provider's consistency window has elapsed, and no duplicate can later appear from the original request.

### `verified_rejected`

Use when the provider proves that it rejected the request and did not create the effect.

### `unresolved`

Use whenever evidence is incomplete, contradictory, delayed or ambiguous.

`unresolved` must never be converted into `confirmed_absent` merely because a timeout expired locally.

## Phase 1: establish the failure without changing state

Start with read-only reconnaissance.

Inspect:

- the entrypoint that initiates the external action;
- scheduler, queue and worker ownership;
- payload preparation;
- approval and policy checks;
- connector or provider adapter;
- request construction;
- API version and endpoint selection;
- account, tenant, project or resource identifiers;
- response parsing;
- durable state transitions;
- retry and timeout behaviour;
- idempotency key generation;
- reconciliation;
- provider readback;
- duplicate detection;
- alerting and operator summaries.

Produce an execution map:

```text
trigger
→ candidate selection
→ payload freeze
→ authority check
→ idempotency claim
→ provider request
→ response capture
→ provider readback
→ reconciliation
→ terminal outcome
```

For every stage, identify:

- source file and function;
- input;
- output;
- durable record;
- possible side effect;
- retry owner;
- timeout owner;
- evidence available;
- failure mode.

Do not modify source, configuration, schedules, database rows or provider state during this phase.

## Phase 2: freeze the exact intended action

Before any real API call, create an immutable diagnostic intent.

```ts
interface DiagnosticIntent {
  schema: "external-write-diagnostic-intent";
  schemaVersion: "1.0.0";
  diagnosticId: string;
  operationType: string;
  provider: string;
  accountScopeDigest: string;
  payloadDigest: string;
  payloadSnapshot: unknown;
  requestedBy: string;
  reason: string;
  createdAt: string;
  expiresAt: string;
  maximumExternalWrites: 1;
}
```

Requirements:

- Canonicalise the payload before hashing.
- Remove secrets from the stored snapshot.
- Bind the intent to one provider, one account scope and one operation.
- Set `maximumExternalWrites` to exactly `1`.
- Make the intent expire.
- Refuse payload mutation after approval.
- Refuse execution if the provider, account scope or payload digest differs.
- Store the approval separately from the executor.

Do not approve a human-readable summary while allowing the actual request body to change later.

## Phase 3: capture the current provider state

Before the diagnostic write, query every official read path needed to prove the current state.

Examples:

- object lookup by provider ID;
- listing recent objects within a bounded time window;
- lookup by client reference or idempotency key;
- account activity or delivery status;
- deployment or job status;
- provider event history;
- webhook event store if already configured;
- provider-side duplicate search using a stable payload fingerprint.

Create a before snapshot:

```ts
interface ProviderSnapshot {
  observedAt: string;
  providerAccountDigest: string;
  queryMethods: Array<{
    name: string;
    requestDigest: string;
    responseStatus: number | null;
    responseDigest: string | null;
    resultCount: number;
    boundedSummary: unknown;
  }>;
  matchingObjects: Array<{
    providerObjectId: string;
    createdAt: string | null;
    state: string | null;
    identityDigest: string;
    payloadDigest: string | null;
  }>;
}
```

If a matching effect already exists, do not write again. Reconcile the local record to `verified_present` and report that the failure was local-state drift, not provider absence.

## Phase 4: define an identity that survives uncertainty

Every external action must have a stable identity independent of transient provider response IDs.

Use:

```ts
interface ExternalActionIdentity {
  operationType: string;
  provider: string;
  accountScopeDigest: string;
  approvedPayloadDigest: string;
  logicalSlot?: string;
  clientReference?: string;
  idempotencyKey: string;
}
```

The identity must be deterministic for the same approved action.

Do not generate a fresh idempotency key on retry.

Persist a unique constraint equivalent to:

```sql
CREATE UNIQUE INDEX external_action_identity_unique
ON external_actions (
  operation_type,
  provider,
  account_scope_digest,
  approved_payload_digest,
  logical_slot
);
```

If `logical_slot` is not applicable, use another stable business identifier.

The provider object ID is evidence returned after the action. It is not the action's primary identity.

## Phase 5: durable attempt state

Persist attempts before calling the provider.

```sql
CREATE TABLE external_actions (
  action_id TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  account_scope_digest TEXT NOT NULL,
  approved_payload_digest TEXT NOT NULL,
  logical_slot TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  provider_object_id TEXT,
  terminal_outcome TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE external_action_attempts (
  attempt_id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL,
  iteration INTEGER NOT NULL,
  request_digest TEXT NOT NULL,
  request_started_at TEXT,
  response_received_at TEXT,
  response_status INTEGER,
  response_digest TEXT,
  provider_object_id TEXT,
  classification TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (action_id, iteration)
);

CREATE TABLE external_action_events (
  action_id TEXT NOT NULL,
  sequence_number INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  previous_event_digest TEXT,
  event_digest TEXT NOT NULL,
  event_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (action_id, sequence_number)
);
```

Use a state machine:

```text
INTENT_FROZEN
→ BEFORE_READBACK_COMPLETE
→ CLAIMED
→ REQUEST_STARTED
→ RESPONSE_CAPTURED
→ READBACK_PENDING
→ VERIFIED_PRESENT
| CONFIRMED_ABSENT
| VERIFIED_REJECTED
| UNRESOLVED
```

A crash at any non-terminal state must resume with readback, not automatically repeat the write.

## Phase 6: separate local preparation from the live call

Build a dry-run or zero-write command that executes the complete path except the provider mutation.

It must prove:

- the candidate is uniquely selected;
- the approved payload is loaded;
- the request endpoint is resolved;
- API version is resolved;
- account and resource identifiers are resolved;
- headers are complete without printing secrets;
- the request body matches the approved digest;
- the idempotency key is stable;
- policy permits one write;
- the before snapshot contains no duplicate;
- readback queries are available;
- the attempt can be durably claimed;
- no provider write method is reachable in zero-write mode.

Return a machine-readable preflight report:

```ts
interface LiveDiagnosticPreflight {
  eligible: boolean;
  diagnosticId: string;
  actionIdentityDigest: string;
  endpointDigest: string;
  apiVersion: string;
  requestDigest: string;
  idempotencyKeyDigest: string;
  beforeReadbackComplete: boolean;
  duplicateFound: boolean;
  writeBudget: {
    maximum: 1;
    consumed: 0 | 1;
  };
  blockers: string[];
}
```

Do not proceed unless `eligible` is true and `blockers` is empty.

## Phase 7: authorise one real diagnostic write

The live diagnostic may perform at most one external write for the frozen action.

Authority must explicitly bind:

- diagnostic ID;
- provider;
- account scope digest;
- operation type;
- approved payload digest;
- idempotency key digest;
- maximum external writes;
- expiry;
- issuer;
- nonce.

Before the call, atomically claim the action and consume the write budget.

Concurrent workers must not both win.

If the write budget is already consumed, perform readback only.

## Phase 8: capture the exact request and response

Store a sanitised request envelope before transmission:

```ts
interface ProviderRequestEvidence {
  method: string;
  endpointTemplate: string;
  endpointDigest: string;
  apiVersion: string;
  accountScopeDigest: string;
  headersDigest: string;
  bodyDigest: string;
  idempotencyKeyDigest: string;
  startedAt: string;
}
```

Capture:

- transport start time;
- DNS, connection and timeout category where available;
- HTTP status;
- provider error code and subcode;
- response headers needed for correlation;
- provider request or trace ID;
- response body digest;
- returned provider object ID;
- transport completion time.

Never store access tokens, private keys, complete credentials or secret-bearing response fields.

## Phase 9: do not classify from the immediate response alone

Use the immediate response only to guide readback.

Examples:

### Provider returns success and an object ID

Query that object through the official read API. Verify account ownership, payload identity and terminal state.

### Provider returns success without an object ID

Search by idempotency key, client reference, logical slot and bounded creation window.

### Provider returns a validation or policy error

Confirm through provider status or absence queries that no object was created.

### Provider times out

Assume the write may have happened. Do not retry. Enter `READBACK_PENDING`.

### Connection drops after request transmission

Assume the write may have happened. Do not retry. Enter `READBACK_PENDING`.

### Provider returns a resource-not-found error

Determine which resource was missing:

- account;
- parent container;
- child object;
- upload session;
- versioned endpoint;
- stale provider object ID.

Do not reinterpret all resource-not-found errors as final absence.

### Provider returns a duplicate or conflict

Locate the existing provider object and reconcile it against the approved action identity.

## Phase 10: bounded provider readback

Implement a bounded readback schedule based on the provider's consistency characteristics.

Example:

```text
immediate
+2 seconds
+5 seconds
+15 seconds
+30 seconds
+60 seconds
```

The exact schedule may be changed only when supported by provider documentation or measured behaviour.

Each readback iteration must record:

- query method;
- request digest;
- response status;
- response digest;
- matching objects;
- provider object state;
- identity match;
- payload match;
- timestamp.

Stop early on authoritative evidence.

Do not issue another write during readback.

## Phase 11: terminal classification rules

Classify `verified_present` only when all required checks pass:

```ts
const verifiedPresent =
  providerObjectFound &&
  providerAccountMatches &&
  operationTypeMatches &&
  approvedPayloadMatches &&
  noConflictingDuplicate &&
  providerStateIsAcceptable;
```

Classify `verified_rejected` only when the provider gives authoritative rejection evidence and no matching object exists.

Classify `confirmed_absent` only when:

- the request is known not to be queued;
- all supported lookup methods find no matching object;
- the provider consistency window has elapsed;
- no asynchronous child operation remains;
- the idempotency key is not attached to a pending request;
- no webhook or event evidence indicates delayed creation;
- the provider's own status is terminal.

Otherwise classify `unresolved`.

Never turn `unresolved` into success to keep a schedule green.

Never turn `unresolved` into absence merely to permit another attempt.

## Phase 12: evidence-led repair iterations

After the diagnostic outcome, identify the smallest defect supported by evidence.

Possible defect classes:

```ts
type DefectClass =
  | "wrong_endpoint"
  | "wrong_api_version"
  | "wrong_account_scope"
  | "wrong_parent_resource"
  | "stale_provider_object_id"
  | "invalid_request_shape"
  | "missing_required_field"
  | "incorrect_content_encoding"
  | "unsupported_media_or_payload"
  | "premature_state_transition"
  | "response_parser_defect"
  | "missing_readback"
  | "idempotency_defect"
  | "retry_ownership_defect"
  | "scheduler_ownership_defect"
  | "local_state_drift"
  | "provider_policy_rejection"
  | "unknown";
```

For each iteration:

1. state the evidence;
2. assign one defect class;
3. identify the exact source location;
4. describe the smallest repair;
5. add a regression test first where practical;
6. implement the repair;
7. run local and zero-write verification;
8. decide whether another live attempt is permitted.

A second live write is permitted only for a new iteration when:

- the prior outcome is `confirmed_absent` or `verified_rejected`;
- the repair changes a request property proven defective;
- a new diagnostic intent is frozen;
- a new one-write authority is granted;
- duplicate search is clean;
- the same logical action identity remains protected;
- the total activity remains within the user's explicit authority.

If the prior outcome is `unresolved`, continue reconciliation. Do not write again.

## Phase 13: convert the repair into the permanent production path

Do not leave the working logic inside a temporary script.

Move the proven behaviour into the authoritative adapter or execution service.

The permanent path must include:

- immutable approved payloads;
- stable action identity;
- durable idempotency;
- pre-write duplicate readback;
- one write owner;
- request evidence;
- response evidence;
- provider readback;
- terminal classification;
- restart reconciliation;
- bounded alerts;
- operator-visible evidence;
- no hidden browser or manual fallback.

Delete or disable temporary diagnostic entrypoints only after the production path has equivalent tests and evidence.

## Phase 14: enforce one write owner

Inventory every component capable of performing the action:

- cron schedules;
- internal schedulers;
- queue workers;
- graph nodes;
- command-line scripts;
- retry workers;
- admin endpoints;
- manual runbooks;
- browser automations;
- legacy services.

For the migrated action, exactly one component may call the provider write adapter.

All other components must:

- enqueue an immutable intent;
- request readback;
- reconcile state;
- or refuse execution.

Add a startup assertion or ownership registry:

```ts
interface WriteOwnership {
  operationType: string;
  owner: string;
  activatedAt: string;
  supersedes: string[];
}
```

Fail closed if two active owners claim the same operation.

## Phase 15: crash and restart recovery

Test crashes at these points:

1. after durable claim, before request transmission;
2. after request transmission, before response capture;
3. after response capture, before readback;
4. after provider effect creation, before local state update;
5. after readback, before terminal event persistence;
6. after terminal persistence, before caller response.

Recovery rules:

- never infer absence from a missing response;
- never repeat the write solely because the process restarted;
- inspect durable claim state;
- inspect request-start evidence;
- inspect provider readback;
- return the original terminal result when already complete;
- preserve append-only events;
- mark contradictions `unresolved`.

## Phase 16: tests

Create unit tests for:

- canonical payload digest stability;
- stable idempotency key generation;
- action identity uniqueness;
- authority expiry;
- one-write budget consumption;
- duplicate detection;
- request sanitisation;
- response parsing;
- provider error-code preservation;
- terminal classification;
- `unresolved` fail-closed behaviour;
- write-owner exclusivity.

Create integration tests for:

- successful write plus readback;
- success response with missing provider object;
- timeout followed by object discovery;
- timeout followed by unresolved readback;
- validation rejection with confirmed absence;
- duplicate conflict resolving to an existing matching object;
- stale provider object ID;
- wrong account or parent resource;
- crash after transmission;
- concurrent workers;
- restart reconciliation;
- repeated invocation returning the same terminal evidence;
- legacy scheduler attempting a second write.

Use a deterministic fake provider that can model:

```text
accepted synchronously
accepted asynchronously
rejected before creation
created but response lost
delayed read visibility
duplicate conflict
stale resource
ambiguous timeout
contradictory read paths
```

## Phase 17: one bounded live proof

After all local checks pass, perform one authorised live proof against a non-destructive or explicitly approved action.

The proof report must include:

```ts
interface LiveProofReport {
  diagnosticId: string;
  actionIdentityDigest: string;
  writeBudgetMaximum: 1;
  writeBudgetConsumed: 0 | 1;
  providerRequests: number;
  providerWrites: number;
  readbackQueries: number;
  terminalOutcome: ExternalWriteOutcome;
  providerObjectId?: string;
  approvedPayloadDigest: string;
  observedPayloadDigest?: string;
  duplicateCount: number;
  eventChainValid: boolean;
  restartSafe: boolean;
  productionPathUpdated: boolean;
  evidenceLocations: string[];
}
```

A passing proof requires:

```text
providerWrites = 1
terminalOutcome = verified_present
approvedPayloadDigest = observedPayloadDigest
duplicateCount = 0
eventChainValid = true
restartSafe = true
productionPathUpdated = true
```

If the action is correctly refused or the provider rejects it, report that honestly. Do not manufacture a success proof.

## Completion contract

Do not declare the repair complete until all of the following are true:

- the original failure has an evidence-backed defect classification;
- the provider-side outcome of every live attempt is terminally classified;
- there are no unresolved attempts hidden as failed or successful;
- no duplicate provider effect exists;
- the successful repair is in the authoritative production path;
- one component owns the provider write;
- retries and restarts reconcile before writing;
- the same approved action cannot mutate twice;
- provider readback is required for success;
- local status cannot outrank provider evidence;
- regression tests cover the original failure;
- the live proof report is stored;
- rollback or compensation is documented where the provider supports it;
- secrets and private identifiers are absent from committed evidence.

Finish with:

1. the original symptom;
2. the proven root cause;
3. the exact source changes;
4. the tests run;
5. the number of provider writes;
6. the provider readback evidence;
7. the terminal outcome;
8. duplicate status;
9. write ownership;
10. remaining limitations.

Do not end with “the request completed successfully.” End with the provider-side evidence that proves what actually happened.

---

## What makes this prompt work

The important constraint is not the one-write diagnostic budget by itself. It is the rule that an uncertain response triggers readback rather than another write.

The durable action identity prevents retries, restarts and multiple schedulers from creating duplicates. The four terminal outcomes prevent ambiguous evidence from being forced into a binary success/failure model. Finally, moving the proven repair into the authoritative production adapter stops a successful diagnostic from becoming an undocumented manual workaround.
