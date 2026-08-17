# Graph-native agent system migration

A production migration prompt for replacing loosely connected jobs, schedulers and agent loops with a durable, resumable and evidence-first graph runtime. It is designed for systems that already perform real work and therefore cannot tolerate duplicate side effects, invented state or a risky big-bang rewrite.

## Requirements

- An existing TypeScript or JavaScript service with scheduled jobs, queues, task runners or agent workflows.
- A durable SQL database such as PostgreSQL or SQLite.
- A test runner and a way to inspect the live runtime without changing it.
- A zero-write or dry-run mode for exercising live inputs without calling external write APIs.
- Official read APIs, receipts or provider-side lookup methods for every external system the workflow changes.

The prompt does not require a graph framework. Prefer a small explicit runtime implemented inside the existing service unless the repository already has a suitable orchestration dependency.

## Prompt: migrate an agent system to a durable graph runtime

Paste everything below the line into an AI coding assistant. Replace bracketed names only where the existing repository requires them; do not simplify the invariants.

---

You are migrating an existing production automation or agent system from loosely connected tasks, schedulers and conversational loops into a durable graph-native runtime.

This is not a greenfield rewrite. Preserve verified behaviour, keep current integrations working and migrate incrementally. The system may already publish, deploy, send messages, modify records or call other external providers. A duplicate external write is a production defect.

## Primary objective

Build a graph runtime in which every meaningful unit of work has:

- an immutable graph definition and version;
- a durable run identity;
- guarded state transitions;
- append-only, hash-chained events;
- persisted checkpoints;
- explicit authority and approval decisions;
- idempotent external effects;
- bounded retries and repair loops;
- crash and restart recovery;
- parent and child run provenance;
- official provider readback before success is claimed;
- a verifiable completion receipt.

The final system must be able to resume a run after process death without repeating an already completed external effect.

## Non-negotiable migration rule

There must never be two authoritative owners for the same external effect.

A legacy scheduler and the new graph runtime may observe the same workflow during shadow validation, but they must not both be able to publish, deploy, send, charge, delete or otherwise write. Cutover means the old owner is disabled and evidenced before the new owner becomes write-capable.

## Evidence authority order

When sources disagree, use this order:

1. live runtime state and official provider readback;
2. executable code, database schema and current configuration;
3. current product and operations documentation;
4. historical reports, screenshots and assumptions.

Do not change code to match an old document when the running system proves that the document is stale. Record the discrepancy instead.

## Definition of complete

The migration is not complete because graph classes exist or tests compile.

Completion requires all of the following:

- one representative production workflow is owned by the graph runtime;
- the graph definition hash used by the run is preserved;
- the event chain verifies from genesis to terminal event;
- the final checkpoint matches the reduced event state;
- every effect is terminal and reconciled;
- external writes remain within the graph's declared budget;
- provider readback matches the approved payload or requested change;
- no duplicate provider object exists;
- the legacy owner for that workflow is disabled;
- restart recovery has been exercised;
- rollback instructions and evidence locations are recorded;
- the next natural scheduled cycle succeeds without a person manually starting it.

If any item is unverified, report `not verified`; do not convert missing evidence into success language.

## Phase 0: read-only reconnaissance

Before writing code, map the real system.

Inspect, without mutating production state:

- running services and workers;
- cron jobs, timers, platform schedulers and internal schedules;
- queues, task tables and status fields;
- databases, migrations and transaction boundaries;
- locks, leases and concurrency controls;
- retry and timeout behaviour;
- approval and permission checks;
- every external write path;
- provider readback and reconciliation paths;
- startup recovery behaviour;
- monitoring, metrics and operator interfaces;
- legacy adapters and hidden fallback paths.

Produce an ownership table before implementation:

| Workflow | Trigger | Current owner | External effects | Idempotency mechanism | Readback method | Migration risk |
| --- | --- | --- | --- | --- | --- | --- |

For each external effect, identify the exact code path that can execute it. Search for direct SDK calls, HTTP requests, command wrappers, browser automation and fallback connectors. Do not assume all writes pass through the named task runner.

## Runtime architecture

