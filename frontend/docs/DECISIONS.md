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

Agents should be able to discover products by the problem they solve, not only by product title.

## DEC-009 — Knowledge base must be source-backed
Status: Active

Do not create filler knowledge articles. Knowledge content must derive from a real product source, verified project evidence, or an explicitly authored source.

## DEC-010 — No final brand invention
Status: Active

Use a restrained temporary identity until the user explicitly chooses the final brand.

## DEC-011 — Performance by architecture, not cleanup
Status: Active

Prefer static/source-backed content, minimal client state, no repeated catalogue transforms in render paths, and no unnecessary network round-trips for locally available catalogue data.

## DEC-012 — Agent-only public audience
Status: Active

The public site is for autonomous and tool-using agents. Human-readable pages are inspectable views of agent discovery data, not a consumer marketplace.

## DEC-013 — Crawl and machine discovery
Status: Active

Canonical public routes are indexable and linked through one-origin canonical URLs, JSON-LD, robots and sitemap. `/agents` is the principal documentation route; `/catalog.json` is the canonical machine catalogue; `/agents.txt` and `/llms.txt` are supporting text indexes and are not claimed as universal standards.

## DEC-014 — One deployment origin
Status: Active

`VITE_SITE_ORIGIN` is the single deployment-origin setting. Canonical links, JSON-LD, robots and sitemap derive from it. Production publication is blocked until a real HTTPS origin is configured.

## DEC-015 — GitHub owns the frontend
Status: Active

The frontend source now lives under `frontend/` in `AyobamiH/agent-shop-products`. Lovable is migration provenance only and is not required for ongoing development.


## DEC-016 — Google DESIGN.md governs visual identity
Status: Active

`frontend/DESIGN.md` is the visual-design authority for the Agent Shop frontend and is linted in CI with the pinned Google Labs `design.md` implementation. The current design reference is a standards registry crossed with a package index and laboratory instrument panel. The registry-aperture mark is intentionally name-independent because final branding remains undecided.

The interface favours provenance, queryability, boundaries and machine routes over decorative marketplace conventions. Gradients, AI sparkles, fake ratings, invented verification badges and commerce decoration are prohibited unless a later evidence-backed product decision changes the contract.
# DEC-011 — External capability registry and integration briefs

The owner's 9 October 2026 instruction authorises searchable listings for every advertised external skill, tool and orchestration control and a public sanitised coding bug index. Keep their contracts separate from the original product projection. Provide deterministic GET discovery and quote-first integration briefs linking to the established external custom-work provider. Prices and accepted work remain provider-authoritative. The frontend does not submit requests, charge buyers, install capabilities or grant provider/runtime authority. CLI-first remains protected; no Shop MCP server is added.
