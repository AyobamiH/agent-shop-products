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

## DEC-005 — One catalogue authority

Human storefronts and the future CLI should derive product discovery data from the canonical catalogue rather than maintain separate product lists.

## DEC-006 — CLI-first

The planned machine-consumer shopping interface is a CLI. MCP is explicitly out of scope.

## DEC-007 — Problem-first discovery

Catalogue records should describe the concrete problem, outcome, requirements, and boundaries of a product so humans and agents can search by need rather than title alone.

## DEC-008 — Evidence-safe claims

A source statement such as “based on a working system” may be represented as provenance. It must not be silently upgraded into adoption, customer-result, superiority, or guarantee claims.

## DEC-009 — Modular implementation

Future catalogue compilers, CLI code, and shop integrations must use small domain modules and explicit contracts. Giant all-purpose files are architectural defects.
