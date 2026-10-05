# Evidence-Backed Open-Source Contribution

## Purpose

Use this skill to take an open-source bug or maintenance opportunity from selection through a maintainer-ready pull request without racing another contributor, solving at the wrong layer, or overstating evidence.

The skill is designed for bounded contributions where reputation matters more than volume.

## Use this skill when

- selecting an issue worth contributing to;
- working from a fork;
- contributing to an unfamiliar repository;
- a project has contributor-specific rules, AGENTS files, DCO, changesets, or release requirements;
- duplicate or competing pull requests are possible;
- local checks, hosted CI, reviewer approval, and merge readiness must be kept distinct;
- you want exact red/green evidence rather than a speculative patch.

## Core principle

A worthy contribution is not just code that seems correct.

It is:

```text
current problem
  + no ownership collision
  + correct architectural layer
  + reproducible failure
  + bounded implementation
  + regression proof
  + repository-native validation
  + honest maintainer-facing evidence
```

## Workflow

### 1. Select for value, not convenience

Prefer issues with:

- real user impact;
- an active maintained project;
- a bounded technical surface;
- a reproducible failure;
- a reasonable automated-test boundary;
- no requirement for unavailable private infrastructure;
- knowledge that transfers to your own engineering.

Avoid selecting a task merely because it is labelled beginner-friendly.

### 2. Read repository rules before touching code

Inspect, in order:

- root `AGENTS.md` or equivalent agent guidance;
- nearest package-specific guidance;
- `CONTRIBUTING.md`;
- pull-request template;
- changeset or changelog rules;
- code style and test conventions;
- branch/commit/DCO requirements.

Repository rules outrank generic contribution habits.

Record any rule that affects:

```text
branching
commit identity
sign-off
AI contribution policy
test commands
generated files
changesets
PR title/body
review boundaries
```

### 3. Check issue ownership and collisions

Before implementation:

- confirm the issue is still open;
- read all issue comments;
- check assignees;
- search open and closed PRs by issue number;
- search by bug wording, relevant symbols, error messages, and likely fix terminology;
- inspect linked development branches if available.

Do not race a contributor who already has a credible implementation.

When a related PR exists, determine whether it:

- directly solves the same issue;
- only touches adjacent behavior;
- is abandoned;
- was rejected for an architectural reason worth learning from.

### 4. Do architecture archaeology before choosing the fix

Search prior and current pull requests for the same architectural layer, not only the issue number.

Look for:

- earlier fixes to the same build subsystem;
- abandoned migrations;
- open migrations that may supersede a narrow patch;
- maintainer review comments explaining rejected dependency or API choices;
- current repository invariants introduced after the original issue was filed.

A closed or stale migration may still contain the most important design rationale.

Do not copy an earlier implementation mechanically. Use its review history to understand which constraints the maintainers already discovered.

### 5. Synchronise the fork correctly

Use the current upstream branch as the contribution base.

Record:

```text
upstream repository
upstream branch
upstream HEAD
fork repository
working branch
branch base SHA
```

Do not assume the fork's default branch is current.

If the fork main is behind and contains no divergent work, fast-forward it before using fork-local PRs for validation.

### 6. Reproduce before fixing

Create the smallest test or fixture that proves the reported failure.

The red state should be:

- deterministic;
- tied to an exact commit;
- specific to the bug;
- easy for maintainers to understand;
- capable of failing independently of the implementation.

Record command, exit status, and meaningful failure evidence.

### 7. Solve at the shared or lowest correct layer

Map the call path before patching.

Ask:

```text
Where is the first incorrect invariant introduced?
Which layer owns the behavior?
Would fixing a caller duplicate logic?
Would fixing a shared layer benefit all consumers?
Does the public API need to change?
```

Prefer a one-layer invariant repair over caller-specific workarounds.

Do not widen authority or behavior merely to make the test green.

### 8. Preserve immutable red/green evidence

Use exact SHAs.

Ideal evidence:

```text
BASE  -> unchanged upstream state
RED   -> regression only, fails for expected reason
GREEN -> implementation + regression, passes
```

When hosted CI is used, keep the RED revision on an immutable branch or workflow run.

A cancelled workflow after a branch update is not red evidence.

If CI cancels superseded runs automatically, pin the red commit to a separate reproduction branch or PR.

### 9. Validate in repository-native layers

Separate:

- focused regression;
- package unit/integration tests;
- typecheck;
- lint;
- formatting;
- build;
- package artifact inspection;
- full CI;
- platform-specific CI;
- reviewer approval.

Do not collapse them into “tests pass”.

When unrelated CI failures exist, compare them against base behavior before attributing them to the patch.

### 10. Review the final diff as a maintainer

Before upstream submission, inspect:

- exact changed files;
- diff size;
- accidental generated files;
- dependency changes;
- public API changes;
- error handling;
- cross-platform behavior;
- comments/JSDoc required by repository rules;
- test strength;
- naming/style consistency;
- release metadata.

Ask whether every changed line is necessary to solve the issue.

