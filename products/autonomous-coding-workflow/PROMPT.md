# Autonomous coding workflow with a work ledger

A production prompt for building a resumable coding-agent workflow that selects the next bounded milestone from repository evidence, records every decision in a durable ledger, verifies work before claiming completion and stops at explicit approval boundaries.

This prompt is based on the working maintainer loop behind `coding-agent-skills`. That system uses a `run-next` command, an agent operating contract, roadmap and changelog evidence, a work ledger, permission flags, deterministic validation and append-only run records rather than relying on chat history to remember what should happen next.

## Requirements

- An existing Git repository.
- Node.js 20 or newer, or an equivalent scripting runtime.
- A test runner and project validation commands.
- A roadmap or backlog that can be read from the repository.
- A durable Markdown, JSON or SQL work ledger.
- Explicit permission names for actions that can mutate source, Git history or external systems.
- A clean way to inspect Git state and changed files.
- A place to store machine-readable or human-readable evidence packs.

This workflow is not a general autonomous daemon. It is a bounded maintainer and implementation loop that can continue from durable repository state while stopping before unapproved work.

## Prompt: build a resumable autonomous coding workflow

Paste everything below the line into an AI coding assistant. Replace bracketed repository names and validation commands where required, but keep the ledger, permission, evidence and stop-boundary rules unchanged.

---

Build a production-grade autonomous coding workflow inside this repository.

The workflow must use this loop:

```text
INSPECT
  → ORIENT
  → SELECT
  → AUTHORISE
  → PLAN
  → IMPLEMENT
  → VERIFY
  → RECORD
  → HAND OFF
  → SELECT NEXT
```

The workflow must be able to finish one bounded milestone, persist what happened, and later select the next justified milestone without requiring the original chat prompt.

It must never interpret “continue autonomously” as permission to expand scope, weaken safety rules, publish releases, deploy, push or alter external systems.

## Objective

Create a repository-owned coding workflow that proves:

1. the repository was inspected before changes;
2. the selected milestone came from durable repository evidence;
3. the action matched an explicit permission;
4. only files inside the approved work packet changed;
5. validation was run and recorded;
6. failed verification caused repair or escalation, not false completion;
7. interrupted work can resume from the ledger;
8. duplicate runs do not repeat completed work;
9. Git publication remains separately authorised;
10. the next safe action is explicit after every run.

## Repository-owned state

Create or adopt these files:

```text
AGENTS.md
ROADMAP.md
CHANGELOG.md
work-ledger.md
RUNBOOK.md
runs/
  coding-runs.md
scripts/
  run-next
  validate-workflow.mjs
```

Optional machine-readable state:

```text
.workflow/
  state.json
  schemas/
    work-packet.schema.json
    evidence-pack.schema.json
    run-record.schema.json
```

The repository files are authoritative.

Chat history, model memory and temporary scratchpads are not authoritative workflow state.

## Agent operating contract

Write `AGENTS.md` as an explicit repository contract.

It must define:

- repository purpose;
- files and directories agents may modify;
- allowed read-only inspection;
- allowed action classes;
- permission names;
- required validation;
- evidence requirements;
- Git boundaries;
- external-system boundaries;
- stop conditions;
- escalation format.

Example permission set:

```text
harness-hardening
docs-hardening
test-hardening
adapter-harness
evidence-harness
implementation
release-preflight
commit
tag
push
```

Unknown permissions must fail closed.

A permission flag authorises only that action class. It does not weaken:

- path restrictions;
- test requirements;
- evidence requirements;
- secret handling;
- approval boundaries;
- external-write restrictions.

## Durable work ledger

Create `work-ledger.md` with these sections:

```markdown
# Work Ledger

## Current State

## Last Completed Version

## Current Recommended Milestone

## Allowed Next Actions

## Blocked Actions

## Evidence Required

## Stop Conditions

## Human Approval Required For

## Next Run Command

## Maintainer Decisions
```

The current recommended milestone must be a concrete bounded outcome.

Good:

```text
Add deterministic evidence-bundle replay and compatibility reporting.
```

Bad:

```text
Improve the system.
Continue development.
Make it production ready.
```

Every completed or selected milestone must append a dated decision record:

```markdown
### 2026-08-05T10:00:00Z

- Latest tag observed: `v0.3.0`
- Selected milestone: Add deterministic replay for evidence bundles
- Required permission: `evidence-harness`
- Validation result: pass
- Files changed: `scripts/verify-evidence.mjs`, `test/evidence-replay.test.mjs`
- Stop boundary: implementation complete; release publication requires approval
- Next recommended milestone: Add cross-version fixture coverage
```

Never rewrite historical decisions to make a failed run appear successful.

## Roadmap and changelog

The selector must read:

```text
ROADMAP.md
CHANGELOG.md
work-ledger.md
AGENTS.md
```

Use them for different purposes:

- `ROADMAP.md`: remaining intended work;
- `CHANGELOG.md`: what versions claim to contain;
- `work-ledger.md`: current operational truth and next recommendation;
- `AGENTS.md`: what is authorised.

When these conflict:

1. live repository and test evidence outrank documentation claims;
2. the agent contract outranks roadmap ambition;
3. the work ledger controls current sequencing;
4. changelog claims without implementation evidence become warnings;
5. unresolved contradiction blocks autonomous implementation.

## Clean-start gate

Before selecting or changing work:

```bash
git rev-parse --show-toplevel
git status --short --branch
git branch --show-current
git tag --list
```

Fail closed when:

- repository root cannot be resolved;
- the branch is detached;
- the working tree contains unexplained changes;
- required workflow files are missing;
- the current branch violates policy;
- the ledger is malformed;
- the requested permission is unknown.

Do not auto-stash, reset, clean or discard user changes.

If the tree is dirty, report the exact paths and stop.

## `run-next` interface

Build:

```bash
./scripts/run-next --allow <permission>
```

Support repeatable flags:

```bash
./scripts/run-next \
  --allow implementation \
  --allow test-hardening
```

Without at least one `--allow`, refuse.

Reject unknown arguments and unknown permissions.

The runner must not infer permission from:

- the milestone title;
- previous runs;
- repository credentials;
- the current user;
- a model instruction;
- the existence of a remote.

## Milestone classification

Map the recommended milestone to one required action class.

Example mapping:

```ts
interface MilestoneClassifier {
  pattern: RegExp;
  requiredPermission: string;
  actionClass:
    | "audit"
    | "documentation"
    | "test"
    | "implementation"
    | "release-preflight"
    | "commit"
    | "tag"
    | "push";
}
```

Use explicit patterns and a safe default.

If classification is ambiguous, stop and request a ledger update.

Blocked milestone patterns should include:

- new skills or plugins not explicitly approved;
- real project adapters;
- unrelated repositories;
- deployments;
- database migrations;
- service or process mutation;
- secret or credential access;
- safety-policy weakening;
- destructive Git operations;
- external publication.

A blocked pattern must stop before validation or mutation.

## Repository orientation

Before implementation, create a bounded orientation report.

Inspect:

- repository root;
- package manifests;
- source directories;
- tests;
- build configuration;
- CI workflows;
- public APIs;
- current Git state;
- relevant recent commits;
- workflow files;
- existing implementation nearest to the milestone.

Do not read:

- `.env` values;
- private keys;
- credential stores;
- unrelated home directories;
- external repositories not named in the work packet.

Summarise findings as facts, warnings and unknowns.

## Work packet

After selection and authorisation, create an immutable work packet:

```ts
interface WorkPacket {
  schemaVersion: "1.0.0";
  runId: string;
  repositoryRoot: string;
  branch: string;
  milestoneId: string;
  milestoneSummary: string;
  requiredPermission: string;
  grantedPermissions: string[];
  objective: string;
  acceptanceCriteria: string[];
  allowedPaths: string[];
  prohibitedPaths: string[];
  requiredChecks: string[];
  optionalChecks: string[];
  externalWritesAllowed: false;
  gitWritesAllowed: boolean;
  createdAt: string;
  packetDigest: string;
}
```

Calculate `packetDigest` from canonical JSON excluding the digest field.

The work packet controls scope.

Do not silently expand `allowedPaths`.

When implementation reveals necessary work outside the packet:

- record the dependency;
- stop;
- propose a revised packet;
- require approval when the new path or action class crosses policy.

## Run identity and idempotency

Derive a stable milestone identity from:

```text
repository identity
+ milestone ID
+ acceptance criteria
+ relevant baseline commit
```

Each run also receives a unique `runId`.

Store:

