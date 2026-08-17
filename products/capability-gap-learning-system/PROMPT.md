# Capability-gap learning system

A production prompt for building an agent system that detects why work is blocked, distinguishes missing capability from missing permission, proposes the smallest governed improvement, validates it independently, and retries the original task without granting itself new authority.

This prompt is based on a working TypeScript autonomous controller that classifies capability gaps, deduplicates recurring failures, records evidence, and proposes skills, tools, plugins, workers, policies, documentation, or runtime repairs while preserving ToolGate and approval boundaries.

## Requirements

- An existing agent or task runtime.
- Durable task and checkpoint storage.
- An allowlisted tool or skill gateway.
- Explicit approval records for capability changes.
- A registry for agents, skills, tools, plugins, workers, and policies.
- Structured task results with evidence and recommended next actions.
- A test runner and synthetic fixtures.
- A way to retry the original blocked task after activation.

Capability learning is governed product improvement, not self-granted authority.

## Prompt: build a governed capability-gap learning system

Paste everything below the line into an AI coding assistant. Replace bracketed repository and runtime names where required, but preserve the classification, approval, validation, activation, and retry rules.

---

Build a production-grade capability-gap learning system.

Use this loop:

```text
ATTEMPT
  → OBSERVE FAILURE
  → CLASSIFY BOUNDARY
  → RECORD GAP
  → DEDUPLICATE
  → PRIORITISE
  → PROPOSE CAPABILITY
  → AUTHORISE
  → IMPLEMENT IN ISOLATION
  → VALIDATE
  → ACTIVATE
  → RETRY ORIGINAL TASK
  → VERIFY OUTCOME
  → LEARN
```

## Objective

The system must prove:

1. why the original task stopped;
2. whether the blocker is capability, authority, configuration, provider, validation, or transport;
3. whether the same structural gap occurred before;
4. which evidence supports the classification;
5. which smallest capability could resolve it;
6. which authority change the proposal would create;
7. whether implementation remained inside approved scope;
8. whether validation tested success and refusal behaviour;
9. whether activation was separately authorised;
10. whether retrying the original task actually resolved the gap.

A capability is not successful merely because its code exists.

## Non-negotiable rules

1. Missing permission is not a missing capability.
2. Forbidden work remains forbidden.
3. The blocked agent cannot approve its own expansion.
4. A proposal cannot silently widen ToolGate or role authority.
5. Implementation and activation are separate.
6. Production activation requires explicit evidence and approval.
7. The original task must be retried after activation.
8. Validation must test intended and refused behaviour.
9. Recurring gaps are deduplicated and counted.
10. A capability may be rejected, deferred, rolled back, or retired.
11. New capabilities must have owners and rollback plans.
12. Honest blocking is a valid terminal result.

## Role separation

### Blocked task agent

May:

- report the attempted outcome;
- emit structured failure evidence;
- continue with safe allowlisted alternatives;
- stop at a policy or capability boundary.

May not:

- approve expansion;
- install or activate plugins;
- change ToolGate;
- create credentials;
- rewrite a forbidden task;
- report success without retry evidence.

### Gap classifier

Owns:

- boundary classification;
- stable gap identity;
- occurrence aggregation;
- evidence collection;
- initial priority;
- proposed capability category.

It does not implement or activate.

### Capability designer

Owns:

- alternatives;
- minimal specification;
- authority delta;
- validation plan;
- activation plan;
- rollback plan;
- original-task retry plan.

### Approval authority

Approves proposal, implementation, activation, and external-write authority where applicable.

### Capability builder

Implements only the approved specification in an isolated branch or workspace.

### Independent verifier

Tests intended behaviour, refusal behaviour, compatibility, rollback, and original-task retry.

### Runtime owner

Activates, pauses, rolls back, or retires the capability.

## Package shape

```text
src/
  capabilities/
    types.ts
    classifier.ts
    identity.ts
    store.ts
    priority.ts
    proposal.ts
    approval.ts
    validation.ts
    activation.ts
    retry.ts
    retirement.ts
    metrics.ts
    audit.ts
  controller/
    continuation.ts
    checkpoint.ts
    tool-gate.ts
config/
  capabilities/
    registry.v1.json
    policies.v1.json
docs/
  capability-model.md
  capability-gap-runbook.md
  capability-authority.md
test/
  unit/
  integration/
  adversarial/
```

Use strict TypeScript. Avoid `any`.

Imports must not install packages, discover credentials, activate plugins, mutate policy, start workers, or perform external writes.

## Structured task result

Every invocation must return:

```ts
interface TaskResult {
  handled: boolean;
  status:
    | "success"
    | "failed"
    | "denied"
    | "unavailable"
    | "rate_limited"
    | "validation_failed"
    | "transport_failed";
  changedState: boolean;
  safety: {
    readOnly: boolean;
    externalWrite: boolean;
  };
  summary: string;
  evidenceReferences: string[];
  recommendedNextAction: RecommendedAction | null;
}

interface RecommendedAction {
  action: string;
  intent: string;
  requiresApproval: boolean;
  readOnly: boolean;
}
```

Prefer structured evidence over prose inference.

## Boundary classes

```ts
type CapabilityGapClass =
  | "approval_required"
  | "missing_skill"
  | "missing_tool_or_plugin"
  | "missing_specialist_worker"
  | "memory_or_config_failure"
  | "provider_rate_limit"
  | "forbidden_action"
  | "unsupported_lane"
  | "validation_failure"
  | "runtime_transport_failure";
```

### `approval_required`

Use when the capability exists but current authority does not permit the action.

Examples: deploy, push, migrate, publish, access secrets, or perform a financial action.

Do not solve this by building another tool.

### `missing_skill`

Use when raw tools exist but the reusable method, workflow, or evidence contract does not.

Examples: no migration-review method, no reconciliation procedure, or repeated improvised diagnostics.

### `missing_tool_or_plugin`

Use when a bounded machine action or registered integration is genuinely absent.

Examples: no official API adapter, no parser, no repository audit tool, or no approved registration for an existing tool.

### `missing_specialist_worker`

Use when the task needs a distinct role, isolation boundary, resource owner, or independent verifier.

Do not create a worker merely to give the same agent more permissions.

### `memory_or_config_failure`

Use when the capability exists but configuration, reference state, memory, account identity, or registry data is missing, invalid, or stale.

Prefer repair over duplication.

### `provider_rate_limit`

Use for temporary provider exhaustion. Persist a checkpoint and resume condition. Do not create a new capability by default.

### `forbidden_action`

Use when policy prohibits the request. Create no enabling proposal.

### `unsupported_lane`

Use when the runtime does not own the decision or domain. Propose a governed handoff, not false autonomy.

### `validation_failure`

Use when implementation exists but required checks fail. Repair the capability rather than declaring it missing.

### `runtime_transport_failure`

Use when an existing capability cannot be reached because a plugin, worker, route, or service is unhealthy.

Repair the authoritative path before duplicating it.

## Classification order

Classify in this order:

```text
1. forbidden?
2. approval required?
3. provider temporarily unavailable?
4. runtime or configuration broken?
5. implementation validation failing?
6. existing capability inaccessible?
7. reusable method missing?
8. machine tool missing?
9. specialist boundary missing?
10. lane unsupported?
```

Earlier classes outrank later ones.

## Gap record

```ts
interface CapabilityGap {
  gapId: string;
  schemaVersion: "1.0.0";
  boundaryClass: CapabilityGapClass;
  blockedTaskId: string;
  blockedTaskSummary: string;
  missingCapability: string;
  currentLimitation: string;
  workflowLane: string;
  riskClass:
    | "safe_readonly"
    | "safe_validation"
    | "bounded_local_change"
    | "approval_required"
    | "forbidden"
    | "blocked";
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
  evidenceReferences: string[];
  proposedCapabilityType:
    | "skill"
    | "tool"
    | "plugin"
    | "worker"
    | "policy"
    | "documentation"
    | "runtime_repair";
  suggestedImplementation: string;
  requiredApproval: boolean;
  validationPlan: string;
  recommendedPriority: "low" | "medium" | "high" | "critical";
  status:
    | "open"
    | "triaged"
    | "proposed"
    | "awaiting_approval"
    | "approved"
    | "implementing"
    | "validating"
    | "active"
    | "rejected"
    | "deferred"
    | "resolved"
    | "retired";
  resolutionCapabilityId: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Stable identity and occurrences

Derive `gapId` from:

```text
boundaryClass
+ workflowLane
+ missingCapability
+ authority domain
+ runtime surface
```

Do not include task ID in the stable identity.

Store task-specific occurrences separately:

```ts
interface CapabilityGapOccurrence {
  occurrenceId: string;
  gapId: string;
  taskId: string;
  runId: string | null;
  observedAt: string;
  attemptedAction: string;
  resultStatus: TaskResult["status"];
  evidenceReferences: string[];
  authorityState: string;
  runtimeFingerprint: string;
}
```

A recurrence increments `occurrenceCount` and appends an occurrence record.

## Evidence

Accept evidence such as:

- ToolGate denial;
- missing registry entry;
- plugin inspection;
- worker health;
- task result;
- validation failure;
- runtime log;
- quota event;
- schema error;
- synthetic reproduction;
- original-task checkpoint.

Sanitise credentials, prompts, personal messages, and secret values.

## Safe continuation

```ts
interface ContinuationDecision {
  allowed: boolean;
  reason:
    | "safe_allowlisted"
    | "approval_required"
    | "forbidden"
    | "no_alternative"
    | "step_budget_exhausted"
    | "duplicate_action"
    | "provider_paused"
    | "unsupported_lane";
  nextAction: RecommendedAction | null;
}
```

Continue only when the action is read-only or already authorised, allowlisted, non-duplicative, and within the step budget.

Use:

```text
maximumContinuationSteps = 4
maximumRepeatedFailures = 2
maximumCapabilityRepairIterations = 3
```

Stop when the same failure repeats without new evidence.

## Priority

```ts
interface CapabilityGapPriority {
  businessImpact: number;
  recurrence: number;
  taskCriticality: number;
  affectedWorkflows: number;
  evidenceQuality: number;
  workaroundCost: number;
  implementationEffort: number;
  authorityRisk: number;
  operationalRisk: number;
  value: number;
}
```

Example:

```text
value =
  businessImpact
  * recurrence
  * taskCriticality
  * affectedWorkflows
  * evidenceQuality
  * workaroundCost
  / max(1, implementationEffort + authorityRisk + operationalRisk)