### 11. Prepare truthful release and PR metadata

Use the project's required title format.

Explain:

- user-visible problem;
- root cause;
- why the chosen layer owns the fix;
- regression coverage;
- validation performed;
- documentation decision;
- known limitations.

Never mark a checklist item complete if the evidence does not exist.

When one issue contains failures owned by multiple packages or subsystems, state exactly which portion the pull request repairs. Do not use an auto-closing claim for the whole issue unless the remaining reproduction is also eliminated.

### 12. Respect submission boundaries

If repository policy requires a human to open the PR, do not use an agent integration to bypass it.

If an integration lacks permission to open an upstream PR, preserve the reviewed branch and hand off the exact compare link/body rather than inventing another route.

Maintainer approval is distinct from technical correctness.

## Contribution evidence record

Maintain this compact ledger:

```text
Repository:
Issue:
Issue state:
Assignee:
Competing PR search:
Contributor rules:
Upstream base:
Fork branch:
Reproduction:
RED SHA:
RED evidence:
Root cause:
Fix layer:
GREEN SHA:
Focused checks:
Broader checks:
Changeset/changelog:
DCO/sign-off:
PR:
CI:
Reviews:
Remaining gate:
Reusable product lesson:
```

## Collision-check queries

Search more than the issue number.

Use combinations of:

```text
issue number
exact error
affected command
affected function/type
distinctive bug phrase
proposed architectural term
```

A zero-result issue-number search alone is insufficient.

## Concurrent branch safety

Treat a working branch as shared state, even when you created it.

Record the branch head before writing. Before a destructive rewrite, force-push, squash, or reset:

1. read the branch head again;
2. compare it with the recorded SHA;
3. if it advanced unexpectedly, stop the rewrite;
4. inspect the intervening commits and final diff;
5. treat the new work as a teammate contribution until ownership is understood.

Never overwrite a branch merely because its name was created by your workflow. An agent, human, CI repair process, or another authorised session may have advanced it.

When useful, prefer additive commits or a fresh branch over rewriting concurrent work.

## Shell evidence hygiene

Long-running validation commands can produce misleading terminal evidence unless the shell captures status correctly.

For commands piped through `tee`, use `pipefail` or capture the producer's pipeline status explicitly:

```sh
set -o pipefail
npm test 2>&1 | tee /tmp/test.log
TEST_EXIT=${PIPESTATUS[0]}
```

Then report both:

- the command exit status;
- the test framework's final summary.

Do not infer failure from a grep match alone. Test suites often intentionally print exceptions, rejected commands, or negative-case output while still passing.

Avoid interactive pagers when collecting evidence:

```sh
git --no-pager diff ...
git --no-pager log ...
```

This prevents later commands from appearing to be truncated when the terminal is actually waiting inside `less`.

## Commit hygiene

Before review:

- keep the working tree clean;
- avoid unrelated formatting;
- squash exploratory commits when repository norms prefer a clean history;
- preserve fixup commits after review if the repository asks contributors not to rewrite reviewed history;
- use DCO sign-off only when you can truthfully certify it;
- keep author identity consistent with the contributor's intended public identity.

## CI interpretation

Classify CI states precisely:

```text
queued
in progress
passed
failed
cancelled
skipped
action required
not started
```

Do not call `action_required` a test failure when no jobs ran.

Do not call a cancelled red run proof of failure.

Do not call local tests equivalent to upstream CI.

## Maintainer-level stop conditions

Stop and reassess if:

- a competing PR appears;
- current main no longer reproduces;
- the issue is closed as intended behavior;
- the fix requires a breaking API change not discussed in the issue;
- the patch grows far beyond the original ownership boundary;
- tests require credentials or destructive infrastructure not authorised;
- repository policy conflicts with the planned submission method.

## Product-learning capture

After each contribution, extract only demonstrated reusable lessons.

Classify each lesson:

```text
DEMONSTRATED
EMERGING
INTEREST ONLY
```

Only DEMONSTRATED lessons should become source-backed shop products without further validation.

Useful reusable assets include:

- reproduction checklists;
- collision-check workflows;
- package-boundary tests;
- failure-evidence templates;
- maintainer review checklists;
- DCO/changeset preparation;
- CI comparison procedures.

Do not turn project-specific internals or private data into public products.

## Completion contract

Do not call a contribution ready until:

- issue still warrants work;
- competing PR check is current;
- repository instructions were followed;
- exact upstream base is known;
- reproduction exists;
- fix is at the right layer;
- regression test would catch the old bug;
- relevant local/hosted checks are separated and reported truthfully;
- diff is bounded;
- release metadata is correct;
- required sign-off is present;
- upstream PR can be opened within repository policy;
- reusable learning has been captured without unsupported claims.

## Output

Finish with:

```text
Target:
Why worthy:
Collision status:
Repository rules:
Base SHA:
Red SHA:
Root cause:
Fix layer:
Green SHA:
Tests:
CI:
Diff:
Release metadata:
Submission boundary:
Maintainer risks:
Reusable lessons captured:
Next gate:
```
