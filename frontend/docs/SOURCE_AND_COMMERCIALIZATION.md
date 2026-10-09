# Source Provenance and Commercialization Review

## Current factual state

Products are now authored in `AyobamiH/agent-shop-products` (branch `main`), with per-product metadata in `products/<product-id>/product.json` and payloads in `products/<product-id>/PROMPT.md`.

`catalog/sources.json` in that repository records, per product, the canonical path and blob SHA plus the origin record in the earlier `AyobamiH/ai-prompts` repository. `AyobamiH/ai-prompts` is provenance/history only; it is not the current authority.

The licensing question raised by the earlier public repository still requires a business decision before paid launch.

## Frontend consequence

This frontend phase must:
- consume the synced public projection only;
- not expose more raw prompt payload than intended;
- not label products “premium”, “exclusive”, or proprietary without an approved licensing/source strategy;
- not invent checkout or ownership claims.

## Required business decision before paid launch

Decide which model applies to each product:

1. **Open source + paid convenience/support** — source remains public; revenue comes from packaging, updates, bundles, install tooling, support, or hosted services.
2. **Public sample + private premium implementation** — public source becomes a bounded sample/reference.
3. **Private product** — premium source is not committed publicly.

This document does not resolve ownership or licensing. It records the issue so the frontend does not outrun the source strategy.
# Owner-authorised integration acquisition, 9 October 2026

The full external registry is now an authorised discovery collection alongside original products. Every advertised skill/tool/control receives an original procurement brief; owned workflow pages also link to custom integration assessment. Shared terms are canonical in `../../catalog/capability-acquisition.json`. Buyers request feasibility and quote review through Tail Wagging's existing custom-work route. No listing sells external account access, distributes unlicensed implementations, claims a configured checkout or guarantees installation. No handoff is submitted automatically. The owner-excluded RUBE provider remains visible as inventory evidence with its quote action withheld.