Implement an explicit runtime built around immutable definitions and deterministic state reduction.

Use strict TypeScript. No `any` in the graph kernel.

```ts
type RunStatus =
  | "pending"
  | "running"
  | "waiting_for_approval"
  | "waiting_for_child"
  | "repairing"
  | "completed"
  | "failed"
  | "cancelled"
  | "escalated";

type NodeAuthority =
  | "read_only"
  | "internal_write"
  | "external_write"
  | "destructive";

interface GraphDefinition {
  graphId: string;
  version: string;
  definitionHash: string;
  entryNodeId: string;
  nodes: readonly GraphNodeDefinition[];
  transitions: readonly GraphTransition[];
  maximumExternalWrites: number;
  createdAt: string;
}

interface GraphNodeDefinition {
  nodeId: string;
  kind: string;
  authority: NodeAuthority;
  timeoutMs: number;
  retryPolicy: {
    maximumAttempts: number;
    retryableClassifications: readonly string[];
  };
  inputSchema: unknown;
  outputSchema: unknown;
}

interface GraphTransition {
  from: string;
  to: string;
  guard: string;
}

interface EffectIntent {
  effectId: string;
  runId: string;
  nodeId: string;
  provider: string;
  operation: string;
  idempotencyKey: string;
  payloadHash: string;
  authority: NodeAuthority;
}
```

The stored definition must be canonical JSON. Calculate `definitionHash` from the canonical representation and reject mutation of an existing `(graphId, version)` pair. A changed definition requires a new version.

A run stores the definition hash it started with. A deployment of newer code must not silently change the meaning of a run already in progress.

## State-machine shape

The runtime must support arbitrary graphs, but migrate the first representative workflow using this explicit lifecycle:

```text
INTAKE
  -> NORMALISE
  -> PLAN
  -> AUTHORITY
  -> EXECUTE
  -> OBSERVE
  -> VERIFY
  -> COMPLETE
```

Failure transitions are explicit:

```text
PLAN | EXECUTE | OBSERVE | VERIFY
  -> REPAIR
  -> PLAN | EXECUTE | OBSERVE | VERIFY

AUTHORITY -> WAIT_FOR_APPROVAL
ANY_NON_TERMINAL_NODE -> ESCALATE
ANY_NON_TERMINAL_NODE -> CANCELLED
```

No handler may jump directly to an arbitrary node. The reducer chooses the next node only when a declared transition exists and its guard evaluates true.

The reducer must be deterministic: the same graph definition and ordered event stream must always produce the same run state.

## Durable persistence model

Create durable storage for at least:

- `graph_definitions`;
- `graph_runs`;
- `graph_events`;
- `graph_checkpoints`;
- `graph_effects`;
- `graph_approvals`;
- `graph_leases`;
- `graph_child_runs`.

Required constraints:

- unique graph identity and version;
- unique event sequence per run;
- unique effect idempotency key in the scope that the provider operation requires;
- unique active lease per run;
- foreign keys from events, effects, approvals, checkpoints and child links to their runs;
- terminal runs cannot transition back to a non-terminal state;
- an effect receipt cannot exist without its effect intent;
- an approval cannot authorise a different graph hash, node or payload hash.

Persist the run transition, event append and checkpoint update in one database transaction whenever they represent one logical step.

If SQLite is used, enable WAL mode, set a busy timeout and test concurrent claims. Do not treat SQLite as single-writer-safe merely because tests use one process.

## Append-only event chain

Every graph event must contain:

```ts
interface GraphEvent {
  runId: string;
  sequence: number;
  eventType: string;
  nodeId: string | null;
  payload: unknown;
  occurredAt: string;
  previousEventHash: string | null;
  eventHash: string;
}
```

Canonicalise the event fields before hashing. Calculate each event hash from the previous hash plus the canonical event body. The first event uses a documented genesis value.

Verify the chain:

- when a run is loaded for execution;
- before a terminal completion event is appended;
- when an evidence receipt is generated;
- through an operator diagnostic endpoint.

A chain failure is terminal for automatic execution. Quarantine the run and escalate it. Never “repair” a broken chain by recalculating historical hashes in place.

