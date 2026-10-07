---
name: safe-scheduled-runtime-upgrade
description: Plan and carry out guarded upgrades of runtimes driven by systemd timers or comparable schedulers. Use when upgrading scheduled workers, draining background jobs before a release, recovering an interrupted switch, distinguishing deployment readiness from slow diagnostics, or preparing a WSL or host configuration restart that affects scheduled work.
---

# Safe Scheduled Runtime Upgrade

Use the runtime's existing release and recovery mechanisms to move to an exact target.
Keep source selection, service quiescence, release application, process readiness, and operational completion as separate observations.

## 1. Establish scope and recovery ownership

- Identify the intended runtime, immutable target revision or artifact digest, and authorised change.
- Reuse authority already established in the conversation; request only missing authority for a concrete expansion of impact.
- Read repository and operations guidance before choosing commands; inspect existing upgrade helpers and their side effects.
- Require a clean, reviewable source tree. Account for generated or untracked files that influence installation; never erase unrelated changes.
- Record the current managed release and running process identity separately from checkout identity.
- Identify the recovery owner, fallback release, state compatibility constraints, backup or snapshot policy, and an available recovery connection.
- Agree how to resume or contain scheduled work if the outcome becomes ambiguous. Do this before pausing anything.
- Treat previously interrupted release metadata as an unresolved operation; reconcile it before starting another switch.

Produce a bounded plan with target, affected work, drain deadline, apply mechanism, recovery rule, and acceptance checks.
For a configuration change requiring a host or virtual-machine restart, also follow the restart branch below.

## 2. Inventory every route that can start work

Inspect actual definitions and overrides, including indirect triggers and manual writers.
Record only the metadata needed for recovery; keep credentials and workload payloads out of logs.

| Surface | Required observation |
| --- | --- |
| Runtime | Release metadata, executable or artifact identity, process-reported revision |
| Timers and schedules | Loaded, active, enabled, masked, next trigger, missed-run or catch-up policy |
| Services and workers | Active and transition state, main and control PIDs, relevant child processes |
| Manager jobs | Queued starts, restarts, stops, dependencies and job identifiers |
| Dependencies | Trigger targets, stop propagation, restart policies, socket/path activation |
| Other writers | Manual jobs, queue consumers, external schedulers and shared-state locks |
| Recovery | Original activation states, unit/configuration versions, safe resume or hold rule |

Confirm that pausing a trigger will not unexpectedly stop a running worker.
If the helper cannot preserve the observed configuration, stop before mutation and revise the plan.
Do not enable a disabled timer, unmask a unit, add a missing service, or broaden the managed set implicitly.

## 3. Prepare a recoverable pause

- Take an exclusive upgrade lock where supported; retain the application's own state and release guards.
- Persist a private recovery record outside the state included in the release-review digest.
- Record original states before each change, including intent before a partially failing stop operation.
- Define a cleanup path for normal failure and catchable cancellation, plus external recovery for connection loss or forced termination.
- Treat restoring schedules as consequential: overdue or catch-up work may start immediately.
- Use the agreed recovery rule if partial installation would make automatic resumption unsafe; identify the responsible operator and held work.

Keep the drain deadline finite and appropriate to the longest authorised job.
Do not kill workers, delete locks, reset failed state, or rewrite receipts to make the runtime appear idle.

## 4. Pause new wake-ups and drain existing work

Pause only the inventoried triggers covered by the plan. Verify their observed state after each request.
Prevent new work from alternate activation routes or leave the upgrade blocked until their owner contains them.
Then poll the service manager and application job state within the drain deadline:

1. Require relevant services to leave starting, running, stopping, or restarting transitions.
2. Require main/control PIDs and relevant child processes to be absent.
3. Require queued starts and restarts, including dependency jobs, to be resolved.
4. Require in-flight application work to finish or reach a documented recoverable checkpoint.
5. Recheck for new jobs immediately before the release review; retain the atomic release guard against later races.
6. On timeout or cancellation, record outstanding work, skip application, and run the agreed restoration path.

An empty PID field alone does not prove quiescence. A failed service can still leave an unresolved external effect.
Treat queued manager work as pending even when every inspected worker currently appears inactive.

