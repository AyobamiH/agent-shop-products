---
name: account-erasure-with-write-fencing
description: Implement or verify authorised account erasure with durable registry and credential write fences, stale-session rejection and fresh indexed-state readback. Use when already admitted work could recreate deleted data or when deletion receipts are being overclaimed as independent verification.
---

# Account Erasure with Write Fencing

Fence stale work before removing an account's indexed service state.

## Confirm the scoped action

Establish explicit deletion authority, the authenticated target identity and the service's indexed inventory. Read active objectives, sessions, storage, credential vault references, retention rules and external dependencies.

Keep service deletion, upstream account deletion and external key revocation separate. Record known unindexed or retained-state limitations. Do not erase another principal or broader infrastructure based on a historical request.

## Establish durable fences

Identify every write path that admitted work can reach, including background work and credential restoration. Carry an account generation, epoch or equivalent durable guard with admitted work.

On deletion, advance or revoke the registry generation and the credential generation through the canonical lifecycle path before purge can be undermined. Keep the fence observable after ordinary account records are removed.

Recheck the relevant guard at the point each consequence is committed. An admission-only check is insufficient because deletion may occur after admission. A fresh-session rejection is also insufficient to stop an already admitted writer.

Use atomic or compare-and-set semantics appropriate to the actual storage. Do not claim distributed atomicity when separate registry and vault operations merely have a documented order; establish how intermediate failures remain fail closed.

## Remove indexed state and issue a receipt

Invalidate sessions and cancel or quarantine stale work through supported APIs. Purge the authorised indexed records, credentials and derived service data under the retention policy.

Record a privacy-minimised receipt describing the scope and actual result. Do not expose removed personal data, tokens or private keys in the receipt or logs.

Perform fresh authenticated or privileged scoped readback of the indexed inventory. State retained records and limitations explicitly. A receipt is a service assertion, not an independent verifier verdict.

## Exercise the admitted-write race

Use an isolated synthetic fixture when authorised verification would otherwise put a customer account at risk:

1. Admit work with the old registry and credential generations.
2. Pause it immediately before a guarded write.
3. Delete the fixture account and establish the fences.
4. Resume the old writer.
5. Require rejection and read back absence of restored state.
6. Remove all fixture residue and verify cleanup.

Test registry restoration and credential restoration separately. Also test repeated deletion, stale sessions and partial failure. Keep fixture results separate from the real account's deletion result.

## Report scoped acceptance

Return identity-confirmation scope, lifecycle ordering, fenced write paths, receipt, fresh indexed-state readback and race-test result. If a path can still write without a guard, treat fencing as incomplete.

Do not claim statutory compliance, external revocation, complete unknown-store discovery or independent verification from these technical checks alone.

Read [calibration cases](references/calibration-cases.md) for claims that need separate evidence.
