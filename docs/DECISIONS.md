# Protected Decisions

## DEC-001 — Canonical repository

`AyobamiH/agent-shop-products` is the canonical product-source repository for the shop.

The original `AyobamiH/ai-prompts` product branches remain migration provenance, not the storefront source of truth.

## DEC-002 — Exact migration

The initial 11 prompt payloads were migrated byte-for-byte. Their Git blob SHA values match the original source blobs.

Metadata may evolve independently; do not rewrite source merely to fit a storefront schema.

## DEC-003 — No mock catalogue data

Only real source-backed products belong in the catalogue. Missing commercial or compatibility fields are omitted rather than populated with placeholders.

## DEC-004 — Public source boundary

This repository is public. Existing migrated public prompts may remain here. Future premium-only product payloads require an explicit publication decision and should not be committed here by default.

## DEC-005 — One metadata authority per product

Each product owns its editable discovery metadata in:

```text
products/<product-id>/product.json
```

The central public catalogue is a projection for consumers, not a competing authoring source.

Human storefronts and the future CLI derive product discovery data from these canonical records through the catalogue contract rather than maintain independent product lists.

## DEC-006 — CLI-first

The planned machine-consumer shopping interface is a CLI. MCP is explicitly out of scope.

## DEC-007 — Problem-first discovery

Product records describe the concrete problem, outcome, requirements, and boundaries so humans and agents can search by need rather than title alone.

## DEC-008 — Evidence-safe claims

A source statement such as “based on a working system” may be represented as provenance. It must not be silently upgraded into adoption, customer-result, superiority, or guarantee claims.

## DEC-009 — Modular implementation

Future catalogue compilers, CLI code, and shop integrations must use small domain modules and explicit contracts. Giant all-purpose files are architectural defects.

Product payload, product metadata, source provenance, commerce state, and storefront rendering remain separate responsibilities.

## DEC-010 — Aggregate catalogue is a projection

`catalog/products.public.json` exists for efficient consumption by the current frontend and future tools.

It must remain derivable from the individual product metadata records. New products must never be created only inside the aggregate file.

When manual synchronisation becomes error-prone, replace it with a deterministic small-module compiler rather than adding more duplicated logic.
