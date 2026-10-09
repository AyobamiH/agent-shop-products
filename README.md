# Agent Shop Products

Canonical source repository for AyobamiH prompt and skill products used by the agent-first shop.

## Catalogue

The catalogue contains **33 products: 11 prompts and 22 skills**. The [skills and work-coverage index](docs/SKILL_COVERAGE.md) maps **38 reviewed procedures**, their evidence limits and eight explicitly observed dependency names.

The [multi-week review](docs/MULTIWEEK_REVIEW.md) reconciles the saved history checkpoint, selected supporting records and newer continuation evidence through 9 October. The [latest work review](docs/LATEST_WORK_REVIEW.md) identifies the highest evidenced states and remaining acceptance gates.

The [capability inventory](docs/CAPABILITY_INVENTORY.md) records **111 distinct external skill names, 868 advertised tools across 38 providers and 11 separate orchestration controls**. These are dated metadata, not installation or execution claims.

Shop discovery now includes all **990 external acquisition listings** at `/capabilities`, with individual detail pages and quote-first original integration briefs. The [acquisition and bug-index contract](docs/CAPABILITY_SHOP_AND_BUG_INDEX.md) explains provider access, accepted scope and evidence boundaries. The [agentic coding bug index](catalog/agentic-coding-bugs.json) starts with **20 documented bugs and preventive failure modes**, linked to scoped evidence, repair skills and regression checks. The original 33 product payloads are preserved.

- [Product manifest](catalog/manifest.json)
- [Public discovery projection](catalog/products.public.json)
- [Source provenance](catalog/sources.json)
- [Machine-readable procedure coverage](catalog/skill-coverage.json)
- [Machine-readable capability inventory](catalog/capability-inventory.json)
- [Original integration acquisition policy](catalog/capability-acquisition.json)
- [Agentic coding bug and evidence index](catalog/agentic-coding-bugs.json)

Run `python3 scripts/validate_catalog.py` and `python3 scripts/validate_capability_inventory.py` to check integrity without changing files or executing advertised capabilities.

## Principles

- Products are original and source-backed; no mock product inventory.
- Public discovery metadata is separated from full payloads.
- Product claims stay within their requirements and evidence limits.
- External capabilities remain dependencies; their instruction bodies are not copied.
- Future agent commerce is CLI-first.
- Product files remain modular and independently versionable.

## Repository layout

```text
products/       Canonical payloads and discovery metadata
catalog/        Machine-readable indexes and projections
docs/           Governance, evidence and continuation records
scripts/        Read-only catalogue validation
AGENTS.md       Repository operating contract
```

The existing 25-product storefront release has a separate [production acceptance record](docs/AGENT-SHOP-25-PRODUCTION-ACCEPTANCE-2026-10-09.md). The 33-product, 990-external-listing and 20-bug source change requires its own deployment/readback. Current validation does not establish production publication.

Existing public prompts preserve their migration provenance. New public skills contain original generalised procedures and sanitised evidence. Future premium-only payloads require an explicit publication decision.
