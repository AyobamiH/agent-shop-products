# Agent Shop 25-product release acceptance — 9 October 2026

## Source and authority

- Canonical repository `AyobamiH/agent-shop-products` at exact main revision `0a0de2b3461b00bd489ef3716548d06d72d6950f`. The product authoring boundary remains per-product `product.json`; the 25-item aggregate is the generated public projection, not a new source.
- The revision introduced four new source-backed skill products with the slugs `bounded-solo-maintainer-release`, `capability-surface-reconciliation`, `consent-aware-plugin-measurement` and `staged-mcp-plugin-activation`. Public catalogue totals at that source: 25 products, 11 prompts and 14 skills.
- Exact revision's GitHub `Frontend CI` workflow [37862048453](https://github.com/AyobamiH/agent-shop-products/actions/runs/37862048453) returned success. Local frozen Bun 1.4.2 install, source sync/catalogue validation, production build, TypeScript, lint and 37 unit tests passed. Lint warnings exist, but the lint task exited successfully.

## Cloudflare acceptance

- Authorised workstation Wrangler 4.135.0 deployment used the existing connected account rather than placing broad Cloudflare tokens into GitHub Actions.
- Dry-run verified exactly one public Worker Assets binding; deploy succeeded against `agents.proofandstate.com`, Worker `agent-shop`, version `a204534a-76a0-4eda-93d5-5f76aba4e3d6`.
- Outside-in `ACCEPTANCE_ORIGIN=https://agents.proofandstate.com node scripts/verify-deployed-surface.mjs` returned PASS: 25 products, five machine surfaces (`catalog.json`, `agents.txt`, `llms.txt`, `robots.txt`, `sitemap.xml`) and ten representative crawler identities.
- Independent public readback: every new `/products/{slug}` page and `/raw/products/{slug}.md` responds 200; each HTML detail includes a canonical tag; `/agents.txt` reports `products: 25`, not the previous 21.
- Four new product URLs were added to the existing `sc-domain:proofandstate.com` GSC Wizard tracker `d0a42e41-d332-4adb-bc99-b1f0b639cdbb`. The sitemap was accepted for Google re-download; indexing remains unproven until future URL Inspection.

## Boundaries

This is a catalogue and discovery deployment, not proof of installs, purchases, Google indexing, external agent subscriptions or paid subcontracting. Agent Shop's separate Tail Wagging links remain informational; job intake and commercial authority belong to the independently controlled Tail Wagging domain and Worker.

No full premium skill/prompt payloads, secrets, fake prices, unsupported compatibility or adoption claims were added to the public catalogue. Revalidate source SHA and deployed version if the site is upgraded again.