## 5. Create a fresh review and apply once

- Generate the release review only after the idle conditions hold; bind it to the exact target and current relevant state.
- Inspect the proposed file, configuration, migration and service changes, and confirm the recovery assumptions still hold.
- Pass the review digest or equivalent precondition to the existing guarded apply operation.
- Keep source, configuration and state drift checks active until the release mechanism commits its change.
- Treat stale-review or concurrent-writer rejection as a blocked attempt. Restore or contain work, investigate drift, and re-plan before another attempt.
- Perform one guarded apply. Preserve its operation identifier, result, timestamps and relevant recovery evidence.

If apply times out, the connection drops, or the reported result conflicts with release metadata, mark the outcome unknown.
Inspect operation state, installed artifacts, running process identity and relevant effect records before deciding what happened.
Do not repeat the switch or initiate rollback merely because a response is missing.
Use rollback only through the documented recovery path after verifying state compatibility and existing authorisation.

## 6. Restore original scheduling states

- Run restoration on success, known failure and catchable cancellation, including partially completed trigger stops.
- Restore each observed activation state; preserve enabled, disabled and masked configuration unless the authorised plan changes it.
- Verify restoration rather than accepting a successful command exit as sufficient evidence.
- Attempt independent restorations even if one fails, provided the recovery rule permits them.
- Record any deliberate recovery hold or restoration failure with its owner, impact and next action.

Do not describe resumed timers as completed jobs. Record any catch-up starts caused by resumption.
After an ambiguous switch, resolve the agreed resume-or-hold decision before reactivating consequential work.

## 7. Verify the running runtime and report pending work

Use a bounded lightweight readiness check that identifies the actual process or serving instance.
Allow a brief startup window where documented; never turn readiness polling into repeated release application.

| Observation | Permitted conclusion |
| --- | --- |
| Checkout at the target | Source selection confirmed |
| Release metadata reports the target | Managed installation recorded |
| Running process reports the target and lightweight readiness passes | Runtime readiness observed for that instance |
| Heavy projection or dashboard snapshot times out | Diagnostic observation pending; preserve independently established readiness |
| Collection or refill start accepted asynchronously | Job submitted; completion pending |
| Saved completion record and relevant readback observed | That operation's outcome verified within the observed scope |

A target runtime can be ready while a timed-out apply's terminal effects remain unknown. Keep those statuses separate until operation reconciliation completes.

Check integrity only within the mechanism's declared scope; do not extrapolate a narrow check to all application state.
If readiness fails after a known switch, record a deployment acceptance failure and use the recovery plan.
Track asynchronous job identifiers to bounded completion evidence or hand them to the owner as pending.
Keep provider outcomes and browser rendering separate from process readiness when those are part of acceptance.

## Configuration restart branch

Use this branch before a WSL, virtual-machine, network or host configuration reload that stops execution.

- Identify the exact restart primitive and everything it stops, including unrelated sessions or workloads on the same host or virtual machine.
- Explain the full stop scope and reuse existing authority only if it covers that impact; otherwise obtain the missing decision after preparing the plan.
- Drain and checkpoint affected work, preserve the prior configuration, and persist the recovery record outside the environment being stopped.
- Record the approved restart action, prior process/job states, pending work and a verification handoff before initiating shutdown.
- Arrange an external observer or recovery channel when the initiating session will disappear; do not rely on an in-process cleanup block surviving shutdown.
- Save observed shutdown/restart evidence through that channel; if unavailable, leave shutdown confirmation unknown.
- After reconnection, verify the configuration took effect, identify the running runtime, and reconcile schedules and queued work before claiming recovery.

Keep a configuration restart and a release switch as distinct operations with separate evidence and recovery ownership.

## Completion report

Report the target and source check, original scheduling state, drain result, guarded apply outcome, restoration result, and running process identity.
Include readiness scope, unresolved effects, deferred diagnostics, asynchronous jobs still pending, and the recovery owner.
Label each result observed, reported, pending, blocked or unknown as supported by evidence.
Use successful tests or a reusable procedure as supporting evidence; claim live acceptance only for checks actually observed in the target environment.
