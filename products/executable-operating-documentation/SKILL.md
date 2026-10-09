---
name: executable-operating-documentation
description: Generate dashboard and runbook guidance from canonical warning semantics, a versioned data dictionary and executable examples, then reject drift in CI. Use when UI, CLI and documentation disagree about field meaning, unavailable data, recovery ownership or safe operator actions.
---

# Executable Operating Documentation

Make operating guidance a tested projection of actual contracts.

## Locate semantic authority

Read snapshot producers, warnings, CLI output and current documentation. Identify existing authoritative registries before adding new ones.

Define each warning's stable identity, trigger, severity, meaning, recovery state, owner and safe inspection action. Distinguish automatic recovery, system recovery in progress and an action requiring the owner. A disabled optional feature is not necessarily a fault.

Use one canonical warning contract for UI, CLI and documentation. Do not maintain independent prose that contradicts code or recommends a consequential command without its authority boundary.

## Define the data dictionary

Version the actual snapshot schema. For every displayed field, specify type, units, nullability, valid states, availability meaning and interpretation limits. Include common misreadings.

Separate unknown, unavailable, stale, partial and measured zero. Do not display absent evidence as healthy or invent a number to satisfy a component.

Keep field meaning separate from sample values. Use bounded synthetic or sanitised examples; exclude private paths, identifiers and credentials from public fixtures.

## Generate and execute the examples

Derive the operating reference and examples from the canonical contracts. Keep generated outputs deterministic and mark their source so future edits begin at authority.

Add executable examples that exercise meaningful states: healthy, recovering, owner action, optional disabled, unavailable evidence and partial failure. Compare expected semantics and output shape, not incidental formatting alone.

Run the generator in check mode or regenerate and require an empty diff in CI. Fail on missing fields, stale warning text, undocumented states or example drift. Do not rewrite fixtures merely to silence an unexpected behavioural change.

Documentation of an inspection command does not execute it or grant permission for a repair.

## Keep projections efficient and authority fresh

For a dashboard projection, acquire each source ledger once per consistent snapshot and reuse its indexes. Coalesce concurrent readers through a bounded cache only when freshness and failure behaviour are explicit.

Use fresh canonical authority on consequence paths. A cached dashboard permission, lease, quota or receipt must not admit a write.

Measure representative snapshot size and latency under the stated fixture and budget. Keep console performance separate from provider throughput, publication rate or customer demand.

## Verify and hand off

Run semantic checks, executable examples, deterministic documentation checks and appropriate UI/CLI validation. Check null, missing, error and transition states as well as the happy path.

Report contract versions, generated surfaces, covered examples and actual performance scope. If a warning has no established recovery action, document that gap without inventing one.

Read [calibration cases](references/calibration-cases.md) before treating documentation consistency as operational acceptance.