- milestone identity;
- run ID;
- baseline commit;
- packet digest;
- status;
- changed paths;
- validation evidence;
- final commit when authorised.

Before starting, check the ledger for:

- completed matching milestone;
- active run;
- interrupted run;
- superseded packet;
- conflicting run.

Do not reimplement a completed milestone merely because the command was run again.

## State machine

Persist:

```text
DISCOVERED
  → SELECTED
  → AUTHORISED
  → PLANNED
  → IMPLEMENTING
  → VERIFYING
  → VERIFIED
  → RECORDED
  → HANDOFF_READY
```

Bounded alternatives:

```text
BLOCKED
NEEDS_APPROVAL
FAILED_VERIFICATION
REPAIRING
INTERRUPTED
SUPERSEDED
ABANDONED
```

Completion requires `VERIFIED` followed by `RECORDED`.

An implementation command exiting zero does not imply `VERIFIED`.

## Validation before implementation

Run repository-level health checks before changing source.

For a Node project, an example set is:

```bash
node scripts/validate-pack.mjs .
node scripts/test-pack.mjs
node scripts/validate-maintainer-loop.mjs .
node --test
git diff --check
```

Replace commands only with existing repository-owned equivalents.

Record:

- command;
- exit code;
- duration;
- bounded stdout and stderr digests;
- pass, fail or skipped;
- reason for skip.

If baseline validation fails:

- determine whether failure predates the run;
- record the evidence;
- do not claim the selected milestone caused it;
- stop unless the approved milestone explicitly targets that failure.

## Planning

Create a plan that maps each acceptance criterion to:

- implementation step;
- expected files;
- verification method;
- failure condition.

Example:

```ts
interface PlanStep {
  id: string;
  acceptanceCriterion: string;
  intendedFiles: string[];
  action: string;
  verification: string[];
  status: "pending" | "active" | "passed" | "failed" | "blocked";
}
```

Do not plan broad refactors unless required by acceptance criteria.

Prefer the smallest architecture that satisfies the milestone and preserves existing contracts.

## Implementation lane

During implementation:

- modify only allowed paths;
- preserve unrelated user work;
- follow existing repository conventions;
- avoid new dependencies unless approved;
- avoid changing public APIs unless required;
- keep migrations, deployments and external writes disabled unless separately authorised;
- record each meaningful state change;
- keep generated files and source files distinguishable.

After each bounded step:

1. inspect the diff;
2. run the narrowest relevant check;
3. update step status;
4. continue only when progress is evidenced.

## Specialist agents

Specialist agents may be used for:

- repository mapping;
- test design;
- security review;
- API compatibility review;
- documentation drift;
- failure diagnosis.

Each specialist receives:

- the same packet digest;
- a narrower path allowlist;
- one explicit question;
- read-only or action capability;
- an evidence-output schema.

Specialists may not:

- broaden the milestone;
- commit or push;
- communicate completion directly to the user;
- change authority;
- overwrite another specialist's evidence.

One integrator owns the final decision and output.

## Verification loop

After implementation, run:

```text
STATIC CHECKS
  → TARGETED TESTS
  → FULL TESTS
  → BUILD
  → CONTRACT CHECKS
  → DIFF REVIEW
  → ACCEPTANCE REVIEW
```

Only run checks that exist or are explicitly added within scope.

For every acceptance criterion, record one of:

```text
verified
failed
skipped
not_verifiable
```

A criterion cannot be marked verified from source inspection alone when runtime or test evidence is required.

## Repair loop

When verification fails:

1. preserve failure evidence;
2. classify the defect;
3. determine whether it is inside the packet;
4. create one bounded repair hypothesis;
5. change the minimum necessary code;
6. rerun the failing check;
7. rerun affected broader checks;
8. record the repair result.

Use a repair budget:

```text
maximumRepairIterations = 3
```

Stop earlier when:

- the same failure repeats without new evidence;
- changes cycle between equivalent states;
- a new dependency or permission is required;
- the packet no longer represents the work;
- risk exceeds the approved class.

Do not endlessly “try another fix”.

## No-progress detection

Calculate a progress fingerprint after each iteration from:

```text
changed-file hashes
+ failing-check identities
+ acceptance statuses
+ unresolved blockers
```

If two consecutive iterations have the same fingerprint, classify:

```text
NO_PROGRESS
```

