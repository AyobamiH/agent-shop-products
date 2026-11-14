# Agent Shop repository knowledge

## Authority and first reads
Read [root instructions](../../AGENTS.md), [protected decisions](../../docs/DECISIONS.md), and the [catalogue contract](../../docs/CATALOG_CONTRACT.md). Frontend changes additionally follow [frontend instructions](../../frontend/AGENTS.md) and its existing [knowledge index](../../frontend/docs/KB_INDEX.md). This index complements those documents rather than replacing their decisions.

## Architecture and entry points
- [products](../../products) owns payloads and per-product metadata; [catalogue manifest](../../catalog/manifest.json), [public projection](../../catalog/products.public.json), and [provenance](../../catalog/sources.json) have separate roles.
- [frontend router](../../frontend/src/router.tsx), [routes](../../frontend/src/routes), and [server entry](../../frontend/src/server.ts) are storefront entry points. Keep catalogue access behind [domain modules](../../frontend/src/domain).
- [commerce](../../commerce) is distinct from public product metadata. Repository tooling under .agents is contributor guidance, not a new catalogue product or premium payload.

## Commands and verification
From the root, run `python3 scripts/validate_catalog.py` and `python3 scripts/validate_capability_inventory.py` for read-only catalogue checks. From frontend, [package scripts](../../frontend/package.json) define `bun run test`, `bun run lint`, and `bun run build`; build runs sync and metadata generation first, so review generated changes. Follow the frontend's complete definition of done for frontend changes.
For these foundations run `python3 scripts/validate-agent-foundations.py`, `git diff --check`, and after committing `python3 scripts/validate-agent-foundations.py --git-archive HEAD`.

## Boundaries and verified lessons
The catalogue contract teaches one metadata authority per product: projections are not independent authoring surfaces. Protected decisions separate public discovery, private delivery, consent-bound analytics, and commercial release. Historical receipts in docs are evidence for their named revision, not proof of today's runtime. Do not infer live checkout authority from source, a passing validator, or an old receipt. Never publish premium bodies, customer data, private implementation context, or credentials in this public repository.

## Maintenance
Update this map and relevant established docs in the same change when architecture, commands, boundaries, or behavior change. Preserve decision rationale and source-backed lessons; do not paste chat logs, secrets, private host inventories, or stale live-status claims. Record exact revision, checks passed/failed/not run, and unresolved gates in handoffs.

The foundation validator and its fixture tests require Python 3.9 or newer.
