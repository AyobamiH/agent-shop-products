---
schema: clawsweeper.project-vision.v1
project_id: agent-shop-products
repository: AyobamiH/agent-shop-products
---

# Project Vision

## Identity

Agent Shop Products is the canonical public source repository and machine-readable catalogue for AyobamiH prompt products and future agent skills.

## Purpose

Keep product payloads, discovery metadata, provenance, and future agent-commerce interfaces source-backed, modular, independently versionable, and safe for public consumption.

## Owns

- Canonical public product payloads.
- Per-product discovery metadata and stable product identities.
- Public catalogue projections and source provenance.
- Governance for what may enter the public agent-first shop catalogue.

## Does Not Own

- Private or premium-only payload publication without an explicit decision.
- Invented pricing, reviews, customers, compatibility, evidence, or performance claims.
- Commerce state merely because catalogue metadata exists.
- A network service or AI search layer where deterministic catalogue logic is sufficient.

## Non-Negotiable Invariants

- Real products only; no mock or filler inventory.
- Unknown facts are omitted rather than simulated.
- Product payload, discovery metadata, provenance, commerce state, projection, CLI behaviour, and storefront rendering remain separate concerns.
- Stable product IDs and slugs are preserved unless an explicit migration is approved.
- The public repository never silently exposes private customer or premium material.
- Future agent commerce remains CLI-first unless a later explicit decision changes that direction.

## Evidence of Done

A product/catalogue change is done only when source payload, metadata, manifest/projection, provenance, uniqueness, and public-boundary checks agree.

## Relationships

- Future storefront/CLI consumers should consume catalogue contracts rather than maintain independent product lists.

## Canonical Sources

README.md, AGENTS.md, docs/DECISIONS.md, docs/CATALOG_CONTRACT.md, products/, and catalog/sources.json.

## Agent Rule

Preserve source provenance and product boundaries. If a commercial or evidence fact has no authoritative source, omit it.