Stop and report the strongest evidence and next approval needed.

## Evidence pack

Emit an evidence pack:

```ts
interface EvidencePack {
  schemaVersion: "1.0.0";
  runId: string;
  packetDigest: string;
  repositoryRootDigest: string;
  baselineCommit: string;
  finalCommit: string | null;
  branch: string;
  milestone: string;
  permissions: string[];
  changedFiles: Array<{
    path: string;
    status: "added" | "modified" | "deleted";
    beforeDigest: string | null;
    afterDigest: string | null;
  }>;
  checks: Array<{
    command: string;
    exitCode: number | null;
    status: "passed" | "failed" | "skipped";
    stdoutDigest: string | null;
    stderrDigest: string | null;
    reason: string | null;
  }>;
  acceptanceCriteria: Array<{
    criterion: string;
    status: "verified" | "failed" | "skipped" | "not_verifiable";
    evidence: string[];
  }>;
  stateChanges: string[];
  warnings: string[];
  unresolvedQuestions: string[];
  approvalGates: string[];
  nextSafeAction: string;
  completedAt: string;
}
```

The evidence pack must represent:

- failures;
- skipped checks;
- incomplete work;
- dirty-state warnings;
- unresolved approvals;
- external writes not performed.

Never omit negative evidence to make a run look complete.

## Run log

Append a concise human-readable record to `runs/coding-runs.md`:

```markdown
## run-20260805T100000Z

- Milestone: `evidence-bundle-replay`
- Packet: `sha256:...`
- Permissions: `evidence-harness`
- Baseline: `abc1234`
- Files changed: `2`
- Validation: `passed`
- Commit/tag/push: `not performed`
- External writes: `0`
- Final state: `HANDOFF_READY`
- Next safe action: Review and approve commit
```

Write the full evidence pack separately when needed.

## Ledger update

After verified implementation:

- update current state;
- append the decision record;
- mark the milestone completed;
- set the next recommended milestone only when evidence supports it;
- preserve blocked actions;
- preserve release and Git gates.

Do not create speculative future milestones merely to keep the loop busy.

A valid next state may be:

```text
No next runner command is currently queued.
Human direction required.
```

Idle is a valid outcome.

## Git boundaries

By default, the workflow may inspect Git but may not commit.

Require separate permissions:

```text
commit
tag
push
```

### Commit

Before commit:

- verify the tree contains only packet files;
- run required checks;
- inspect the staged diff;
- use explicit file paths;
- record the commit SHA.

Do not use `git add -A` in a mixed worktree.

### Tag

Require:

- verified commit;
- version decision;
- changelog entry;
- release-preflight pass;
- explicit `tag` permission.

### Push

Require:

- correct remote;
- correct branch;
- no unresolved checks;
- explicit `push` permission.

Commit permission does not imply push permission.

Tag permission does not imply package or release publication.

## Release boundary

Release preflight may inspect:

- package version;
- changelog;
- licence;
- packed contents;
- tests;
- build;
- provenance;
- registry availability;
- release notes.

It must not publish unless a separate publication action is explicitly approved.

Represent:

```text
release_preflight_passed
release_publication_not_authorised
```

Do not call that “released”.

## Restart recovery

On startup or the next `run-next` call:

1. read the ledger and machine state;
2. find non-terminal runs;
3. inspect current Git state;
4. compare changed paths with the work packet;
5. inspect recorded checks;
6. classify the run as resumable, blocked, superseded or unsafe;
7. resume only from the first incomplete verified step.

Do not rerun completed mutations merely because the previous process crashed before writing the final message.

If repository state cannot be reconciled, stop with:

```text
INTERRUPTED_UNRESOLVED
```

## External repositories

The workflow may inspect or modify another repository only when the work packet names:

- exact repository root;
- allowed paths;
- action class;
- baseline commit;
- required validation;
- Git permissions.

A shared skills repository may provide safe tools, but the target project owns its adapter and its changes.

Never let a central skill pack silently mutate every project using it.

## Public CLI or orchestrator integration

When exposing the workflow to another orchestrator, return structured output:

```ts
interface WorkflowResult {
  success: boolean;
  status:
    | "complete"
    | "partial"
    | "blocked"
    | "refused"
    | "failed";
  runId: string | null;
  milestone: string | null;
  recommendedNextAction: string;
  safety: {
    externalWrites: boolean;
    gitWrites: boolean;
    secretsRead: boolean;
    destructiveCommands: boolean;
  };
  evidencePackPath: string | null;
  warnings: string[];
}
```

