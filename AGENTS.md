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

- `products/<product-id>/PROMPT.md` is the canonical payload for a public prompt product.
- `products/<product-id>/SKILL.md` is the canonical payload for a public skill product.
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

## Repository-owned agent foundations

Before every development change, including documentation-only work, read the
[local Secure API Delivery skill](.agents/skills/secure-api-delivery/SKILL.md)
and the [repository knowledge entry point](.agents/knowledge/README.md).
If the skill is absent from your catalog, open that relative file directly.
These versioned files are sufficient for discovery without a home-directory skill.

Perform the skill's initial applicability review: name the requested scope,
exact revision, trust boundaries, permitted tests, and evidence limits. For
low-risk documentation work explain why runtime/API checks are not applicable;
never skip the initial scope review or imply security certification.
Preserve existing repository instructions, narrower directory rules, owner
work, security controls, and release gates. This guidance grants no authority
to publish, deploy, access secrets, scan live systems, or spend money.

Update relevant repository knowledge with architecture, behavior, command, and
boundary changes in the same change. Preserve source-backed rationale and
verified lessons, not raw conversations, secrets, private host inventories, or
stale live-status claims. Report conflicts rather than silently replacing policy.
Run `python3 scripts/validate-agent-foundations.py` and `git diff --check`;
after commit also run `python3 scripts/validate-agent-foundations.py --git-archive HEAD`.
This offline structure/link check is not application testing or a CI/security gate.
Run `python3 scripts/test-agent-foundations.py` for isolated positive and negative validator fixtures.
