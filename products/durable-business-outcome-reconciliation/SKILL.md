---
name: durable-business-outcome-reconciliation
description: Recover enquiry and payment outcome evidence without repeating customer fulfilment, using independent idempotency, durable holding, safe cursors and verified publication correlation. Use when successful business actions lose attribution writes or delayed events precede their publication evidence.
---

# Durable Business Outcome Reconciliation

Recover evidence independently of the customer-facing effect.

## Establish event and authority boundaries

Identify authorised sources, event types, existing fulfilment receipts and the exact evidence destination. Define a privacy-minimised allowlist with stable source and event IDs, time, outcome kind and necessary numeric fields.

Reject extra sensitive fields at the ingestion boundary. Store money in its declared minor units with currency; never sum unlike currencies into a single revenue figure.

Distinguish transport connection, event observation, customer fulfilment, evidence persistence and verified publication correlation. An empty connected ledger does not establish zero business activity.

## Separate fulfilment from evidence idempotency

Key customer fulfilment by its canonical receipt identity. Key outcome persistence independently by source and event ID. On duplicate fulfilment delivery, skip the customer action but still reconcile a missing outcome record.

Never retry a charge, enquiry delivery or social publication just to repair evidence. A successful response followed by a failed best-effort write requires an outbox or durable reconciliation path.

Verify event signatures under the source's actual contract. A valid payment signature authenticates the payment event, not caller-supplied campaign labels. Verify signed attribution separately and preserve unverified origin as unknown.

## Persist before acknowledging progress

When a source event cannot yet be correlated, place it in bounded durable holding before advancing the source cursor. If capacity, validation or persistence fails, do not acknowledge progress past the event.

Construct duplicate comparison from the validated source-owned allowlist. Keep untrusted attribution labels separate so they cannot overwrite authentic event fields. Validate duplicate IDs against that canonical stored payload. Identical replay is idempotent; a conflicting authenticated payload for the same source/event identity is an explicit error.

Use existing locking or atomic storage to prevent concurrent ingestion loss. Preserve the event through crash windows; acknowledge only after durable evidence or holding succeeds.

## Replay delayed evidence fairly

Reconcile held events against the exact verified publication map, account, provider and stable lineage. Do not guess a publication from similar text or nearest timestamp.

Use a bounded rotating or otherwise fair replay queue so one permanently unresolved event cannot starve later resolvable events. Persist the final outcome first, then remove the held event. A crash between those actions must be safe to replay.

Retain bounded failure reasons, retry state and privacy limits. Report unresolved events honestly rather than silently dropping them or weakening provenance checks.

## Verify the failure paths

Exercise duplicate fulfilment with missing evidence, conflicting event IDs, invalid signatures, unsigned attribution, full holding storage, late publication evidence, concurrent ingestion and crashes around persist/remove.

Prove that evidence recovery changes no customer-facing effect count. Compare receipts and source cursors before and after injected failures.

Report connection health, events observed, evidence persisted, unresolved holding and descriptive correlation separately. Correlation does not prove a campaign caused the outcome. Keep production acceptance separate from repository implementation and synthetic fixtures.

Read [calibration cases](references/calibration-cases.md) when deciding whether a replay or attribution claim is safe.
