# Knowledge Base Index

This directory is the persistent operating memory for the shop.

## Read order

1. `../AGENTS.md` — agent operating contract.
2. `DECISIONS.md` — protected architectural decisions.
3. `DRIFT_GUARD.md` — explicit non-goals and forbidden drift.
4. `ARCHITECTURE.md` — module boundaries and frontend architecture.
5. `CATALOG_CONTRACT.md` — canonical product-data contract.
6. `FRONTEND_BRIEF.md` — frontend product experience and routes.
7. `QUALITY_GATES.md` — engineering completion gates.
8. `SOURCE_AND_COMMERCIALIZATION.md` — provenance, public-source, and licensing concerns.\n9. `AGENT_DISCOVERY.md` — agent-only IA, crawl/index and machine-surface contract.



## Rule

When a decision changes, update the relevant durable document in the same change. Do not rely on chat history to preserve architecture.
- [Agent Shop design rationale](DESIGN_REFERENCE.md) — Google DESIGN.md authority, logo rationale and registry UX references.
# Full registry and bug index

See `../../docs/CAPABILITY_SHOP_AND_BUG_INDEX.md` for the owner-authorised 990 external listings, quote-first procurement policy, bug evidence boundaries and deployment requirements. The implementation adds `/capabilities`, `/capabilities/{id}`, `/capabilities.json`, `/capability-brief.json?id={id}`, `/coding-bugs` and `/coding-bugs.json` beside the original product discovery routes.
