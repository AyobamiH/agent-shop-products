# Production agent operating files

A production prompt for designing and implementing the complete operating-file pack for a specialised AI agent: role, scope, policy, tools, identity, behaviour, user context, heartbeat, durable memory, machine-enforced permissions, runtime code, tests and operator-facing evidence.

This prompt is based on the working OpenClaw agent catalogue. Its production agents use local governance files together with `agent.config.json`, runtime entrypoints, orchestrator task wiring, ToolGate policy, persistent state paths and explicit status evidence. The operating Markdown files shape behaviour, but configuration and code remain the enforcement authority.

## Requirements

- An existing TypeScript or JavaScript agent runtime, or a repository where one will be added.
- A task orchestrator or clearly defined invocation entrypoint.
- A machine-readable agent manifest.
- A tool or skill gateway that can enforce permissions.
- Durable runtime or service-state storage.
- A test runner.
- A named agent role with a bounded outcome.
- Explicit approval boundaries for files, network, secrets and external writes.

This prompt does not create a fictional “super-agent” by writing personality prose. It creates a complete, testable and governed agent package.

## Prompt: build a production agent operating-file pack

Paste everything below the line into an AI coding assistant. Replace bracketed agent, repository and task names where required, but preserve the authority ordering, file contracts, runtime validation and status-truth rules.

---

Build a production-grade operating-file pack and runtime contract for this agent:

```text
Agent name: [AGENT NAME]
Agent ID: [stable-agent-id]
Primary role: [bounded role]
Primary orchestrator task: [task type]
Required deliverable: [structured deliverable]
Repository root: [repository]
Agent directory: [agents/stable-agent-id]
```

Use this operating model:

```text
MISSION
  → ROLE
  → SCOPE
  → POLICY
  → CAPABILITIES
  → TOOLS
  → MEMORY
  → RUNTIME
  → VERIFICATION
  → HEARTBEAT
  → OPERATOR EVIDENCE
```

## Objective

The completed agent must prove:

1. what it exists to accomplish;
2. which tasks belong to it;
3. which tasks must be delegated, escalated or refused;
4. which inputs it accepts;
5. which outputs it guarantees;
6. which skills and tools it may use;
7. which files, networks, secrets and external systems it may access;
8. how it stores bounded cross-run memory;
9. how it reports success, blocked work, escalation and refusal;
10. how it verifies its own result;
11. how runtime health is observed;
12. how the orchestrator knows whether the agent is declared, runnable, installed and genuinely working.

A complete operating-file pack must align prose, configuration, code, tests and runtime evidence.

## Authority order

Use this authority order when files disagree:

```text
1. runtime/provider evidence
2. executable code and ToolGate enforcement
3. agent.config.json
4. task-handler and orchestrator registration
5. local governance files
6. README and catalogue descriptions
7. aspirational notes
```

Do not silently leave contradictions.

If `TOOLS.md` claims network access but `agent.config.json` denies it:

- the configuration denial wins;
- validation must report documentation drift;
- the agent must not attempt the network action.

If the README says “service running” but no host service evidence exists:

- report the service state as unverified;
- do not infer running status from source presence.

## Agent directory

Create or normalise:

```text
agents/
  [agent-id]/
    README.md
    ROLE.md
    SCOPE.md
    POLICY.md
    TOOLS.md
    SOUL.md
    IDENTITY.md
    USER.md
    HEARTBEAT.md
    agent.config.json
    package.json
    src/
      index.ts
      service.ts          # only when a resident service is genuinely required
      types.ts
      validation.ts
    test/
      contract.test.ts
      permissions.test.ts
      runtime.test.ts
      refusal.test.ts
```

Required files:

```text
README.md
ROLE.md
SCOPE.md
POLICY.md
TOOLS.md
agent.config.json
src/index.ts
```

Recommended behavioural files:

```text
SOUL.md
IDENTITY.md
USER.md
HEARTBEAT.md
```

A missing recommended file must be an explicit design decision, not an accidental omission.

## File responsibilities

Keep each file narrow.

### `README.md`

Owns:

- current status;
- primary task;
- canonical contract locations;
- mission summary;
- input/output contract;
- runtime mode;
- operator usage;
- validation commands;
- governance summary;
- known limitations.

It must not duplicate every rule from every file.

### `ROLE.md`

Owns:

- purpose;
- role-exact outcome;
- definition of done;
- responsibilities;
- delegation boundaries;
- must-never-do rules.

