---
name: ci-admission-and-fallback-triage
description: Use when a CI check reports failure but the job never ran, or when a controlled alternative executor is needed without weakening source and release gates.
---

# CI admission and fallback triage

A red check is an outcome of the CI **service**, not necessarily an executed test failure.

## Partition the failure
1. Freeze the exact commit SHA and required workflow/job names.
2. Read workflow conclusion, job start/end, executed steps and first-party check annotations. Classify **job not admitted**, **environment failed before test**, **tests failed**, **tests passed**, or **evidence unavailable**.
3. If a job never started because of a billing lock, hosted runner allocation, account permission or disabled service, record that exact provider diagnosis. Do not speculate about application defects.

## Produce bounded alternative evidence
1. Use a clean checkout of the exact candidate SHA. Refuse a dirty tree or source mismatch.
2. Run the existing canonical tests rather than writing a new weaker suite; record toolchain, architecture, exit codes and test counts.
3. For an independent provider such as an authorised CircleCI Free project, require an actual job receipt and SHA assertion. Do not assume a passing synthetic or owner-local test is platform parity.
4. Compare the actual job matrix with the mandated checks; label unexecuted platforms **not verified**, not green.
5. Keep the original hosted gate open until it actually passes or a recorded authorised release-policy exception independently accepts the equivalent evidence.

## Durable reporting
Publish only the sanitised diagnosis: exact revision, original CI run link, provider reason, alternate receipt, executed tests, missing checks and next accountable action. Keep secrets, provider tokens and owner billing records outside source.

## Acceptance
A reader can distinguish infrastructure refusal from code failure and verify exactly what was executed. No irreversible deploy, merge, purchase or billing change is inferred from a successful local fallback.

**Evidence boundary:** Agent Shop GitHub Actions parity run #41319820188 was not admitted because the account was billing-locked; nine source parity fixture tests and live readback passed independently on the owner's web machine. This does not convert that hosted run to success. Separate ClawSweeper CircleCI fallback work requires its own revision-specific receipts.
