---
name: stale-lease-recovery-and-single-flight
description: Diagnose durable graph capacity exhausted by stale attempts, recover proven effect-free work through targeted lifecycle APIs, and coalesce equivalent live attempts. Use when raw running rows disagree with lease or executor truth, or periodic monitors overlap despite time-bucket idempotency.
---

# Stale Lease Recovery and Single Flight

Use canonical attempt and effect truth to recover stale capacity and admit future work safely.

## Inspect without changing lifecycle state

Read the parent run, active attempts, lease deadlines, executor ownership, children, effect ledger, receipts, approvals and capability grants. Record the exact clock and snapshot scope.

Classify live, stale, terminal and unresolved work from these records. An expired lease alone does not establish that an external effect is absent. A raw parent or child marked running does not establish a live executor.

Keep passive discovery read-only. Exclude proven stale occupancy from a diagnostic projection only when its derivation is explicit; do not silently rewrite durable history during inspection.

## Recover only a proved stale target

Use the existing run-specific recovery API. Before a lifecycle mutation, establish current task authority and require all relevant evidence:

1. The attempt has expired or reached a canonical terminal timeout.
2. No current executor owns a valid lease for the target.
3. The effect and receipt state proves no ambiguous external consequence.
4. No live child, approval or capability state requires continuation.
5. The selected parent and children are within the explicit recovery scope.

Reject recovery of live, terminal-incompatible or effect-ambiguous work. Reconcile uncertain effects before retrying or terminalising. Do not use broad SQL status rewrites as a substitute for the canonical transition.

Back up the relevant durable state. Expire the targeted attempt, close proven orphan children and transition the parent through the supported failure or recovery path. Preserve checkpoint state and append the event history. Compare before and after snapshots; require zero unrelated row changes.

Use a single controlled restart only if the change requires it and it is authorised. Record the restart separately from recovery success.

## Coalesce equivalent live work

Apply exact ingress idempotency first. Then derive a single-flight key from the actual execution identity: graph identity and version, lane, task type and agent or equivalent scope. Include other fields that genuinely distinguish work; do not use a broad topic match.

Reuse only an equivalent run with a current unexpired attempt and valid owner. Failed, terminal, expired or different-lane runs must not suppress a fresh natural tick.

Use the existing durable admission and lease mechanism so simultaneous requests cannot both win. Avoid a second disconnected in-memory or database lock that disagrees with lifecycle truth.

## Verify recovery and admission separately

Exercise stale parent/orphan-child recovery, live rejection, effect ambiguity, repeat recovery, concurrent equivalent ingress, different lane, changed version and later admission after expiry. Check receipts and non-target state, not only exit status.

Observe the next ordinary scheduled cycle and its canonical attempt evidence. A forced run does not prove natural cadence. Concurrency deferral can be normal; unrelated errors remain failures and need their own diagnosis.

Report the recovered target, unchanged scope, coalescing evidence and natural-cycle result. Keep historical acceptance distinct from current runtime health, and keep unrelated process leaks outside the claimed root cause.

Read [calibration cases](references/calibration-cases.md) for common false recovery and suppression decisions.
