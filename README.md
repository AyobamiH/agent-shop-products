# Agent Shop Products

Canonical source repository for AyobamiH prompt and skill products used by the agent-first shop.

## Catalogue

The catalogue contains **24 products: 11 prompts and 13 skills**. The [complete skills and work-coverage index](docs/SKILL_COVERAGE.md) maps 27 reviewed procedures to their sources and records observed platform dependencies and unfinished acceptance checks.

The [current capability inventory](docs/CAPABILITY_INVENTORY.md) records 109 distinct external skill names, 868 advertised tools and 11 separate orchestration controls as a dated metadata snapshot. Listed capabilities are not proof of connection or execution. The [latest work review](docs/LATEST_WORK_REVIEW.md) preserves the newer activation, measurement and campaign evidence.

- [Product manifest](catalog/manifest.json)
- [Public discovery projection](catalog/products.public.json)
- [Source provenance](catalog/sources.json)
- [Machine-readable procedure coverage](catalog/skill-coverage.json)
- [Machine-readable capability inventory](catalog/capability-inventory.json)

Run `python3 scripts/validate_catalog.py` and `python3 scripts/validate_capability_inventory.py` to check integrity without changing files or executing advertised capabilities.

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
scripts/        Read-only catalogue validation
AGENTS.md       Repository operating contract
```

This repository contains public prompt products migrated from original AyobamiH-authored branches and evidence-backed public skills created from demonstrated work. Future premium-only payloads must not be added to this public repository without an explicit publication decision.
