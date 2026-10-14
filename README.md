# Agent Shop Products

Canonical source repository for AyobamiH prompt and skill products used by the agent-first shop.

## Start with the problem, not a tool name

[Agent Shop](https://agents.proofandstate.com/) connects original public procedures to their requirements and boundaries. Use the [verification and recovery guide](https://agents.proofandstate.com/solutions?utm_source=github&utm_medium=referral&utm_campaign=agent_shop_evidence) when an agent reports completion without enough evidence. It includes a practical checklist for accepting an AI-generated pull request.

For hands-on work, [scope a repository repair or workflow integration](https://agents.proofandstate.com/integration-services?utm_source=github&utm_medium=referral&utm_campaign=agent_shop_integration). Describe one reproducible failure, the allowed changes and an acceptance test; a request is not an accepted quote, repository authority or payment.

The [private reference kit](https://agents.proofandstate.com/private-kits?utm_source=github&utm_medium=referral&utm_campaign=agent_shop_private_kit) is distinct from public prompts and skills. Its approved introductory direction is **£9 one-off**, but online purchase is **not open**. The kit is a reference implementation, not a turnkey installation or a licence to third-party tools. No customer results or sales are implied.

## Catalogue

The catalogue contains **33 products: 11 prompts and 22 skills**. The [skills and work-coverage index](docs/SKILL_COVERAGE.md) maps **38 reviewed procedures**, their evidence limits and eight explicitly observed dependency names.

The [multi-week review](docs/MULTIWEEK_REVIEW.md) reconciles the saved history checkpoint, selected supporting records and newer continuation evidence through 9 October. The [latest work review](docs/LATEST_WORK_REVIEW.md) identifies the highest evidenced states and remaining acceptance gates.

The [capability inventory](docs/CAPABILITY_INVENTORY.md) records **111 distinct external skill names, 868 advertised tools across 38 providers and 11 separate orchestration controls**. These are dated metadata, not installation or execution claims.

Shop discovery now includes all **990 external acquisition listings** at `/capabilities`, with individual names-only detail pages and quote-first original integration briefs. The original product and problem pages are the indexable search inventory; metadata-only third-party detail pages are public GET references, not independently indexable Google landing pages. The `/integration-services` page explains the separate scoped implementation offer, with no invented digital checkout or licence. The [acquisition and bug-index contract](docs/CAPABILITY_SHOP_AND_BUG_INDEX.md) explains provider access, accepted scope and evidence boundaries. The [agentic coding bug index](catalog/agentic-coding-bugs.json) records documented bugs and preventive failure modes, linked to scoped evidence, repair skills and regression checks. The original 33 product payloads are preserved.

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

The earlier [25-product acceptance](docs/AGENT-SHOP-25-PRODUCTION-ACCEPTANCE-2026-10-09.md) and 12 October release receipts are historical checkpoints, not claims about the current deployment. The canonical [commercial launch issue](https://github.com/AyobamiH/agent-shop-products/issues/25) and [discovery-to-enquiry issue](https://github.com/AyobamiH/agent-shop-products/issues/53) record exact-source releases and independent production readbacks. Current counts derive from the public catalogue and bug-index endpoints rather than a copied historical release paragraph.

The distinct £9 private kit has passed real Stripe test-mode payment, signed webhook, exact private delivery, refund and buyer-record recovery acceptance. **Live Checkout remains disabled** until the seller address, merchant profile and tax-registration mismatch are independently resolved. Consult [buyer-operation acceptance](docs/BUYER_OPERATIONS_ACCEPTANCE_20261012.md), [launch readiness](commerce/launch-readiness.json) and the [latest launch closeout](docs/LAUNCH_CLOSEOUT_20261012.md). A successfully deployed catalogue is not evidence of a live paid sale.

Existing public prompts preserve their migration provenance. New public skills contain original generalised procedures and sanitised evidence. Future premium-only payloads require an explicit publication decision.

Discovery measurement is separately governed: see [consent, activation and funnel evidence](docs/DISCOVERY_MEASUREMENT_20261014.md). An installed measurement boundary is not proof of a connected GA4 stream or a measured visitor.