The orchestrator may own routing, memory, scheduling and user interaction.

The coding workflow owns repository evidence and bounded execution.

## Required tests

### Argument and permission tests

Test:

- no `--allow`;
- unknown argument;
- unknown permission;
- several valid permissions;
- permission does not match milestone;
- blocked milestone pattern;
- ambiguous classifier result.

### Repository-state tests

Test:

- clean branch;
- dirty tree;
- detached HEAD;
- missing ledger;
- malformed ledger;
- missing roadmap;
- conflicting active run;
- completed milestone replay;
- interrupted run recovery.

### Scope tests

Test:

- change inside allowlist;
- change outside allowlist;
- symlink path escape;
- generated file outside packet;
- unrelated user file already modified;
- proposed new dependency without permission.

### Verification tests

Test:

- baseline check failure;
- targeted check failure;
- full suite failure after targeted pass;
- skipped optional check;
- required check missing;
- acceptance criterion not verifiable;
- repair succeeds;
- repair budget exhausted;
- no-progress fingerprint repeats.

### Git tests

Use disposable repositories to test:

- exact-file staging;
- mixed worktree refusal;
- commit without push;
- tag permission separation;
- push permission separation;
- wrong remote refusal.

### Evidence tests

Test:

- failed checks remain in evidence;
- skipped checks include reasons;
- changed-file digests match the worktree;
- packet digest is stable;
- run history is append-only;
- ledger update preserves previous decisions;
- next safe action is always present.

## Reproducible end-to-end fixture

Create a disposable repository containing:

```text
AGENTS.md
ROADMAP.md
CHANGELOG.md
work-ledger.md
src/
  calculator.ts
test/
  calculator.test.ts
```

Set the recommended milestone to:

```text
Add division-by-zero validation and tests.
```

Run:

```bash
./scripts/run-next --allow implementation --allow test-hardening
```

Prove:

- the clean-start gate passes;
- the milestone and permission match;
- a work packet is created;
- only `src/calculator.ts` and `test/calculator.test.ts` may change;
- targeted and full tests pass;
- the evidence pack marks every criterion verified;
- the ledger records the result;
- no commit, tag or push occurs;
- a second run does not repeat the completed milestone.

Then run with:

```bash
./scripts/run-next --allow push
```

Prove it refuses because push is not the permission required by the selected milestone.

## Natural continuation proof

Do not declare autonomous continuation from one run.

Use two separate invocations with no new task prompt between them.

### First invocation

- read durable state;
- select the current milestone;
- complete or stop at its boundary;
- write evidence;
- update the ledger;
- record the next justified milestone.

### Second invocation

- start in a new process;
- receive only the repository path and permission flags;
- read the updated ledger;
- avoid repeating the first milestone;
- select the new milestone;
- validate the repository;
- stop at the correct boundary.

The proof must show that continuation came from repository state, not conversation memory.

## Completion contract

Do not claim this workflow complete until:

- `AGENTS.md`, `ROADMAP.md`, `CHANGELOG.md`, ledger and runbook roles are explicit;
- `run-next` fails closed without permission;
- unknown permissions fail closed;
- dirty trees are preserved and block mutation;
- milestone selection comes from durable evidence;
- work packets bind scope and acceptance criteria;
- completed milestones are idempotent;
- interrupted runs reconcile safely;
- validation results include failures and skips;
- repair and no-progress controls are tested;
- evidence packs are complete;
- commit, tag and push are separate permissions;
- external writes remain disabled by default;
- the end-to-end disposable fixture passes;
- two-process natural continuation is proven;
- no original chat prompt is required for the second selection.

Final report:

```text
Repository:
Branch:
Run ID:
Milestone:
Required permission:
Granted permissions:
Packet digest:
Baseline commit:
Files changed:
Validation:
Acceptance criteria:
Repair iterations:
Evidence pack:
Ledger updated:
Commit:
Tag:
Push:
External writes:
Final state:
Approval gates:
Next safe action:
```

Do not report completion when the actual state is `BLOCKED`, `NEEDS_APPROVAL`, `FAILED_VERIFICATION`, `INTERRUPTED` or `NO_PROGRESS`.
