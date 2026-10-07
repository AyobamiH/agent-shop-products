# Frontend Architecture

## Goal

A fast, source-backed storefront and discovery surface that can later support a CLI without reworking product-domain logic.

## Architectural principles

- domain-first boundaries;
- one-way dependencies;
- thin routes/pages;
- source-backed catalogue;
- deterministic transformations;
- minimal client-side state;
- composition over god components;
- explicit public/internal data projections;
- testable pure selectors and filters;
- accessible UI primitives;
- progressive enhancement over unnecessary interactivity.

## Recommended module layout

Adapt naming to the existing Lovable scaffold, but preserve the boundaries.

```text
src/
  app/
    router/
    providers/
    shell/
  domain/
    catalog/
      types.ts
      schema.ts
      repository.ts
      selectors.ts
      search.ts
      facets.ts
    knowledge/
      types.ts
      selectors.ts
  features/
    catalog-browse/
      components/
      hooks/
    catalog-search/
      components/
      hooks/
    product-detail/
      components/
    agent-discovery/
      components/
  components/
    ui/
    layout/
  pages/
    HomePage.tsx
    ShopPage.tsx
    ProductPage.tsx
    KnowledgePage.tsx
    AgentsPage.tsx
  data/
    catalog/
  lib/
    seo/
    jsonld/
    text/
  tests/
```

## Dependency direction

```text
pages
  ↓
features
  ↓
domain
  ↓
data/adapters
```

Shared UI primitives may be imported upward.

Domain modules must not import page or feature components.

## Catalogue access

Create one `CatalogRepository` boundary (`src/domain/catalog/repository.ts`).

For the current static phase it reads and validates the bundled projection `catalog/products.public.json`, synced from `AyobamiH/agent-shop-products` (`main`). `src/domain/catalog/source.ts` exposes that sync record; no runtime GitHub fetch exists and no fallback data is permitted.

Canonical product fields are: id, slug, name, productType, category, summary, problem, coreOutcomes, requirements, boundaries, `tags`, sourcePath. `catalogTags`, provenance and evidence fields are retired.

UI code does not import raw JSON directly from multiple locations.

Example interface:

```ts
interface CatalogRepository {
  list(): readonly Product[];
  getBySlug(slug: string): Product | undefined;
}
```

Search/faceting selectors are pure functions over normalized products.

## Performance model

For the current catalogue size:
- load catalogue once;
- normalize once;
- construct slug/id maps once;
- derive facet values once;
- avoid network fetches when the JSON is bundled locally;
- do not recompute token normalization during every render;
- keep URL query parameters as browse/filter state where useful;
- use memoization only when profiling or clear repeated work justifies it.

Do not introduce a search service, vector database, AI search, or backend only to search a dozen products.

## Search strategy

Start deterministic:
- normalized title;
- problem statement;
- summary;
- tags;
- category;
- core outcomes.

Use a weighted lexical scorer in a pure module if ranking is needed.
Keep the API shape replaceable so future CLI/backend search can use the same semantics.

## Route composition

Page files orchestrate sections and data.

They do not own:
- product normalization;
- search algorithms;
- JSON-LD construction;
- long rendering branches;
- repeated card metadata mapping.

## Data validation

Validate catalogue data at build/test time.

A malformed catalogue should fail loudly in development/build rather than create partially invented UI.

## Error and empty states

Empty states must reflect truth:
- no matching products;
- field not supplied;
- catalogue unavailable.

Do not populate empty states with fabricated recommendations.

## Accessibility

- semantic landmarks;
- keyboard-visible focus;
- correct heading order;
- labels for search/filter controls;
- accessible badges without color-only meaning;
- reduced-motion friendly;
- AA contrast baseline.

## Security/front-end hygiene

- no secrets in catalogue or bundles;
- no raw premium prompt payloads;
- sanitize any future rich content;
- external links use safe target/rel behaviour;
- no dangerous HTML injection for product Markdown.