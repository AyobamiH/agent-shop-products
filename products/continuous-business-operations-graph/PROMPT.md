# Continuous autonomous business operations graph

A production prompt for turning an existing durable agent runtime into a change-aware business operating loop that continuously discovers, prioritises, executes and verifies useful work without requiring a fresh user prompt after every completed task.

This prompt is based on a working TypeScript control plane with a versioned mission, business registry, evidence-backed candidate discovery, explicit approval classes, value scoring, duplicate-cycle prevention, change fingerprints, durable scheduling, task traceability and verification-led continuation.

## Requirements

- An existing TypeScript or JavaScript service with a durable task or graph runtime.
- Durable SQL or equivalent state storage.
- A business registry containing projects, KPIs, pipeline records, risks, initiatives and approval policy.
- An allowlisted worker or task surface.
- Explicit approval records for consequential actions.
- A scheduler capable of restart recovery.
- Structured verification evidence for completed work.

This prompt does not ask an LLM to “keep going” in chat. It builds persisted operating machinery that decides when another cycle is justified and proves that it can continue after the original request has finished.

## Prompt: build a continuous autonomous business operations graph

Paste everything below the line into an AI coding assistant. Replace bracketed product and business names where required, but keep the authority boundaries, evidence rules, scheduler controls and terminal proof unchanged.

---

Build a production-grade continuous business operations graph inside this repository.

Use this operating loop:

```text
OBSERVE
  → UNDERSTAND
  → GENERATE
  → SCORE
  → AUTHORISE
  → EXECUTE
  → VERIFY
  → LEARN
  → REPLAN
```

Implement it as durable code, persisted state, scheduler ownership and verified continuation. A cron job repeatedly calling an LLM is not sufficient.

## Objective

The system must:

1. load a canonical mission and business registry;
2. observe meaningful changes in projects, KPIs, pipeline, risks, approvals and execution history;
3. generate evidence-backed candidate work;
4. score candidates by expected business value;
5. separate safe autonomous work from approval-required, blocked and unsupported work;
6. dispatch at most one new consequential candidate per cycle by default;
7. bind execution to its candidate, business outcome and verification method;
8. prevent duplicate cycles and duplicate candidate execution;
9. learn only from verified outcomes;
10. schedule another cycle only when due or when relevant state changed;
11. recover safely after restart;
12. prove that a later useful cycle occurs without another user prompt.

Do not:

- grant blanket authority to publish, deploy, spend money or alter production data;
- generate work from imagination when evidence is missing;
- use chat history as the authoritative ledger;
- allow two schedulers to own the same cycle;
- mark work successful because a worker exited with code zero;
- create busywork merely to demonstrate activity;
- automatically invent missing capabilities;
- retry indefinitely after no progress.

## Canonical mission

Create one versioned mission document:

```ts
interface BusinessMission {
  schema: "business-operations.mission";
  schemaVersion: "1.0.0";
  businessId: string;
  businessName: string;
  mission: string;
  supportedOutcomes: BusinessOutcome[];
  approvalBoundarySummary: string;
  runtimeAuthority: string;
}
```

Use a mission with this shape:

```text
Continuously identify, prioritise, execute, verify and improve work that
increases revenue, customer satisfaction, product quality, market visibility
and operational efficiency while respecting explicit approval boundaries.
```

Load it through code. Do not rely on a system prompt or mutable chat message as the only copy.

Supported outcomes:

```ts
type BusinessOutcome =
  | "qualified-leads"
  | "paying-clients"
  | "increased-revenue"
  | "recurring-revenue"
  | "faster-delivery"
  | "customer-satisfaction"
  | "search-visibility"
  | "community-value"
  | "commercial-readiness"
  | "product-quality"
  | "risk-reduction"
  | "manual-work-reduction"
  | "reusable-ip"
  | "operational-efficiency";
```

## Business registry

Create a durable versioned registry:

```ts
interface BusinessRegistry {
  schema: "business-operations.registry";
  schemaVersion: "1.0.0";
  registryVersion: string;
  businessId: string;
  businessName: string;
  mission: string;
  updatedAt: string;
  projects: BusinessProject[];
  kpis: BusinessKpi[];
  kpiSnapshots: BusinessKpiSnapshot[];
  pipeline: BusinessPipelineRecord[];
  initiatives: BusinessInitiative[];
  riskRegister: BusinessRisk[];
  coverageGaps: BusinessCoverageGap[];
  approvalPolicy: ApprovalPolicy;
}
```

Projects must contain status, repositories, commercial outcome, target customer, relevant KPIs, acceptance criteria, blockers, risks, approval boundaries, evidence locations and the next safe action.

Pipeline records must contain source, stage, expected outcome, KPI, next action, approval status, follow-up time and evidence.

Risks must contain severity, status, mitigation, linked projects and confidence.

Coverage gaps must state what is missing and the next evidence required. Missing evidence may create an evidence-gathering candidate; it is not permission to invent facts.

## Evidence hierarchy

Use:

```text
verified runtime and provider evidence
  > durable execution and approval records
  > current repository source and tests
  > canonical business registry
  > maintained documentation
  > historical reports
  > model inference
```

Every candidate must cite evidence such as paths, durable record identifiers, provider object identifiers, test receipts or structured observations.

Classify facts as:

```ts
type EvidenceConfidence = "verified" | "estimated" | "unknown";
```

Estimated or unknown facts may justify gathering evidence, but not a consequential external action.

## Persistent graph

Implement:

```text
OBSERVE
UNDERSTAND
GENERATE
SCORE
AUTHORISE
DISPATCH
WAIT_FOR_EXECUTION
VERIFY
LEARN
REPLAN
IDLE
WAITING_FOR_APPROVAL
BLOCKED
DEGRADED
FAILED
```

Transition shape:

```text
OBSERVE
  → UNDERSTAND
  → GENERATE
  → SCORE
  → AUTHORISE
      ├─ safe-autonomous → DISPATCH
      ├─ approval-required → WAITING_FOR_APPROVAL
      ├─ unsupported → BLOCKED
      └─ no justified candidate → IDLE
  → WAIT_FOR_EXECUTION
  → VERIFY
      ├─ passed → LEARN → REPLAN
      ├─ failed with bounded repair → REPLAN
      ├─ unresolved → DEGRADED
      └─ terminal failure → FAILED
```

Persist graph version, current node, cycle ID, sequence number, timestamps, input digest and output digest. Restart from durable state rather than beginning the reasoning again.

## Cycle record

Persist:

```ts
interface BusinessOperationsCycle {
  cycleId: string;
  triggerSource:
    | "scheduler"
    | "business-day-pulse"
    | "startup-recovery"
    | "state-change"
    | "manual";
  triggerReason: string;
  status:
    | "active"
    | "completed"
    | "idle"
    | "blocked"
    | "waiting"
    | "degraded"
    | "failed";
  startedAt: string;
  completedAt: string | null;
  missionVersion: string;
  registryVersion: string;
  observedChangeFingerprint: string;
  candidates: CandidateWorkItem[];
  selectedTask: SelectedTask | null;
  approvalGatedCandidates: BlockedCandidate[];
  unsupportedCandidates: BlockedCandidate[];
  verificationStatus:
    | "not-verified"
    | "passed"
    | "failed"
    | "unresolved"
    | "skipped";
  evidence: EvidenceReference[];
  nextSafeAction: string | null;
  failureReason?: string;
}
```

Write a preliminary record before dispatch. Retain at least the latest 200 cycles and 500 candidates; archive older records rather than silently deleting them.

## Observation

The `OBSERVE` node may inspect only allowlisted sources:

- registry version and update time;
- project statuses, blockers and acceptance criteria;
- KPI snapshots;
- pipeline stages and follow-up deadlines;
- initiatives and next safe actions;
- risk status and severity;
- evidence gaps;
- approval decisions;
- latest task executions;
- interrupted work;
- capability gaps;
- scheduler state and active locks;
- provider readback where external state matters.

Produce a normalised observation document and SHA-256 fingerprint. Do not call an external write API during observation.

## Change fingerprint

Calculate a deterministic fingerprint over:

```ts
interface ChangeFingerprintInput {
  registryVersion: string;
  registryUpdatedAt: string;
  projects: Array<[
    string,
    string,
    string | null,
    string[],
    Array<[string, string]>
  ]>;
  initiatives: Array<[string, string, string, string[]]>;
  risks: Array<[string, string, string, string]>;
  coverageGaps: Array<[string, string, string, string]>;
  latestExecutions: Array<[string, string, string | null]>;
  latestApprovals: Array<[string, string, string]>;
}
```

Canonicalise and SHA-256 hash it.

Automatic cycles must normally skip when it is unchanged:

```text
code = unchanged
reason = Relevant business, task and approval state has not changed.
```

A manual forced cycle may inspect unchanged state, but it still may not duplicate a candidate.

## Understanding and candidate generation

Turn observations into bounded findings, then candidates:

```ts
type ApprovalClassification =
  | "safe-autonomous"
  | "approval-required"
  | "blocked"
  | "unsupported";

interface CandidateWorkItem {
  id: string;
  evidenceFingerprint: string;
  kind:
    | "opportunity"
    | "lead"
    | "delivery"
    | "quality"
    | "risk"
    | "approval"
    | "evidence-gap"
    | "capability-gap";
  title: string;
  businessId: string;
  projectId: string | null;
  businessFunction: string | null;
  objective: string;
  expectedOutcome: BusinessOutcome;
  kpiId: string;
  taskType: string | null;
  taskPayload: Record<string, unknown>;
  effort: "low" | "medium" | "high";
  risk: string;
  dependencies: string[];
  acceptanceCriteria: string[];
  verification: string;
  evidence: EvidenceReference[];
  confidence: EvidenceConfidence;
  approval: ApprovalClassification;
  approvalReason: string | null;
  score: PriorityScore | null;
}
```

Create the candidate ID deterministically from:

```text
businessId
+ projectId
+ kind
+ objective
+ evidence fingerprint
```

Identical evidence must not produce endless “new” work. Materially changed evidence may produce a new candidate.

Candidates must be executable or honestly blocked. Do not create decorative strategy documents unless they resolve a verified gap.

Useful candidate classes include:

- collect a missing KPI snapshot;
- run a read-only repository or production audit;
- execute an allowlisted test or build;
- prepare an unpublished draft;
- update internal documentation from verified source changes;
- prepare an approval packet;
- repair a verified regression inside an approved repository boundary;
- follow up on an approved pipeline item at its due time;
- reconcile an interrupted execution;
- prepare a commercial-readiness evidence pack;
- verify whether an acceptance criterion is met.

Treat public publishing, outbound messages, deployments, production migrations, DNS changes, payments, contracts, new secret access, protected-branch changes, destructive data operations and irreversible provider writes as approval-required by default.

## Value scoring

Use:

```text
expectedBusinessImpact
× confidence
× urgency
× commercialReadinessImpact
× evidenceQuality
× reversibility
────────────────────────────────────────────
effort + operationalRisk + dependencyLoad + approvalFriction
```

Every component is from `1` to `5`.

Persist:

```ts
interface BusinessValueScoreComponents {
  expectedBusinessImpact: number;
  confidence: number;
  urgency: number;
  effort: number;
  operationalRisk: number;
  dependencyLoad: number;
  commercialReadinessImpact: number;
  reversibility: number;
  approvalFriction: number;
  evidenceQuality: number;
}
```

Use these real defaults:

```text
Outcome impact
5.0  increased-revenue, paying-clients, recurring-revenue
4.5  commercial-readiness, qualified-leads, faster-delivery, community-value
4.0  product-quality, customer-satisfaction, search-visibility
3.5  risk-reduction, manual-work-reduction, operational-efficiency, reusable-ip
3.0  other evidenced outcomes

Effort
low     1.2
medium  2.6
high    4.2

Operational risk
safe local reversible action  1.4
medium risk                    2.8
external or high risk          4.0
approval-required              4.5
blocked or unsupported         5.0

Evidence quality
four or more useful references  5
two or three                    4
one                             3
none                            1
```

Persist the formula, components and rationale, not only the final score.

Sort by final score, then:

1. higher evidence quality;
2. lower risk;
3. lower effort;
4. older detected time;
5. lexical candidate ID.

## Authority policy

### `safe-autonomous`

Allowed only when:

- standing authority covers the exact action;
- the task type is allowlisted;
- no new secret is required;
- it is local or read-only, or an external write is separately pre-authorised;
- it is reversible;
- acceptance criteria and verification are defined;
- evidence exists;
- no matching idempotency key is pending, running, retrying or successful.

### `approval-required`

Preserve the candidate and create an approval packet containing exact action, target, rationale, evidence, expected effect, risk, rollback, expiry, idempotency key and verification method.

Do not enqueue until a matching approval arrives.

### `blocked`

Record the unmet dependency, policy condition or evidence requirement and the next evidence needed.

### `unsupported`

Record a capability gap. Do not let the model improvise a new execution path.

## Dispatch and traceability

Select no more than one new consequential candidate per cycle unless an explicitly configured portfolio proves multiple candidates independent.

Before dispatch:

1. require `approval === "safe-autonomous"`;
2. require an allowlisted task type and healthy worker;
3. require no live cycle owning the candidate;
4. require no live or successful matching idempotency key;
5. persist the selected task and cycle evidence;
6. enqueue through the governed task or graph runtime.

Use:

```text
business-value:<candidate-id>
```

Because candidate ID includes the evidence fingerprint, unchanged evidence cannot repeat while materially changed evidence may create a new task.

Bind:

```ts
interface BusinessTaskTraceability {
  businessId: string;
  projectId: string | null;
  businessFunction: string | null;
  businessObjective: string;
  expectedBusinessOutcome: BusinessOutcome;
  kpiId: string;
  kpiBaseline: string | number | null;
  expectedKpiEffect: string;
  candidateEvidence: EvidenceReference[];
  score: number;
  scoreComponents: BusinessValueScoreComponents;
  dependencies: string[];
  acceptanceCriteria: string[];
  verificationMethod: string;
  evidencePath: string;
  approvalClassification: ApprovalClassification;
  originatingCycleId: string;
  parentCandidateId: string;
  selectedWorkerOrCapability: string;
  completionOutcome: string | null;
}
```

The worker receives no authority beyond the candidate and task policy.

## Execution and verification

Execution belongs to the governed runtime. It must provide durable task identity, bounded inputs, idempotency, approval validation, worker identity, events, evidence, timeout, bounded retry, cancellation and restart recovery.

The business loop waits for a terminal execution result; it does not optimistically continue after enqueueing.

Verification must be independent:

```ts
interface BusinessVerificationResult {
  taskId: string;
  candidateId: string;
  cycleId: string;
  status: "passed" | "failed" | "unresolved";
  summary: string;
  evidence: EvidenceReference[];
  kpiBefore: string | number | null;
  kpiAfter: string | number | null;
  observedBusinessOutcome: string | null;
  verifiedAt: string;
  verifier: string;
}
```

Examples:

- builds require a passing build receipt;
- regression repairs require the failing test plus relevant regression checks;
- documentation changes require source-to-doc consistency;
- external publications require official provider readback;
- pipeline follow-ups require a provider identifier or confirmed draft-only result;
- readiness work requires the named criterion to move from missing to met with evidence.

