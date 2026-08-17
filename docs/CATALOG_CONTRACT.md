# Catalogue Contract

## Purpose

The catalogue is a machine-readable discovery layer over real product source. It is not a marketing database and must not become a place where missing facts are invented.

## Authority model

Each product owns its payload and metadata locally:

```text
products/<product-id>/
  PROMPT.md
  product.json
```

`PROMPT.md` is the canonical product payload for a public prompt.

`product.json` is the canonical editable discovery metadata for that product.

Central catalogue files are indexes or projections. They are not an independent place to author product truth.

## Files

### `products/<product-id>/product.json`

Canonical product discovery metadata.

Allowed fields include:

- `schemaVersion`
- `id`
- `slug`
- `name`
- `productType`
- `category`
- `summary`
- `problem`
- `coreOutcomes`
- `requirements`
- `boundaries`
- `tags`
- `source`

`source` is relative to the product directory and currently resolves to `PROMPT.md` for prompt products.

### `catalog/manifest.json`

Small product index mapping stable product IDs to canonical metadata paths.

This file exists so consumers and future catalogue tooling do not need to know directory conventions.

### `catalog/products.public.json`

Aggregated public projection suitable for the current website, search surfaces, and future CLI consumption.

Treat this as a generated/read-only projection of the individual `product.json` records.

Until a deterministic build script is introduced, changes to product metadata must begin in the relevant `product.json`; any affected aggregate projection must then be synchronised and reviewed for equality.

Do not author a product only inside the aggregate.

### `catalog/sources.json`

Source/provenance manifest containing:

- canonical repository and payload path;
- canonical payload blob SHA;
- original repository/branch/path;
- original payload blob SHA.

It is an integrity record, not storefront copy.

## Missing fields

Absence is meaningful.

If no authoritative value exists for:

- price;
- currency;
- model compatibility;
- evidence level;
- version;
- ratings;
- reviews;
- customer count;
- checkout URL;
- availability;

omit the field.

Do not use `TBD`, `coming soon`, dummy values, fake zeroes, or guessed compatibility to satisfy a UI component.

## Product-to-source invariant

For every product:

1. `id` and `slug` are unique;
2. the manifest resolves to exactly one `product.json`;
3. `product.json.source` resolves within that product directory;
4. the source payload exists;
5. source-backed claims do not exceed the prompt's introductory description, requirements, and explicit boundaries;
6. the matching source-provenance entry exists;
7. the public aggregate, when present, is equivalent to the canonical metadata projection rather than a competing source of truth.

## Future commerce separation

When payment is implemented, commercial state should live in an independently governed record keyed by product ID, for example:

```ts
type CommerceRecord = {
  productId: string;
  priceMinor: number;
  currency: string;
  availability: "active" | "paused" | "retired";
  checkoutProductId: string;
};
```

Do not make price or checkout provider IDs part of the prompt payload or source-backed product metadata.

## Future compiler

When repeated manual projection becomes a maintenance cost, add a small deterministic catalogue compiler that:

1. reads `catalog/manifest.json`;
2. loads each referenced `product.json`;
3. validates schema and unique IDs/slugs;
4. verifies source paths and provenance entries;
5. emits `catalog/products.public.json`;
6. optionally emits raw/Markdown discovery projections;
7. fails on drift rather than silently repairing it.

Keep parsing, validation, projection, and file emission in separate small modules. Do not build a monolithic catalogue script.

LLMs may help draft editorial wording, but deterministic validation and source records remain authoritative.