## Checkpoints and deterministic replay

Events are the audit trail; checkpoints make recovery practical.

A checkpoint must record:

- run id;
- graph definition hash;
- last applied event sequence and hash;
- current node;
- reduced state;
- outstanding approval or child dependency;
- effect summary;
- checkpoint hash;
- creation timestamp.

On recovery:

1. load the newest valid checkpoint;
2. verify its graph hash and event anchor;
3. replay subsequent events through the deterministic reducer;
4. compare the reconstructed state with the stored run row;
5. stop and escalate on divergence;
6. resume only from a node whose prior effects are reconciled.

Replay must never execute a side effect. It reconstructs state only.

## Separate decisions from effects

Node handlers must not call external write APIs directly.

A handler may:

- read data;
- validate inputs;
- produce deterministic output;
- request an approval;
- emit one or more `EffectIntent` records.

A single ToolGate or effect executor owns all external writes. It must enforce:

- graph and node authority;
- zero-write mode;
- approval binding;
- provider and operation allowlists;
- external-write budget;
- payload hash;
- idempotency key;
- lease ownership;
- effect state;
- reconciliation policy.

Use an effect lifecycle that distinguishes preparation from provider confirmation:

```text
prepared
-> authorised
-> claimed
-> executing
-> provider_accepted | provider_rejected | outcome_unknown
-> reconciled_present | reconciled_absent | reconciliation_failed
```

A transport timeout after the provider receives a request is `outcome_unknown`, not `failed`. Query the provider before retrying. Blind retries after uncertain writes are forbidden.

## Idempotency and duplicate prevention

Idempotency is a correctness boundary, not an optimisation.

Build an idempotency key from stable business identity, not process identity. It should bind the graph, intended operation and logical payload. Do not include random run ids when that would allow a duplicate business action to receive a new key.

Before execution, check the local effect ledger. After execution, persist the provider receipt. Before retrying an uncertain effect, perform official provider readback using the provider id, correlation id or uniquely identifying payload fields.

When the provider has no native idempotency key, implement local reservation plus reconciliation and document the residual race. Do not claim exactly-once delivery when only at-least-once behaviour is proven.

## Authority and approvals

Authority is evaluated before execution, not after a handler has already performed the write.

Require persisted approval for actions that are:

- destructive;
- outside an existing allowlist;
- above the graph's external-write budget;
- directed at a new provider account, tenant or environment;
- permission-changing;
- secret-rotating;
- financially consequential;
- legally or reputationally sensitive.

An approval must bind:

- run id;
- graph definition hash;
- node id;
- effect id or effect-set hash;
- payload hash;
- approver identity;
- issued and expiry timestamps;
- permitted operation and scope.

A conversational “yes” is not an approval unless it is converted into this durable record through an authenticated path.

Expired, revoked or mismatched approval returns the run to `waiting_for_approval`; it does not fall through to execution.

## Leases, concurrency and worker death

Only the worker holding the active run lease may advance a run or claim its effects.

Use compare-and-swap semantics for lease acquisition. Store owner id, acquisition time, heartbeat time and expiry. Derive the lease duration from measured node duration and document the selected value; it must be longer than the heartbeat interval with enough margin for expected provider latency.

Exercise these cases in tests:

- two workers claim the same pending run;
- a worker dies after claiming a run;
- a worker dies after creating an effect intent;
- a worker dies after the provider succeeds but before the receipt is stored;
- an expired worker wakes up and tries to continue;
- a lease is renewed while a long read-only observation runs.

An expired worker must fail a lease check before any further write.

## Retries, repair and no-progress detection

Classify failures before deciding what happens next:

- `transient`: retry may succeed without changing the plan;
- `input`: the supplied data is invalid or incomplete;
- `policy`: authority or approval forbids the action;
- `implementation_defect`: code or integration is wrong;
- `provider_rejection`: the provider definitively refused the request;
- `outcome_unknown`: the request may have succeeded and requires reconciliation;
- `invariant_violation`: event, checkpoint, ownership or effect correctness failed.