### `SCOPE.md`

Owns:

- in-scope tasks;
- out-of-scope tasks;
- accepted inputs;
- output surfaces;
- filesystem boundaries;
- external-system boundaries;
- escalation targets;
- assumptions and exclusions.

### `POLICY.md`

Owns:

- permission rules;
- approval requirements;
- refusal rules;
- evidence requirements;
- privacy rules;
- external-write boundaries;
- failure and escalation semantics.

### `TOOLS.md`

Owns:

- declared skills and tools;
- selection rules;
- allowed arguments;
- quotas and budgets;
- verification requirements;
- fallback behaviour;
- prohibited tool use.

### `SOUL.md`

Owns:

- durable values;
- decision principles;
- communication posture;
- approach to uncertainty;
- relationship to evidence and safety.

It must not grant capabilities.

### `IDENTITY.md`

Owns:

- concrete behavioural patterns;
- example interactions;
- response structure;
- error style;
- confidence language;
- examples of correct refusal and escalation.

### `USER.md`

Owns:

- user-facing context the agent is allowed to use;
- interaction preferences;
- expected communication style;
- privacy restrictions;
- assumptions the agent must not make.

Do not place secrets or sensitive personal profiles here.

### `HEARTBEAT.md`

Owns:

- liveness expectations;
- readiness checks;
- dependency checks;
- stale-state thresholds;
- degraded-state rules;
- heartbeat evidence;
- recovery and escalation;
- what heartbeat must never mutate.

### `agent.config.json`

Owns machine-enforced identity, permissions, constraints, model policy, memory paths, heartbeat and logging.

### `src/index.ts`

Owns the task entrypoint and result contract.

### `src/service.ts`

Owns resident service behaviour only when the agent truly requires a long-running process.

Do not add a fake service entrypoint merely to make the agent appear more operational.

## Role contract

Write `ROLE.md` using:

```markdown
# ROLE

## Purpose

## Primary Outcome

## Done Means

## Responsibilities

## Delegates To

## Escalates When

## Must Never Do
```

The primary outcome must be testable.

Bad:

```text
Be a world-class security agent.
```

Good:

```text
Produce a bounded security posture report containing verified findings,
severity, affected trust boundary, evidence, remediation options and explicit
limits.
```

`Done Means` must describe observable completion.

Examples:

- all required inputs were validated;
- every finding has evidence;
- unsupported claims were excluded;
- the deliverable matches the output schema;
- blocked checks are visible;
- next safe action is present.

## Scope contract

Write `SCOPE.md`:

```markdown
# SCOPE

## In Scope

## Out of Scope

## Accepted Inputs

## Required Inputs

## Outputs

## Read Surfaces

## Write Surfaces

## Network Surfaces

## Secret Surfaces

## Delegation Boundaries

## Escalation Boundaries

## Assumptions

## Explicit Exclusions
```

Classify each surface:

```text
read_only
bounded_local_write
approval_required
forbidden
unsupported
```

Do not use “workspace access” as an unlimited permission.

Name paths, resource classes or governed aliases.

## Policy contract

Write `POLICY.md`:

```markdown
# POLICY

## Authority

## Default Posture

## Allowed Without Additional Approval

## Approval Required

## Forbidden

## Evidence Required

## Privacy And Redaction

## Retry Policy

## Failure Policy

## Refusal Language

## Escalation Language

## Completion Claims
```

Default posture should be least privilege.

Use explicit language:

```text
Refused because [policy boundary].
Escalate because [legitimate task cannot be closed safely].
Blocked because [dependency or evidence is missing].
```

Do not hide these states behind:

```text
Completed with notes.
Mostly done.
Should be fine.
```

## Tool contract

Write `TOOLS.md` with one record per tool or skill:

```markdown
## tool-or-skill-id

Purpose:
Allowed when:
Required inputs:
Allowed arguments:
Prohibited arguments:
Read/write class:
Call budget:
Timeout:
Evidence expected:
Verification:
Fallback:
Refusal:
```

For every tool specify whether it is:

```text
informational
evidence_producing
state_mutating
external_writing
verification_authority
```

The agent must understand that an informational result may not prove completion.

## Machine-readable manifest

Create `agent.config.json` equivalent to:

