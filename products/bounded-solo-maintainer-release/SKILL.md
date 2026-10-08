---
name: bounded-solo-maintainer-release
description: Carry out an explicitly owner-authorised source-repository release when a non-author review gate cannot be satisfied and a narrow solo-maintainer exception is recorded. Preserve required checks, exact revisions, protected merge, rollback evidence and production readback without inventing independent review.
---

# Bounded Solo-Maintainer Release

Apply this workflow only to an explicitly authorised owner-controlled release. A missing reviewer is a constraint, not automatic permission to waive a gate.

## Resolve authority and scope

Identify the owning repository, release target, current governance, account authority and owner instruction. Reuse authorisation already established in the session. If the owner has not authorised an exception and the gate applies, retain the blocked state and identify the required decision.

Separate maintenance of the owned source/service from systems it inspects. An exception for releasing a verifier never grants mutation rights over inspected repositories or customer systems. Preserve executor/verifier and credential boundaries.

Do not impersonate another reviewer, switch accounts to manufacture non-author approval, approve the agent's own work or claim that an owner decision is an independent review.

## Record the bounded exception

If explicitly authorised and consistent with controlling instructions, encode the smallest exception in the repository's normal governance record before merging:

- named owner-controlled scope and affected release;
- why non-author review is unavailable;
- required technical review and checks that still apply;
- normal protected merge and exact-head guard;
- deployment, smoke and rollback requirements;
- exclusions from wider automation or target-system authority.

Determine eligibility from the recorded policy and actual diff. In the demonstrated maintenance exception, the patch must add no target-system writes, credential or signing authority, authentication scope, private-data storage, new network destination or workflow/deployment authority. Changes outside that boundary retain their normal review requirements.

Avoid a blanket exemption for future changes. Do not disable branch protections or weaken contracts to force a release.

Review the policy change and source change as separate concerns. Manual technical review is not a formal security scan; do not fabricate scan artefacts or reviewer attestations.

## Bind validation to exact bytes

Inspect every changed file in scope. Run the repository-required checks and meaningful targeted regressions on the exact candidate. Record command results, candidate revision and file/tree identity.

Require all applicable status checks on that exact head. Preserve immutable compatibility fixtures and any narrowly permitted migration. Before merging, re-read the branch head and reject stale evidence if it has moved.

Use the normal merge mechanism with an expected-head guard. Read back the merged/main commit and signature status rather than assuming that a command succeeded. A squash merge has its own revision and must be tied to the released tree.

## Prepare and perform the release

Capture the previous deployed revision and rollback path. Use the existing authorised deployment mechanism with the least authority needed. Keep credentials and secret values out of commands, arguments, logs and reports.

Preserve unrelated bindings and configuration, including ownership-verification settings. Bind the build and deployment to the merged revision. Do not substitute a later dirty checkout or untested branch.

After release, verify required health/protocol/policy/support routes, expected tool inventory and configuration through approved read-only readback. Match the build revision independently where possible.

If the outcome is ambiguous, reconcile deployed state before retrying or rolling back. Follow the recorded recovery path for an actual failed release.

## Recheck downstream gates

Refresh provider discovery and privacy/metadata checks on the same intended draft. Record actual finding readback; source edits alone do not clear a scanner.

Keep deployment, provider scan, written review scenarios, executed live cases, walkthrough, submission, approval, publication and clean-account acceptance separate. Complete definitions and a successful owner release do not establish a customer-ready integration.

## Return a release record

State the owner decision and bounded policy exception; technical review scope; exact candidate and merged revisions; required check results; previous and current runtime; smoke/readback; provider findings; rollback status; and remaining acceptance gates.

Use [release calibration cases](references/release-cases.md) to check scope and evidence labels.
