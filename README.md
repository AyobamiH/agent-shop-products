# Agent Shop Products

Canonical source repository for AyobamiH prompt and skill products used by the agent-first shop.

## Catalogue

The catalogue contains **16 products: 11 prompts and 5 skills**. The [complete skills and work-coverage index](docs/SKILL_COVERAGE.md) lists every product, maps the reviewed procedures to their sources, and records supporting platform skills and unfinished acceptance checks.

- [Product manifest](catalog/manifest.json)
- [Public discovery projection](catalog/products.public.json)
- [Source provenance](catalog/sources.json)
- [Machine-readable procedure coverage](catalog/skill-coverage.json)

Run `python3 scripts/validate_catalog.py` to check catalogue integrity without changing files.

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
