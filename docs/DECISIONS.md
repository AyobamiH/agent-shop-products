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

## DEC-011 — Public skill payloads

Evidence-backed agent skills may be published as first-class catalogue products when the owner explicitly approves their public release.

A public skill uses:

```text
products/<product-id>/SKILL.md
products/<product-id>/product.json
```

Its metadata uses `productType: "skill"` and `source: "SKILL.md"`.

Public skills follow the same evidence, provenance, no-mock-data, stable-ID, and public-source-boundary rules as prompt products. A skill must be based on demonstrated reusable work; exploratory or interest-only material is not promoted into the canonical catalogue.

## DEC-012 — External capabilities remain dependencies

A complete skill/tool discovery snapshot records external metadata separately from owned product payloads. Availability, connection, permission, execution, publication and customer outcomes require their own evidence.

Owner-authorised extraction may publish original generalised procedures from reviewed work. It does not authorise copying third-party implementations, expose account or credential material, or reverse the CLI-first interface decision.
# DEC-013 — Full capability discovery and quote-first integration

On 9 October 2026 the owner explicitly requested all 111 external skills, 868 tools and 11 orchestration controls in the shop, plus an agentic coding bug index. Expose all 990 as source-backed acquisition listings separate from owned products. Offer original integration work through the existing provider's quote-first handoff; do not claim external implementation ownership, redistribution rights, ready installation or a fixed price. Record scoped historical bug evidence in a sanitised catalogue and extend the canonical private workbook in place.

## DEC-014 — Agent Shop private-kit commercial boundary (9 October 2026)

Public capability metadata and public prompts remain freely discoverable. Commercial offers belong in a separately governed catalogue and must not be inferred from public source. A genuinely private versioned execution kit may be supplied only through a separately approved merchant, GBP offer, buyer-facing licence, refund/cancellation/tax wording and controlled entitlement delivery. Quote-first bespoke implementation remains a different product from fixed digital checkout.

The first private kit is **planned, not offered for sale**. D1 order/entitlement state, Stripe Checkout reconciliation, webhook signature verification, replay and refund tombstones, authenticated delivery and private R2 storage must fail closed. No live Stripe checkout or price is approved by this decision. All synthetic test payments and private asset proofs are distinct from a real sale. See `docs/PRIVATE_KIT_COMMERCE.md` and `commerce/offers.json`.
