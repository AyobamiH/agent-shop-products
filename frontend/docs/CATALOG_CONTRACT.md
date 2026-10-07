# Catalogue Contract

## Canonical authority

Product facts are authored in the canonical repository:

- repository: `AyobamiH/agent-shop-products`
- branch: `main`
- per-product metadata authority: `products/<product-id>/product.json`
- per-product payload: `products/<product-id>/PROMPT.md` or `products/<product-id>/SKILL.md`
- generated public projection: `catalog/products.public.json`
- provenance manifest: `catalog/sources.json`
- catalogue manifest: `catalog/manifest.json`

Agent Forge does not author product facts.

## Files in this repository

- `catalog/products.public.json` — bundled **synced projection** of the canonical public projection. Do not hand-edit it, extend it, or add products to it.
- `catalog/source.json` — sync record identifying upstream repository, branch, projection path, and the fact that the local copy is a projection, not authoring authority.
- `catalog/product-catalog.schema.json` — structural contract for the projection.

The frontend keeps the catalogue static and bundled for this phase. There is no runtime GitHub dependency and no fallback/mock data if a sync is stale.

## Public product fields

- id
- slug
- name
- productType
- category
- summary
- problem
- coreOutcomes
- requirements
- boundaries
- tags
- sourcePath (path to the canonical payload upstream)

`tags` is the canonical domain field. `catalogTags` is retired and must not be reintroduced.

Commercial fields — price, checkout URL, availability, ratings, reviews, sales figures — and evidence levels, versions, compatibility and sample flags are intentionally absent. Absence is not a placeholder: the UI hides the element rather than showing TBD or a fake zero.

## Provenance

Per-product provenance (canonical blob SHA, origin repository/branch/path) lives upstream in `catalog/sources.json`. It is not duplicated into the frontend and must never be invented. `AyobamiH/ai-prompts` appears there only as historical origin, not current authority.

## Public projection limits

The projection intentionally does not expose:
- complete PROMPT.md and SKILL.md bodies;
- secrets;
- internal review notes.

## Sync boundary

Updating the catalogue means replacing `catalog/products.public.json` with the current upstream projection and updating `catalog/source.json`. No transformation, enrichment, or editorial rewriting of product facts is permitted during sync.

## Commercial-data extension

When commerce is added, use a separate authoritative commercial record keyed by product id, for example:

```ts
type CommerceRecord = {
  productId: string;
  priceMinor: number;
  currency: string;
  checkoutProviderProductId: string;
  availability: "active" | "paused" | "retired";
};
```

Do not mix checkout state into source prompt files or into the public projection.

## In-repository frontend sync

The frontend now lives at `frontend/` in the same GitHub repository as the canonical catalogue. Its bundled projection remains a build artifact for frontend isolation, not an authoring surface. `frontend/scripts/sync-catalog.ts` copies the root public projection and derives the frontend sync record before build/validation.
