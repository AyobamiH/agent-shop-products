# AGENTS.md — Agent-First Shop Operating Contract

## Mission

Build and maintain a high-quality frontend for a source-backed prompt and skill shop that serves humans and machine consumers.

The product catalogue is real. Do not invent products, prices, compatibility, reviews, evidence levels, examples, testimonials, or product claims to make the UI look complete.

## Mandatory read order

Before implementation or modification:

1. Read this file.
2. Read `docs/KB_INDEX.md`.
3. Read `docs/DECISIONS.md`.
4. Read `docs/DRIFT_GUARD.md`.
5. Read `docs/ARCHITECTURE.md`.
6. Read `docs/CATALOG_CONTRACT.md`.
7. Read the task-relevant document.
8. Inspect the existing implementation before changing it.

Chat context is not the only source of truth. Repository documents and canonical catalogue data persist the product contract.

## Source-of-truth hierarchy

1. Explicitly approved current user instruction.
2. `AGENTS.md`.
3. `docs/DECISIONS.md`.
4. `docs/DRIFT_GUARD.md`.
5. `docs/ARCHITECTURE.md`.
6. `docs/CATALOG_CONTRACT.md`.
7. Canonical catalog data.
8. Existing implementation.
9. Design notes and conversational context.

When two sources conflict, report the conflict. Do not silently choose the convenient source.

## Non-negotiable rules

### One canonical product source

- The canonical product authority is the repository `AyobamiH/agent-shop-products`, branch `main`: `products/<product-id>/product.json` authors metadata and `catalog/products.public.json` is its generated public projection.
- `catalog/products.public.json` in this repository is a bundled **sync** of that projection, described in `catalog/source.json`. Never hand-edit it, add products to it, or create a second catalogue file.
- `AyobamiH/ai-prompts` is historical provenance only. Do not reintroduce it as a current source.
- Per-product provenance lives upstream in `catalog/sources.json`; do not duplicate or invent provenance/evidence fields in this frontend.

### No mock product data

- Product UI MUST derive from the single `CatalogRepository` boundary in `src/domain/catalog`.
- Never create temporary product cards, placeholder products, fallback inventories, fake pricing, fake reviews, fake downloads, fake compatibility, fake versions, or fictional evidence — including as a fallback when a sync is stale.
- If a source-backed field does not exist, omit the UI element. Do not render TBD, “0”, or a fabricated default.
- Do not hard-code product arrays in page components or import catalogue JSON outside the domain boundary.
- Do not copy raw premium prompt bodies into frontend bundles.

### CLI-first agent commerce

The future agent transaction interface is a CLI.

MCP is explicitly out of scope unless a later explicit decision reverses this.

### Frontend phase only

Do not create payment infrastructure, authentication, backend marketplace services, autonomous purchasing, wallets, or installation execution in this phase unless explicitly requested.

### No giant files

The codebase must remain modular and reviewable.

Targets:
- ordinary module: <= 200 logical lines where practical;
- route/page composition file: <= 180 logical lines;
- React component: <= 180 logical lines;
- domain service: <= 250 logical lines;
- utility module: <= 150 logical lines;
- hook: <= 150 logical lines.

Review threshold:
- any authored source file above 300 logical lines requires an explicit cohesion justification;
- any authored source file above 400 logical lines MUST be split before task completion unless it is generated code or a declarative data artifact.

Functions:
- target <= 50 logical lines;
- review above 80;
- split or redesign above 120 unless a clear algorithmic reason exists.

Do not split code mechanically into meaningless fragments just to satisfy a count. Split by responsibility and domain boundary.

### No god modules

Avoid:
- `utils.ts` containing unrelated helpers;
- page components that own loading, filtering, transformation, rendering, SEO, and analytics;
- catalogue logic inside React render functions;
- duplicated transformation logic across routes;
- hidden global mutable state;
- deep prop threading when a bounded domain abstraction is clearer.

### Evidence-safe product copy

Do not strengthen product claims beyond the source catalogue.

“Source states this is based on a working system” is not the same as independently proving that system in this storefront.

## Definition of done

A task is not complete because the page renders.

Before completion:
- typecheck;
- lint;
- relevant tests;
- production build;
- route smoke check;
- responsive check;
- accessibility basics;
- no mock-data scan;
- file-size/modularity scan;
- drift check against protected decisions.

Report what was actually verified.