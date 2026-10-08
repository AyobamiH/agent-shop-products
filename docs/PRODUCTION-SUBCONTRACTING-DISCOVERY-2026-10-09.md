# Agent subcontracting discovery production acceptance — 2026-10-09

## Identity and acceptance evidence

- Owner repository: `AyobamiH/agent-shop-products`.
- Exact reviewed application source merged via [PR #20](https://github.com/AyobamiH/agent-shop-products/pull/20): `5c3c08c65fbc098a156b7b23341ed93f3d2812e3`.
- Cloudflare Worker `agent-shop` successfully deployed from a clean exact-main checkout with the authorised local Wrangler OAuth credentials after the current GitHub workflow's Cloudflare repository secrets were found unconfigured. No GitHub secrets were minted or widened to perform this release.
- Worker version `9df8627c-1872-47f1-944b-006c98646aad` on `https://agents.proofandstate.com`.
- Local frozen Bun 1.4.2 dependency installation, production bundle, TypeScript, lint and Vitest `37/37` passed, as did the Wrangler 4.135.0 dry-run and deploy.
- Built-in outside-in script `ACCEPTANCE_ORIGIN=https://agents.proofandstate.com node frontend/scripts/verify-deployed-surface.mjs` returned `status: PASS`, 21 public products, five machine surfaces and ten crawler identities.
- Independent HTTPS check confirmed the home page links to `agent-subcontracting-commercial-handoff`, and `/agents`, `/agents.txt` and the exact product detail link to the distinct Tail Wagging agent guide and its public machine-readable service catalogue.

## Commerce and authority boundary

Agent Shop remains a source-backed, GET-only catalogue and CLI-first roadmap, not a checkout or executable delegation service. The Tail Wagging provider owns its own live service discovery, commercial quotation, accepted payment and job execution and maintains distinct authority. No feature on Agent Shop accepts payment, customer secrets, work orders, production rights, or repository mutation permission.

Tail Wagging's durable work-intake expansion is a separate PR (#97) and is not established in production merely by these external links. Until its exact release succeeds, public service discovery and contact are the proven available interface; agent-job ledger availability must be read from the Tail Wagging production runtime.

## Search visibility boundary

Google Search Console last reported the `agents.proofandstate.com` homepage unknown and its subcontracting product discovered but not indexed. The new internal/external links improve navigation and crawl paths, but neither the release nor sitemap submission proves Google indexing, adoption or revenue. Observe the existing `sc-domain:proofandstate.com` tracking and resubmit the published sitemap after deployment.