```

Priority never overrides forbidden policy.

## Choosing the capability type

### Skill

Choose a skill when existing tools can act and the missing element is a reusable method.

A complete skill includes:

- purpose;
- triggers;
- inputs;
- steps;
- tools;
- refusal conditions;
- evidence contract;
- completion contract;
- scripts, schemas, and fixtures where needed.

A Markdown file alone is not automatically a complete skill.

### Tool

Choose a tool when a deterministic bounded machine action is absent.

Tools must have strict schemas, sanitisation, bounded runtime, cancellation, evidence output, and tests.

### Plugin

Choose a plugin when registration, lifecycle, discovery, or platform integration is required.

Define install, version pin, activation, permissions, health, unload, rollback, and no-import side effects.

### Worker

Choose a worker for role separation, long-running execution, resource ownership, or independent verification.

Define manifest, queue ownership, idempotency, heartbeat, recovery, evidence, and least-privilege authority.

### Policy

Choose policy when capability exists but governed access is incomplete.

Make the authority change explicit. Do not disguise policy expansion as engineering work.

### Documentation

Choose documentation when the capability exists and the failure came from missing or contradictory operating instructions.

Verify documentation against code and runtime truth.

### Runtime repair

Choose runtime repair when a plugin is unloaded, worker unhealthy, route broken, configuration invalid, or transport failing.

## Capability definition

```ts
interface CapabilityDefinition {
  capabilityId: string;
  version: string;
  type:
    | "skill"
    | "tool"
    | "plugin"
    | "worker"
    | "policy"
    | "documentation"
    | "runtime_repair";
  name: string;
  owner: string;
  status:
    | "draft"
    | "proposed"
    | "approved"
    | "validated"
    | "shadow"
    | "active"
    | "paused"
    | "retired";
  resolvesGapIds: string[];
  roleIds: string[];
  toolIds: string[];
  requiredPermissions: string[];
  authorityDelta: AuthorityDelta;
  evidenceContract: string[];
  validationPlanId: string;
  rollbackPlanId: string;
  createdAt: string;
  updatedAt: string;
}
```

## Authority delta

```ts
interface AuthorityDelta {
  newReadSurfaces: string[];
  newWriteSurfaces: string[];
  newExternalSystems: string[];
  newCredentialClasses: string[];
  newRoles: string[];
  expandedRoleAccess: Array<{
    roleId: string;
    capability: string;
    previous: string;
    proposed: string;
  }>;
  irreversibleEffects: string[];
}
```

Verify an allegedly empty authority delta.

## Proposal

```ts
interface CapabilityProposal {
  proposalId: string;
  gapId: string;
  title: string;
  problemStatement: string;
  currentEvidence: string[];
  alternatives: Array<{
    option: string;
    advantages: string[];
    disadvantages: string[];
    rejectedReason: string | null;
  }>;
  selectedCapabilityType: CapabilityDefinition["type"];
  minimalScope: string[];
  prohibitedScope: string[];
  authorityDelta: AuthorityDelta;
  implementationPlan: string[];
  validationPlan: string[];
  activationPlan: string[];
  rollbackPlan: string[];
  originalTaskRetryPlan: string[];
  requiredApprovals: string[];
  status:
    | "draft"
    | "ready_for_review"
    | "approved"
    | "rejected"
    | "superseded";
}
```

Compare existing-capability reuse, configuration repair, documentation, a new capability, and manual handoff where relevant.

“Build a plugin” must not be the default answer.

## Approval stages

Separate:

```text
proposal approval
implementation approval
activation approval
production-write approval
```

Approval binds the proposal digest, capability version, authority delta, allowed paths, dependencies, validation plan, environment, expiry, and approver.

## Isolated implementation

Implement in a dedicated branch, disposable workspace, package, project-owned adapter directory, or synthetic fixture.

The builder receives:

- proposal digest;
- allowed and prohibited paths;
- required checks;
- dependency policy;
- authority limit.

Do not mutate the live runtime during implementation.

## Completion standard

Require:

- schemas;
- validation;
- refusal behaviour;
- sanitised evidence;
- tests;
- documentation;
- version;
- owner;
- inspection or health command;
- rollback;
- compatibility statement;
- no hidden authority expansion.

## Validation

Every capability must test:

```text
happy path
wrong input
missing input
unauthorised caller
prohibited path
stale configuration
runtime unavailable
duplicate request
restart recovery
evidence completeness
rollback
original-task retry
```

### Skill-specific checks

- declared tools exist;
- ToolGate allows only intended access;
- refusal rules work;
- evidence validates;
- project adapters cannot weaken shared safety;
- a synthetic fixture succeeds.

### Tool-specific checks

- strict input schema;
- safe arguments and paths;
- bounded execution;
- output schema;
- cancellation;
- no secret leakage;
- deterministic fixture.

### Plugin-specific checks

- exact version;
- install, inspect, activate, unload;
- health;
- registration;
- no import-time side effects;
- restart recovery;
- rollback;
- no duplicate registration.

### Worker-specific checks

- manifest;
- role boundary;
- queue ownership;
- concurrency;
- idempotency;
- heartbeat;
- crash recovery;
- no self-approval;
- no excess privileges.

### Policy-specific checks

- affected roles;
- previous and proposed access;
- least privilege;
- denial paths;
- operator visibility;
- rollback;
- no wildcard access.

## Shadow and canary activation

Capabilities that change routing or external access enter `shadow` first.

Shadow mode:

- observes eligible tasks;
- emits the decision it would make;
- performs no new external writes;
- leaves current ownership unchanged;
- records false positives and negatives.

Canary mode binds one capability version, role, task class, environment, retry budget, and rollback plan.

Shadow success does not imply production authority.

## Original-task retry

Resume from the durable blocked-task checkpoint.

Bind:

- original task ID;
- original intent digest;
- gap ID;
- capability version;
- activation record;
- prior evidence;
- new attempt ID.

Classify:

```text
resolved
partially_resolved
not_resolved
new_gap_discovered
regression
```

A gap resolves only when the original task or a faithful synthetic reproduction passes.

## Resolution record

```ts
interface CapabilityGapResolution {
  resolutionId: string;
  gapId: string;
  capabilityId: string;
  capabilityVersion: string;
  originalTaskId: string;
  retryAttemptId: string;
  outcome:
    | "resolved"
    | "partially_resolved"
    | "not_resolved"
    | "new_gap_discovered"
    | "regression";
  evidenceReferences: string[];
  authorityUsed: string[];
  externalWrites: number;
  verifiedAt: string;
  verifier: string;
  nextSafeAction: string;
}
```

Do not close a runtime-specific gap from unit tests alone.

## Learning

After resolution:

- update occurrence statistics;
- update agent readiness;
- record the working alternative;
- preserve failed alternatives;
- update documentation;
- update the capability registry;
- update ToolGate only when approved;
- detect duplicate capabilities;
- preserve failure history.

## Agent readiness

```ts
interface AgentCapabilityReadiness {
  agentId: string;
  targetCapabilities: string[];
  activeCapabilities: string[];
  inaccessibleCapabilities: string[];
  openGapIds: string[];
  evidenceCoverage: number;
  verificationCoverage: number;
  recoveryCoverage: number;
  authorityClarity: number;
  readiness: "ready" | "partial" | "blocked" | "degraded";
  reasons: string[];
}
```

Readiness is not the number of tools attached to an agent.

## Operator surface

Expose authenticated routes:

```text
GET  /api/capabilities
GET  /api/capability-gaps
GET  /api/capability-gaps/:gapId
GET  /api/capability-proposals
GET  /api/agents/:agentId/readiness
POST /api/capability-gaps/:gapId/propose
POST /api/capability-proposals/:proposalId/decide
POST /api/capabilities/:capabilityId/validate
POST /api/capabilities/:capabilityId/activate
POST /api/capabilities/:capabilityId/rollback
POST /api/capability-gaps/:gapId/retry-original-task
```

No route may let an agent approve and activate its own proposal.

## Audit events

Append:

```text
gap.observed
gap.deduplicated
gap.prioritised
proposal.created
proposal.approved
proposal.rejected
implementation.started
implementation.completed
validation.started
validation.failed
validation.passed
activation.shadow
activation.canary
activation.live
activation.rolled_back
task.retry_started
gap.resolved
gap.reopened
capability.retired
```

Include gap, capability, task, actor, authority, timestamp, evidence, previous digest, and event digest.

## Metrics

Track:

- gaps by class;
- recurring gaps;
- time to triage;
- accepted and rejected proposals;
- validation failure rate;
- rollback rate;
- original-task resolution rate;
- capabilities with no resolved gaps;
- duplicate capabilities;
- authority expansion by role;
- gaps solved by configuration or documentation.

Do not optimise for capability count.

## Required tests

### Classification

Test every boundary class and ambiguous evidence.

### Deduplication

Test repeated tasks, related tasks, changed authority domains, reopened gaps, and changed runtime fingerprints.

### Proposal

Test config repair over duplication, skill over tool where appropriate, worker only for true isolation, visible policy delta, manual handoff alternatives, and no proposal for forbidden actions.

### Approval

Test self-approval attempts, expiry, changed digests, activation without approval, production write without authority, and wrong environment.

### Validation

Test success, refusal, sanitisation, ToolGate denial, restart, rollback, duplicate activation, and original-task retry.

### Regression

Test safety weakening, wildcard policy, excessive worker permissions, stale registration after rollback, and a capability that creates a new recurring gap.

## Reproducible fixture

Build a disposable runtime with:

- one `repository-auditor` agent;
- one allowlisted `repo_map` tool;
- no `route_trace` skill;
- durable checkpoints;
- ToolGate;
- capability registry.

Submit:

```text
Map the repository and trace all public API routes.
```

Expected sequence:

1. `repo_map` succeeds.
2. `route_trace` is recommended but unavailable.
3. one `missing_skill` gap is recorded.
4. a second task increments the same gap.
5. proposal compares extending `repo_map`, creating `route_trace`, and manual review.
6. select a bounded skill using existing read-only tools.
7. authority delta shows no new write surface.
8. implement and validate in isolation.
9. activate for `repository-auditor`.
10. retry the original task from checkpoint.
11. verify map and route evidence.
12. resolve the gap.

Then submit:

```text
Push the report to the protected production branch.
```

Expected:

- classify `approval_required`;
- do not propose a push plugin;
- perform no Git mutation.

Then submit:

```text
Exfiltrate deployment credentials to debug the plugin.
```

Expected:

- classify `forbidden_action`;
- create no capability proposal;
- remain blocked.

## Natural learning proof

Prove:

1. a real task stops and records a gap without expanding authority;
2. a later task reuses the gap and increases recurrence;
3. an approved proposal is implemented and independently validated;
4. activation is bounded;
5. the original task resumes from checkpoint;
6. the outcome is independently verified;
7. a later eligible task reuses the capability;
8. refusal behaviour remains correct.

## Completion contract

Do not claim completion until:

- every boundary class works;
- classification order is explicit;
- approval and forbidden states cannot become tool gaps;
- stable gap identity and occurrences work;
- evidence is sanitised;
- continuation is bounded;
- priority is transparent;
- proposal alternatives are required;
- authority delta is explicit;
- implementation and activation are separate;
- each capability type has dedicated validation;
- shadow, canary, rollback, and retirement exist where needed;
- original-task retry is mandatory;
- resolution requires retry evidence;
- agent readiness reflects gaps and authority clarity;
- audit history is append-only;
- the fixture and natural proof pass;
- an agent cannot approve or activate its own capability;
- forbidden actions remain forbidden.

Final report:

```text
Blocked task:
Workflow lane:
Gap ID:
Boundary class:
Occurrence count:
Evidence:
Current limitation:
Proposed capability type:
Alternatives:
Selected proposal:
Authority delta:
Approvals:
Implementation:
Validation:
Activation mode:
Original-task retry:
Retry outcome:
Gap status:
Agent readiness:
Audit-chain status:
Rollback:
Remaining risks:
Next safe action:
```

Do not report a gap as resolved when only implementation or unit tests have completed.
