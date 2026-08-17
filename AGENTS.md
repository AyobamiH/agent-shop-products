# AGENTS.md — Agent Shop Products

## Mission

Maintain the canonical source and machine-readable catalogue for AyobamiH prompt products and future agent skills.

## Read order

Before changing this repository:

1. Read this file.
2. Read `docs/DECISIONS.md`.
3. Read `docs/CATALOG_CONTRACT.md`.
4. Inspect the affected `products/<product-id>/product.json` and source payload.
5. Inspect `catalog/sources.json` when provenance matters.
6. Preserve source provenance and report conflicts rather than guessing.

## Non-negotiable rules

### Real products only

- Never add mock, filler, demo, or placeholder products to the canonical catalogue.
- Never invent price, compatibility, reviews, customers, evidence levels, versions, availability, or performance claims.
- If a fact has no authoritative source, omit it.

### Product source integrity

- `products/<product-id>/PROMPT.md` is the canonical payload for a public prompt product unless a later decision changes that product's publication model.
- `products/<product-id>/product.json` is the canonical editable discovery metadata for that product.
- Do not silently rewrite migrated source while changing metadata.
- Product-content edits and product-metadata edits must remain reviewable as distinct concerns.
- Preserve stable product IDs and slugs unless a migration is explicitly approved.

### Public repository boundary

This repository is public.

Do not commit future premium-only payloads, credentials, private examples, customer data, or proprietary supporting assets without an explicit publication decision.

### Catalogue integrity

- `catalog/manifest.json` indexes canonical per-product metadata files.
- `catalog/products.public.json` is a consumer projection, not a second product-authoring surface.
- `catalog/sources.json` records canonical source identity and migration provenance.
- New products must begin as their own product directory with source and metadata; never add them only to the aggregate catalogue.
- Product UI and future CLI discovery must consume catalogue contracts rather than maintain independent hard-coded product lists.
- Unknown fields are absent, never simulated.
- Until a deterministic compiler exists, synchronise aggregate projections from the per-product metadata and review for drift.

### Agent interface direction

The planned agent shop interface is CLI-first. MCP is out of scope unless an explicit later decision reverses that direction.

### Modular growth

Do not create monolithic catalogue generators or scripts.

For future code:
- ordinary module target: <= 200 logical lines;
- domain service target: <= 250;
- utility target: <= 150;
- >300 authored logical lines requires decomposition review;
- >400 authored logical lines must be split unless generated/declarative or explicitly approved.

Split by responsibility, not arbitrary line count.

Keep these concerns separate:

```text
product payload
product discovery metadata
source provenance
commerce state
catalogue projection
CLI behaviour
storefront rendering
```

### Efficient logic

- Validate once at boundaries rather than scattering duplicate checks.
- Parse catalogue metadata once per process/build and derive indexes once.
- Keep search/filter logic pure and deterministic.
- Do not add AI, vector search, databases, or network services where a small deterministic module solves the current problem.
- Prefer explicit typed contracts over loosely structured helper objects.

## Definition of done

A product/catalogue change is complete only when:

- the product directory exists;
- payload source exists;
- `product.json` exists and validates;
- product ID and slug are unique;
- the manifest resolves the product metadata;
- public projection remains in sync when affected;
- provenance is updated when source identity changes;
- no unsupported commercial or evidence claim was introduced;
- JSON remains valid;
- documentation remains consistent;
- the change does not expose private/premium material unintentionally.
