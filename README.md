# Agent Shop Products

Canonical source repository for AyobamiH prompt products and future agent skills used by the agent-first shop.

## Principles

- Products are source-backed; no mock product inventory.
- Public catalogue metadata is separated from full product payloads.
- Product claims must not exceed their source evidence.
- Future agent commerce is CLI-first.
- Product files remain modular and independently versionable.

## Repository layout

```text
products/       Source product payloads
catalog/        Machine-readable catalogue projections
docs/           Product and catalogue governance
AGENTS.md       Repository operating contract
```

This repository currently contains public prompt products migrated from original AyobamiH-authored branches. Future premium-only payloads must not be added to this public repository without an explicit publication decision.
