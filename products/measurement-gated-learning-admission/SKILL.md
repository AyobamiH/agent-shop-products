---
name: measurement-gated-learning-admission
description: Admit learning challengers only when an exact verified predecessor also has comparable measurement evidence, with immutable receipts, explicit deferrals and bounded pressure controls. Use when publication or effect equivalence is being mistaken for a measured baseline.
---

# Measurement-Gated Learning Admission

Require both verified publication identity and a comparable measured baseline before admitting a learning variant.

## Freeze the candidate identity

Read the existing editorial item, predecessor lineage, publication map, provider account and immutable receipts. Freeze the intended payload and its exact content hash before comparing effects.

Treat two effects as equivalent only when provider, account, exact payload hash and stable lineage agree and the publication evidence is verified. Similar wording, a campaign label or an unverified response is insufficient.

If recovery needs an equivalence sidecar, link it to the original receipt and identity. Leave original receipts and metric records unchanged. Equivalent publication does not authorise publishing the same content again.

## Inspect measurement as a separate gate

For the exact verified predecessor, inspect observation source, timestamp, age window, exposure, units, metric availability and comparison rules. Keep collection status separate from measured value.

A stored zero with unavailable or insufficient-exposure semantics is not zero performance. A missing metric is unknown. A recent publication may be valid but not mature enough to compare.

Require the existing policy's comparable measurement baseline before admitting a challenger. Do not lower the rule simply because verified-equivalent publication was an earlier accepted admission condition.

Preserve the reason for each decision:

- Admit only after identity, verification, comparability and resource gates pass.
- Defer a verified but unmeasured or immature predecessor.
- Exclude a conflicting identity or a lineage without verified publication.
- Leave collection failures and unknown provenance unresolved.

Use the repository's actual states and reason codes rather than inventing undocumented ones.

## Bound admission

Apply existing backlog, resource and pressure rules after the evidence gates. Preserve hysteresis and fair selection where implemented. A ceiling protects capacity; it is not a production target and does not justify filling the queue.

Do not silently broaden provider, account, cadence or execution authority. Keep admission, publication, metric collection and business outcome attribution as separate operations.

## Verify with immutable fixtures

Cover an exact measured predecessor, equivalent but unmeasured predecessor, missing metric, unavailable zero, low exposure, wrong account, conflicting hash, duplicate publication and pressure-bound deferral.

Compare original receipt and metric bytes before and after the evaluation. Verify decision reasons and that deferred candidates cause no publication. Test the boundary between measurement maturation and genuine comparison.

Return the candidate identity, predecessor evidence, measurement window, admission decision and next eligible check. Distinguish a historical acceptance suite from a fresh live measured baseline.

Read [calibration cases](references/calibration-cases.md) when evaluating evidence that looks like success but cannot support learning.