```json
{
  "id": "agent-id",
  "name": "Agent Name",
  "description": "Bounded role description",
  "version": "1.0.0",
  "author": "Repository owner",
  "primaryTaskTypes": ["task-type"],
  "orchestratorStatePath": "../../orchestrator/data/orchestrator-state.json",
  "serviceStatePath": "../../runtime/agents/agent-id/service-state.json",
  "model": {
    "primary": "configured-primary-model",
    "fallbacks": [],
    "tier": "balanced",
    "temperature": 0,
    "maxTokens": 4096
  },
  "permissions": {
    "skills": {},
    "tools": {},
    "fileSystem": {
      "readPaths": [],
      "writePaths": []
    },
    "network": {
      "allowed": false,
      "allowedDomains": []
    },
    "secrets": {
      "allowed": false,
      "allowedReferences": []
    },
    "externalWrites": {
      "allowed": false,
      "surfaces": []
    }
  },
  "constraints": {
    "timeout": 60000,
    "maxRetries": 1,
    "maximumSteps": 6,
    "memory": "512M",
    "cpu": "1.0",
    "maximumExternalWrites": 0
  },
  "heartbeat": {
    "enabled": true,
    "interval": 300000,
    "checks": [
      "liveness",
      "readiness",
      "state-freshness"
    ]
  },
  "logging": {
    "level": "info",
    "format": "json",
    "destinations": ["stdout"],
    "redaction": true
  }
}
```

Use the runtime’s actual schema where one exists.

Do not invent keys that the runtime ignores without adding validation and implementation.

## Stable identity

Use one stable `id` as the runtime key.

Distinguish:

```text
id
display name
role
service unit name
task type
worker session ID
```

Do not treat an optional or null `agentId` alias as authoritative when the runtime uses `id`.

Changing the stable ID is a migration, not a cosmetic edit.

It affects:

- task routing;
- memory;
- service state;
- metrics;
- ToolGate policy;
- audit history;
- operator UI;
- checkpoints.

## Model policy

Model selection must not be the agent’s identity.

Document:

- primary model class;
- fallback rules;
- context limits;
- cost or rate budget;
- tool restrictions for weaker models;
- behaviour when no suitable model is available.

Fallback must preserve:

- output schema;
- authority limits;
- evidence rules;
- refusal semantics.

Do not let a fallback model inherit tools it cannot safely use.

## Permissions

Represent tool or skill permission as structured policy:

```ts
interface CapabilityPermission {
  allowed: boolean;
  maxCalls: number;
  rateLimit: string | null;
  modes: Array<"read" | "validate" | "execute">;
  requiresApproval: boolean;
  allowedTaskTypes: string[];
}
```

For filesystem permissions:

```ts
interface FileSystemPermission {
  readPaths: string[];
  writePaths: string[];
  prohibitedPatterns: string[];
  followSymlinks: boolean;
}
```

For network:

```ts
interface NetworkPermission {
  allowed: boolean;
  allowedDomains: string[];
  allowedMethods: string[];
  maximumRequests: number;
}
```

For secrets:

```ts
interface SecretPermission {
  allowed: boolean;
  allowedReferences: string[];
  revealValues: false;
}
```

A secret reference may be usable without the value being printable.

## Durable memory

Every agent must define:

```text
orchestratorStatePath
serviceStatePath
```

The orchestrator state is shared workflow context.

The service state is the agent’s bounded runtime timeline.

Define a state record:

```ts
interface AgentServiceState {
  schemaVersion: "1.0.0";
  agentId: string;
  lastRunAt: string | null;
  lastStatus:
    | "completed"
    | "watching"
    | "blocked"
    | "escalate"
    | "refused"
    | "failed"
    | null;
  lastTaskId: string | null;
  lastTaskType: string | null;
  successCount: number;
  blockedCount: number;
  failedCount: number;
  refusalCount: number;
  lastEvidenceReferences: string[];
  timeline: Array<{
    timestamp: string;
    taskId: string;
    status: string;
    summary: string;
    evidenceReferences: string[];
  }>;
}
```

Bound timeline retention.

Do not store:

- complete private prompts;
- secrets;
- raw credentials;
- unnecessary personal data;
- unlimited transcripts.

Memory must distinguish:

```text
fresh_runtime_truth
durable_verified_lesson
historical_context
stale_belief
inference
```

## User context

`USER.md` must contain only context relevant to the agent’s role.

Example:

```markdown
# USER

## Relationship

This agent supports an operator responsible for [domain].

## Communication Preferences

- lead with the operational conclusion;
- show evidence;
- distinguish verified facts from assumptions;
- state approval boundaries explicitly.

## Never Assume

- access is authorised;
- a draft may be published;
- credentials may be displayed;
- silence means approval;
- a configured service is running.

## Privacy

Do not persist private conversation content unless the task contract requires a
sanitised durable record.
```

Do not copy a general user profile into every agent.

## Soul and identity consistency

`SOUL.md` defines principles.

`IDENTITY.md` demonstrates those principles through behaviour.

Validate consistency.

Example:

If `SOUL.md` says “evidence before claims,” `IDENTITY.md` must not include example responses that present estimates as verified facts.

If `SOUL.md` says “concise,” the output examples should not be unnecessarily verbose.

These files guide behaviour but must not bypass policy.

## Runtime entrypoint

Implement:

```ts
export interface SpecialistRequest {
  taskId: string;
  taskType: string;
  intent: string;
  inputs: Record<string, unknown>;
  approvalContext: {
    approved: boolean;
    approvalIds: string[];
  };
  runtimeContext: {
    statePath: string;
    serviceStatePath: string;
  };
}
```

Return:

```ts
export interface SpecialistResult {
  operatorSummary: string;
  recommendedNextActions: Array<{
    action: string;
    requiresApproval: boolean;
    rationale: string;
  }>;
  specialistContract: {
    role: string;
    workflowStage: string;
    deliverable: string;
    status:
      | "completed"
      | "watching"
      | "blocked"
      | "escalate"
      | "refused";
    refusalReason: string | null;
    escalationReason: string | null;
  };
  evidence: Array<{
    type: string;
    reference: string;
    summary: string;
  }>;
  confidence: {
    level: "high" | "medium" | "low";
    reasons: string[];
  };
  changedState: boolean;
  externalWrites: number;
}
```

Do not return a generic success boolean as the only status.

## Input validation

Validate:

- task type;
- required input keys;
- file paths;
- resource IDs;
- approval context;
- task-to-agent mapping;
- input size;
- unsupported modes.

Invalid input must be:

```text
refused
```

or:

```text
blocked
```

according to cause.

Do not continue with guessed critical inputs.

## Output validation

Before returning:

- validate schema;
- confirm role and workflow stage;
- confirm required deliverable fields;
- confirm evidence references;
- confirm changed-state declaration;
- confirm external-write count;
- confirm refusal and escalation consistency;
- confirm no secret leakage;
- confirm next safe action.

A `completed` result must not contain a refusal reason.

A `refused` result must contain a refusal reason.

An `escalate` result must contain an escalation reason.

## Evidence contract

Every important claim must reference:

```text
code
configuration
runtime
provider readback
test result
public proof
operator approval
```

Classify evidence:

```ts
type EvidenceClass =
  | "code_truth"
  | "config_truth"
  | "runtime_truth"
  | "provider_truth"
  | "test_evidence"
  | "public_proof"
  | "approval_record"
  | "inference";
```

Do not cite the agent’s own previous output as independent proof.

## Verification authority

Decide whether the agent may verify its own work.

Use one of:

```text
self_verification_allowed
independent_verifier_required
provider_readback_required
operator_review_required
```

Examples:

- formatting output may allow self-verification;
- code mutation usually requires tests or a verifier;
- external publication requires provider readback;
- legal or policy conclusions may require human authority.

Record the chosen rule in `POLICY.md` and code.

## Tool selection

The runtime should select tools from the manifest, not from prose alone.

Before each call:

1. confirm task type;
2. confirm tool is declared;
3. confirm mode;
4. confirm call budget;
5. confirm path/domain;
6. confirm approval;
7. call through ToolGate;
8. record sanitised arguments;
9. record result and evidence;
10. decide whether continuation is safe.

Do not call undeclared tools merely because the model knows they exist.

## Retry policy

Retry only:

- clearly transient operations;
- within the declared retry budget;
- when duplicate side effects are impossible or controlled;
- when new evidence justifies another attempt.

Do not automatically retry:

- approval denials;
- forbidden requests;
- validation failures without a repair;
- ambiguous external writes;
- secret-access refusal;
- repeated identical failures.

## Heartbeat contract

Write `HEARTBEAT.md`:

```markdown
# HEARTBEAT

## Purpose

## Liveness

## Readiness

## Dependencies

## State Freshness

## Degraded Conditions

## Failed Conditions

## Evidence

## Recovery

## Escalation

## Must Never Mutate
```

