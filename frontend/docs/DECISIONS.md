# Protected Architecture Decisions

## DEC-001 — Real source-backed catalogue only
Status: Active (revised — canonical source cutover)

The canonical product source is `AyobamiH/agent-shop-products` (branch `main`). The frontend uses only real products from that repository. No mock or placeholder product data.

`AyobamiH/ai-prompts` is provenance/history only and is not a current authority.

## DEC-002 — One authoring authority, one synced projection
Status: Active (revised — canonical source cutover)

Per-product `products/<product-id>/product.json` in the canonical repository is the metadata authoring authority. `catalog/products.public.json` in that repository is the generated public projection.

Agent Forge consumes a bundled sync of that projection at `catalog/products.public.json`, recorded in `catalog/source.json`. The local copy is a projection, never an authoring surface, and is never hand-edited or extended. There is no second manually authored catalogue in this repository.

## DEC-003 — CLI-first agent interface
Status: Active

The planned agent shopping interface is a CLI. MCP is not part of the architecture.

## DEC-004 — Frontend-first phase
Status: Active

No backend marketplace, payment flow, authentication, autonomous purchasing, or install execution is built unless explicitly authorised later.

## DEC-005 — Missing data is not invented
Status: Active

Unknown pricing, compatibility, evidence, review, version, and availability fields are omitted rather than fabricated.

## DEC-006 — Product source is not automatically public storefront payload
Status: Active

Source provenance may be stored internally without exposing complete prompt bodies or internal branch metadata in the public frontend.

## DEC-007 — Modular code is a product requirement
Status: Active

Large files and cross-domain coupling are defects. Page files compose modules; domain logic lives outside rendering.

## DEC-008 — Problem-first discovery
Status: Active

Humans and agents should be able to discover products by the problem they solve, not only by product title.

## DEC-009 — Knowledge base must be source-backed
Status: Active

Do not create filler knowledge articles. Knowledge content must derive from a real product source, verified project evidence, or an explicitly authored source.

## DEC-010 — No final brand invention
Status: Active

Use a restrained temporary identity until the user explicitly chooses the final brand.

## DEC-011 — Performance by architecture, not cleanup
Status: Active

Prefer static/source-backed content, minimal client state, no repeated catalogue transforms in render paths, and no unnecessary network round-trips for locally available catalogue data.