A worker reporting success is not enough. Only `passed` is completed business work.

## Learning and replanning

After verification:

- attach evidence to the cycle;
- update execution and verification status;
- update registry evidence;
- add KPI snapshots only when measurement exists;
- mark criteria met only with evidence;
- preserve unresolved outcomes;
- record observed, not hoped-for, impact;
- calculate a new change fingerprint;
- set the next safe action.

Use:

```text
maximum immediate replans per trigger: 1
maximum consequential dispatches per cycle: 1
minimum automatic cadence: 60 minutes
default cadence: 360 minutes
maximum cadence: 1440 minutes
duplicate-trigger cooldown: 30 seconds
stale active-cycle threshold: 30 minutes
```

An immediate replan may record the next candidate, but the next consequential dispatch should normally happen through the next governed trigger.

## Scheduler

Persist:

```ts
interface BusinessOperationsSchedulerState {
  mode: "enabled" | "paused" | "disabled";
  cadenceMinutes: number;
  lastTriggeredAt: string | null;
  lastTriggerSource: string | null;
  lastTriggerReason: string | null;
  nextRunAt: string | null;
  lastProgressAt: string | null;
  consecutiveFailures: number;
  backoffUntil: string | null;
  activeTaskId: string | null;
  activeTaskEnqueuedAt: string | null;
  lastChangeFingerprint: string | null;
  lastSkippedAt: string | null;
  lastSkipReason: string | null;
}
```

Save atomically with a database transaction or temporary file plus rename.

Trigger decisions:

```text
ready
disabled
paused
active
cooldown
backoff
not-due
unchanged
```

Record every skipped trigger. Only one scheduler may own this loop; disable legacy jobs that trigger the same cycle.

## Failure backoff

Use:

```text
backoff = min(
  configured cadence,
  15 minutes × 2^(consecutiveFailures - 1)
)
```

Cap the exponent at `5`. Reset failures only after a non-failed cycle. A degraded loop remains inspectable and scheduled.

## Duplicate-cycle protection

Before creating a cycle, check:

- active cycle ID;
- active scheduler task ID;
- live pending, running or retrying cycle execution;
- trigger cooldown;
- failure backoff;
- due time;
- change fingerprint.

If already active, write a blocked cycle:

```text
reason = Active cycle <id> prevents duplicate cycle execution.
nextSafeAction = Wait for the active cycle to complete or recover interrupted state.
```

Do not enqueue another cycle.

## Restart recovery

On startup:

1. load scheduler and cycle state;
2. inspect durable task executions;
3. resume observation when the recorded task still exists;
4. do not immediately clear a lock with no matching execution;
5. clear an orphan only when older than 30 minutes or explicitly authorised;
6. record why it was cleared;
7. reconcile work that executed but was not verified;
8. schedule the next due cycle;
9. never rerun consequential work merely because the process restarted.

Startup recovery is a trigger source, not blanket execution permission.

## No-progress detection

Enter `DEGRADED` when:

- three cycles share a fingerprint with no new verified outcome;
- the same unsupported candidate remains top-ranked for three cycles;
- a failed candidate is selected again without new evidence or repair;
- an identical approval packet is repeatedly regenerated;
- verification remains unresolved after bounded reconciliation;
- triggers fire but every candidate is a duplicate.

Record the reason and next safe action. Do not manufacture lower-value work to appear active.

## Capability gaps

Persist capability gaps with candidate, required capability, reason, evidence, risk, proposed implementation, approval requirement and status.

A separate approved workflow may implement them. The business loop may preserve and rank them, but it cannot grant itself new powers.

## Operator view and metrics

Expose:

- loop status: `active`, `idle`, `waiting`, `degraded`, `failed` or `stopped`;
- scheduler mode and next run;
- latest, successful and failed cycles;
- selected candidate and score;
- active task, worker and model;
- verification status;
- approval-gated and unsupported candidates;
- blockers, backoff and last progress;
- evidence links.