Heartbeat must distinguish:

```text
alive
ready
degraded
failed
unknown
```

An alive process may not be ready.

Example checks:

- process entrypoint responds;
- manifest validates;
- state path is readable;
- required dependency health passes;
- last task is not stuck;
- ToolGate bindings exist;
- service state is fresh.

Heartbeat must not:

- restart the agent;
- clear state;
- rotate credentials;
- publish;
- repair configuration;
- consume production work.

It reports; a separate governed controller repairs.

## Runtime modes

Distinguish:

```text
declared
spawned_worker_capable
worker_contract_proven
service_available
service_installed
service_running
service_healthy
```

Definitions:

### `declared`

Folder and manifest exist.

### `spawned_worker_capable`

The orchestrator can invoke the task entrypoint.

### `worker_contract_proven`

A real orchestrator task completed through the worker path and produced valid evidence.

### `service_available`

A real resident service implementation exists in source.

### `service_installed`

A matching service unit exists on the current host.

### `service_running`

Host evidence proves the unit or process is running.

### `service_healthy`

Required liveness, readiness and dependency checks pass.

Never collapse these states.

## Resident service decision

Add `src/service.ts` only when at least one condition applies:

- continuous monitoring;
- inbound queue ownership;
- webhook reception;
- periodic local processing;
- stateful long-lived connection;
- latency requirement incompatible with worker spawn.

Prefer spawned-worker mode for bounded tasks.

A source file named `service.ts` does not prove installation or running status.

## Orchestrator registration

When the agent should run through the orchestrator:

1. register stable agent ID;
2. map supported task types;
3. validate task/agent/skill bindings;
4. add ToolGate policy;
5. define timeout in one unit;
6. define checkpoint or state paths;
7. expose operator status;
8. add a real synthetic task proof.

Do not leave duplicate task maps in several files.

Use one canonical task/agent/skill map where possible.

## Timeout units

Use explicit units.

Prefer:

```json
{
  "constraints": {
    "timeoutMs": 60000
  }
}
```

When the runtime schema uses `timeout`, document that it is milliseconds and validate it.

Do not mix seconds and milliseconds across manifests.

## Logging

Use structured logs:

```ts
interface AgentLogEvent {
  timestamp: string;
  agentId: string;
  taskId: string | null;
  taskType: string | null;
  level: "debug" | "info" | "warn" | "error";
  event: string;
  status: string | null;
  evidenceReferences: string[];
  redacted: boolean;
}
```

Never log:

- secret values;
- raw authorization headers;
- private keys;
- full private messages;
- unbounded document contents;
- complete environment blocks.

## Capability and readiness drift

Add validation comparing:

```text
ROLE.md responsibilities
SCOPE.md tasks
POLICY.md permissions
TOOLS.md declarations
agent.config.json permissions
source imports and calls
task-handler bindings
ToolGate policy
runtime evidence
README status
```

Report:

```ts
interface AgentContractDrift {
  subject: string;
  strongerSource: string;
  weakerSource: string;
  contradiction: string;
  severity: "low" | "medium" | "high" | "critical";
  nextSafeAction: string;
}
```

Examples:

- tool documented but denied in manifest;
- task mapped but not listed in scope;
- network call in source while network disabled;
- README claims service running without host proof;
- memory path missing;
- output uses generic success instead of specialist status.

## Build sequence

Follow this sequence:

### Phase 1: reconnaissance

Inspect existing agent folders, runtime schemas, task maps, ToolGate, state paths and result contracts.

### Phase 2: role design

Define the outcome, task ownership, exclusions, delegation and success criteria.

### Phase 3: governance files

Write ROLE, SCOPE, POLICY and TOOLS.

### Phase 4: behavioural files

Write SOUL, IDENTITY and USER with examples aligned to policy.

### Phase 5: machine contract

Create or update `agent.config.json`.

### Phase 6: runtime

Implement `src/index.ts` and optional `src/service.ts`.

### Phase 7: orchestration

Register the agent, task types, skills, tools and status surface.

### Phase 8: heartbeat and memory

Implement state updates, bounded timeline and heartbeat evidence.

### Phase 9: validation

Run contract, permission, runtime, refusal, evidence and drift tests.

### Phase 10: proof

Execute one bounded synthetic task through the real orchestrator path.

## Required tests

### File-contract tests

Test:

- all required files exist;
- headings exist;
- stable ID matches;
- primary task is consistent;
- canonical authority is named;
- no unresolved placeholders remain.

### Manifest tests

Test:

- valid schema;
- stable ID;
- state paths;
- permissions;
- timeout unit;
- retry budget;
- heartbeat;
- logging;
- no unknown keys unless supported.

### Permission tests

Test:

- allowed skill;
- denied skill;
- denied network;
- allowed domain;
- denied secret;
- allowed secret reference without value exposure;
- allowed read path;
- denied write path;
- symlink escape;
- external-write denial.

### Runtime tests

Test:

- valid request;
- wrong task type;
- missing input;
- blocked dependency;
- completed result;
- watching result;
- escalation;
- refusal;
- result-schema validation;
- memory update;
- bounded timeline.

### ToolGate tests

Test:

- declared capability allowed;
- undeclared capability denied;
- exhausted call budget;
- approval-required mode;
- sanitized arguments;
- duplicate action;
- timeout.

### Evidence tests

Test:

- code claim with code evidence;
- runtime claim without runtime evidence is rejected;
- inference labelled;
- no self-citation as independent proof;
- external success requires provider readback where applicable.

### Status-truth tests

Test:

- manifest only → declared;
- entrypoint exists → spawned-worker capable;
- synthetic task passes → worker contract proven;
- service source exists → service available;
- unit exists → service installed;
- active process → service running;
- readiness failure → not service healthy.

### Heartbeat tests

Test:

- alive and ready;
- alive but degraded;
- stale state;
- dependency down;
- missing manifest;
- heartbeat performs no mutation.

### Drift tests

Test:

- README/config contradiction;
- tools/config contradiction;
- code/network contradiction;
- scope/task-map contradiction;
- timeout unit mismatch;
- missing memory path;
- service-status overclaim.

## Reproducible fixture

Create a fixture agent:

```text
Agent:
release-readiness-agent

Role:
Synthesize release posture from existing verification, security and build
evidence.

In scope:
Read evidence and return go, hold or block.

Out of scope:
Run deployment, publish a release, mutate Git, approve itself.

Tools:
verification-read
security-read
build-evidence-read

Memory:
bounded service-state timeline

Runtime:
spawned worker only
```

Prove:

1. required operating files are created;
2. the manifest denies network, secrets, Git and external writes;
3. role, scope, policy, tools and config agree;
4. valid evidence returns `completed` with `go`, `hold` or `block`;
5. missing evidence returns `blocked`;
6. a deployment request returns `refused`;
7. ambiguous evidence returns `escalate`;
8. service state updates;
9. heartbeat reports worker readiness without claiming a resident service;
10. a real orchestrator synthetic task validates the specialist result.

Then intentionally introduce:

```text
TOOLS.md says deploy-tool is allowed.
agent.config.json denies it.
```

Prove:

- manifest authority wins;
- tool invocation is denied;
- drift validation fails;
- README does not claim capability.

## Completion contract

Do not claim the agent complete until:

- every required file exists;
- no placeholders remain;
- stable identity is consistent;
- role outcome is testable;
- scope and exclusions are explicit;
- policy defines approval, forbidden and evidence rules;
- every tool has a bounded contract;
- behavioural examples align with policy;
- user context is relevant and privacy-safe;
- machine permissions enforce the documented boundary;
- memory paths exist and are used;
- result contract supports completed, watching, blocked, escalate and refused;
- refusal and escalation reasons are explicit;
- evidence classes are represented;
- heartbeat distinguishes liveness from readiness;
- runtime modes are not collapsed;
- resident service mode is justified or absent;
- task, agent and skill bindings validate;
- ToolGate enforces access;
- contract drift tests pass;
- synthetic runtime proof passes;
- no README or manifest overclaims service-running status;
- external writes equal the approved count.

Final report:

```text
Agent ID:
Agent name:
Primary role:
Primary task types:
Required files:
Recommended files:
Stable identity:
Runtime mode:
Service mode:
Manifest:
Skills:
Tools:
File permissions:
Network permissions:
Secret permissions:
External-write permissions:
Memory paths:
Heartbeat:
Specialist result contract:
Task wiring:
ToolGate:
Tests:
Synthetic run:
Runtime evidence:
Contract drift:
Known limitations:
Approval boundaries:
Next safe action:
```

Do not report the agent as production-ready when only the persona files or manifest have been written.
