# Calibration cases

- A payment fulfilment receipt exists but its outcome write failed: skip fulfilment and retry evidence reconciliation.
- A contact email succeeded and logging failed: recover from a durable outbox; do not send the enquiry again.
- Holding storage is full: leave the source cursor before the unpersisted event.
- The same source/event ID arrives with changed amount: reject the conflict.
- A signed payment carries unsigned campaign labels: authenticate payment, leave campaign provenance unverified.
- A final outcome persisted but held-event removal crashed: replay idempotently and remove the duplicate holding entry without another customer effect.

Keep exact event fields and signature rules provider-specific. A connected empty ledger and descriptive publication correlation have distinct limits.