Publish:

```text
business_operations_cycles_total{status}
business_operations_candidates_total{approval,kind}
business_operations_dispatch_total{task_type}
business_operations_verification_total{status}
business_operations_trigger_skips_total{code}
business_operations_cycle_duration_seconds
business_operations_consecutive_failures
business_operations_approval_queue_size
business_operations_capability_gap_count
business_operations_last_progress_timestamp
```

Do not make chat messages the only monitoring surface.

## Tests

### Unit

Test mission and registry validation, deterministic fingerprints, candidate IDs, deduplication, scoring, authority classification, tie breakers, idempotency, unchanged-state skips, cooldown, due time, backoff, stale locks, no-progress detection and approval binding.

### Integration

Prove:

1. changed evidence creates a cycle;
2. several candidates are generated;
3. the highest-scoring safe allowlisted candidate is selected;
4. approval-required candidates remain preserved;
5. unsupported candidates become capability gaps;
6. only one task is enqueued;
7. traceability reaches the worker;
8. verification updates the cycle;
9. unchanged state is skipped;
10. concurrent triggers have one winner;
11. restart recovery does not duplicate work;
12. changed approvals or execution results change the fingerprint;
13. failure creates bounded backoff;
14. successful recovery resets failures.

### Adversarial

Test:

- proposed public write without approval;
- high score but no evidence;
- renamed duplicate candidate;
- worker claims success while verification fails;
- stale approval replay;
- double scheduler trigger;
- crash after enqueue;
- crash after execution before verification;
- young lock that must remain;
- stale orphaned lock;
- unsupported arbitrary-shell attempt;
- KPI improvement without measurement;
- repeated identical approval packet;
- malformed registry;
- stale observation source;
- non-allowlisted task type.

## Natural continuation proof

Prove continuation without a new user prompt using a disposable registry and real scheduler or accelerated test clock.

### Phase 1

1. Enable the scheduler.
2. Insert evidence for candidate A.
3. Let the scheduler trigger naturally.
4. Prove one cycle dispatches A.
5. Complete and independently verify it.
6. Persist learning and next run time.

### Phase 2

Do not send another user prompt.

1. Change registry or execution evidence so candidate B becomes justified.
2. Wait for the next natural trigger.
3. Prove the fingerprint differs.
4. Prove a second cycle exists.
5. Prove A is not repeated.
6. Prove B is selected or honestly approval-gated/unsupported.
7. If safe, execute and verify B.
8. Persist the second cycle and evidence.

The proof fails if phase 2 is started through chat, a direct function call bypassing the scheduler or an unrecorded force flag.

## Completion contract

Complete only when:

- mission and registry are versioned and validated;
- observation is allowlisted and read-only;
- candidate generation is evidence-backed and deterministic;
- score components and rationale are persisted;
- authority classification is enforced in code;
- only allowlisted safe candidates dispatch automatically;
- approval-required and unsupported work remain visible;
- traceability binds business intent to execution;
- verification is independent;
- scheduler state is durable and single-owner;
- unchanged state does not create cycles;
- duplicate triggers and candidates are blocked;
- restart recovery does not repeat consequential work;
- backoff and no-progress handling work;
- operator view and metrics expose health;
- unit, integration and adversarial tests pass;
- the two-phase natural continuation proof passes without another prompt.

End with an evidence report containing:

```text
mission and registry paths
graph and scheduler implementation paths
database migrations
candidate and scoring implementation
approval policy and worker allowlist
verification implementation
operator view and metrics
tests executed
phase 1 cycle ID and candidate
phase 1 verification evidence
phase 2 natural trigger time
phase 2 cycle ID and candidate
proof that no new prompt triggered phase 2
remaining approval-gated candidates
remaining capability gaps
known limitations
rollback steps
terminal verdict
```

Do not finish with “the agent will continue”. Finish with durable evidence that it did.