Only configured transient classifications may use automatic retry, and retry attempts must be bounded per node.

A repair iteration must change something evidenced: input, plan, code path, provider identifier, request shape or policy decision. Store a repair fingerprint. If consecutive iterations produce the same fingerprint and same failure evidence, stop and escalate as `no_progress`.

Never implement “keep trying until it works.”

## Parent and child graphs

Support subgraphs without losing provenance.

A parent creates a child run through a durable event and stores the relationship. The parent enters `waiting_for_child`. Child completion produces a receipt containing its graph hash, terminal event hash, effect summary and verification result. The parent validates that receipt before advancing.

Cancellation, failure and escalation behaviour must be explicit. Do not silently mark a parent complete when a required child failed.

## Legacy-task adapter

Existing tasks may be wrapped temporarily, but only through an allowlisted adapter.

For each adapted task, declare:

- input and output schema;
- whether it is read-only or write-capable;
- external providers touched;
- idempotency behaviour;
- timeout and failure classification;
- readback method;
- whether the task is safe to replay.

Unknown legacy tasks are denied by default. A generic “run any task name” node defeats the graph's authority boundary and is forbidden.

## Observability and operator controls

Expose authenticated controls for:

- listing graph definitions and hashes;
- starting a run;
- inspecting a run, checkpoint and event chain;
- approving, cancelling or resuming a run;
- listing effect intents and receipts;
- running chain and checkpoint verification;
- viewing parent and child relationships;
- viewing ownership and cutover status.

Emit metrics for at least:

- runs started, completed, failed and escalated;
- node duration and attempts;
- repairs and no-progress stops;
- approvals requested, granted, expired and rejected;
- effects prepared, executed and reconciled;
- duplicate effects prevented;
- outcome-unknown reconciliations;
- lease recoveries;
- event-chain failures;
- checkpoint divergence;
- legacy versus graph ownership.

Do not expose secrets, provider tokens or full sensitive payloads in logs, metrics or operator responses. Store hashes and redacted summaries where full payload retention is unnecessary.

## Migration sequence

Use a staged migration. Do not jump from unit tests to complete production ownership.

### Stage 1: kernel

Implement immutable definitions, runs, events, checkpoints, leases, approvals, effects and deterministic replay. Test them without integrating a production workflow.

### Stage 2: read-only representative graph

Model one real workflow and allow it to read live inputs, plan and verify while all external writes are blocked. Compare its decisions with the current owner.

### Stage 3: shadow validation

Run the graph on natural triggers but stop before the effect executor. Record what it would have done, the payload hash and the expected provider readback. Investigate every difference from the legacy path.

### Stage 4: payload-bound canary

After explicit approval, permit one graph run to execute one already approved payload within a declared external-write budget. Freeze the payload hash before authority is granted.

Verify through the official provider API. Check visual or end-user output where the provider's API cannot prove presentation correctness.

### Stage 5: ownership cutover

For one workflow:

1. stop new legacy allocations;
2. account for every legacy in-flight item;
3. disable the legacy write owner;
4. persist and expose evidence that it is disabled;
5. enable graph write authority;
6. let the next natural schedule trigger the graph;
7. verify provider state and duplicate absence;
8. keep rollback available until the observation window passes.

Do not force an early run merely to claim migration success when the acceptance condition requires a natural scheduled cycle.

### Stage 6: expansion

Migrate another workflow only after the first workflow's event chain, receipts, restart recovery, provider reconciliation, ownership and natural-cycle evidence are complete.

## Rollback

Rollback is an ownership transfer, not merely a code revert.

A valid rollback plan must explain how to:

- block new graph effect claims;
- allow or reconcile in-flight graph effects;
- preserve all graph events and receipts;
- restore the legacy owner without overlapping write authority;
- verify scheduler state;
- scan for duplicates;
- document the exact cutover point.

Never delete evidence to make rollback easier.

## Required tests

Implement tests at four levels.

### Unit

- canonical definition hashing;
- event hashing and chain verification;
- deterministic reducer transitions;
- guard evaluation;
- approval binding;
- idempotency-key construction;
- effect-budget enforcement;
- failure classification;
- no-progress fingerprints.

