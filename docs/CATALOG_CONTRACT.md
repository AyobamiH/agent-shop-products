# Catalogue Contract

## Purpose

The catalogue is a machine-readable discovery layer over real product source. It is not a marketing database and must not become a place where missing facts are invented.

## Files

### `catalog/products.public.json`

Public product-discovery records suitable for the website, search surfaces, and future CLI.

Allowed fields include:

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
- `sourcePath`

Commercial fields may be added only when backed by a separate authoritative commerce source.

### `catalog/sources.json`

Source/provenance manifest containing:

- canonical repository and path;
- canonical blob SHA;
- original repository/branch/path;
- original blob SHA.

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

## Catalogue-to-source invariant

For every public product record:

1. `id` and `slug` are unique;
2. `sourcePath` resolves inside this repository;
3. the source file exists;
4. source-backed claims do not exceed the prompt's introductory description, requirements, and explicit boundaries;
5. the matching source manifest entry exists.

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

Do not make price or checkout provider IDs part of the prompt source payload.

## Future compiler

A deterministic catalogue compiler may later:

1. read approved product metadata;
2. validate schema;
3. verify source paths and hashes;
4. emit the public catalogue;
5. emit raw/Markdown discovery projections;
6. fail on duplicate IDs, unresolved sources, or unsupported required fields.

LLMs may help draft editorial wording, but deterministic validation and source records remain authoritative.