### Property and replay

- the same definition and event stream always reduce to the same state;
- altered event payloads break the chain;
- event reordering is detected;
- replay never emits effects;
- checkpoint plus tail replay equals full replay.

### Integration

- concurrent run claims;
- lease expiry and takeover;
- restart at every boundary around an external effect;
- outcome-unknown reconciliation;
- approval expiry;
- child success, failure and cancellation;
- database transaction rollback;
- maximum-write-budget breach;
- disabled legacy owner and enabled graph owner.

### Migration regression

- existing user-visible behaviour is preserved;
- the legacy schedule cannot write after cutover;
- the graph cannot write before cutover;
- one natural cycle produces exactly one provider object;
- provider readback matches the approved payload;
- restart recovery does not duplicate it.

Do not weaken or delete failing tests to reach a green total. Report the authoritative suite result, including unresolved failures.

## Completion contract

Implement one terminal verifier that refuses to complete the migration run unless every required fact is true.

Its logic should be equivalent to:

```ts
const migrationComplete =
  run.status === "completed" &&
  eventChainValid === true &&
  checkpointMatchesReducedState === true &&
  childRunReceiptChainValid === true &&
  allRequiredEffectsReconciled === true &&
  externalWriteCount <= graph.maximumExternalWrites &&
  providerReadbackMatches === true &&
  duplicateProviderObjects.length === 0 &&
  legacyWriteOwnerDisabled === true &&
  graphWriteOwnerEnabled === true &&
  restartRecoveryVerified === true &&
  naturalScheduledCycleVerified === true &&
  rollbackReady === true;
```

The exact field names may follow the repository's conventions, but do not remove checks because evidence collection is inconvenient.

## Evidence pack

Generate a durable evidence pack containing:

- repository commit and migration version;
- graph definition JSON and hash;
- run id and final status;
- ordered event list and chain-verification result;
- final checkpoint and replay comparison;
- approval records;
- effect intents, idempotency keys, receipts and reconciliation results;
- provider readback identifiers;
- duplicate scan;
- legacy-owner disabled proof;
- graph-owner enabled proof;
- restart-recovery test result;
- natural-cycle timestamp and result;
- test commands and authoritative totals;
- rollback procedure;
- known residual risks.

The evidence pack must distinguish:

- `verified`;
- `warning`;
- `failure`;
- `skipped`;
- `not verified`.

## Implementation behaviour

Work autonomously within the repository, but do not manufacture authority.

Before editing, return:

1. the read-only reconnaissance summary;
2. the ownership map;
3. the proposed graph schema and migration sequence;
4. the first representative workflow;
5. any action that requires explicit approval.

Then implement the safe local and zero-write work, run the relevant tests and report:

- files changed;
- migrations added;
- commands run;
- test totals;
- graph and event invariants proven;
- evidence produced;
- what remains blocked;
- the next safe step.

## Constraints

- TypeScript strict mode; no `any` in the graph kernel.
- Do not use an LLM as the scheduler, lock manager, authority engine or effect ledger.
- An LLM may propose plans or classifications, but deterministic code enforces transitions, permissions, budgets and writes.
- No direct external write calls outside the ToolGate or effect executor.
- No unbounded retries or repair loops.
- No arbitrary legacy-task execution.
- No browser fallback when the acceptance contract requires the official provider API.
- No production database reset or destructive migration to make tests pass.
- No success claim based only on logs, HTTP 2xx responses or a worker exiting with code zero.
- No documentation that describes controls the code does not yet enforce.
- No dual scheduler ownership during migration.

## Notes for whoever is reading this

The graph data structure is not the difficult part. The hard parts are ownership, uncertain external writes, deterministic recovery and proof.

Three details are especially important:

1. **Separate effect intent from effect execution.** Otherwise replay and repair can repeat real-world actions.
2. **Treat an uncertain provider response as a reconciliation problem.** Retrying it as an ordinary failure creates duplicates.
3. **Prove the natural cycle after cutover.** A manually triggered canary proves the code path; it does not prove that production scheduling and ownership are correct.
