
# Agent Shop: discoverability and commercial launch acceptance

Observed 9 October 2026. This is a boundary and acceptance record, not a claim that Agent Shop currently sells digital goods.

## Baseline and risks

- Canonical repository source currently contains **33** original source-backed prompts/skills. The last independent public Agent Shop catalogue readback still showed **25**. Until the 33-item source is built, deployed and independently read back, describe that as source/runtime drift.
- GSC Wizard reports 30 tracked Agent Shop URLs: **five indexed**, 22 not indexed or unknown and three pending. The homepage is unknown to Google; /shop, /agents and some individual product pages are indexed. Settled Google search analytics for pages on the subdomain contained no reported rows in the previous 28-day window.
- The Agent Shop sitemap has been downloaded by Google with no reported errors; its aggregate indexed count disagrees with direct URL Inspection for five pages. Preserve both observations instead of treating the aggregate as definitive.
- No public paid SKU, price, checkout or fulfilment entitlement exists. The connected Stripe merchant is labelled websites-design-factory-on-the-web.com and contains unrelated products. Do not assume authority to sell Agent Shop offers through that account.
- Public product payload sources in this repository are publicly accessible. Selling identical copies of those files would not be a differentiated product.
- The public UI still uses Agent Capability Catalogue and identifies its brand as undecided, while cross-domain navigation calls the service Agent Shop. Buyer-facing name, logo, legal seller and support identity need explicit reconciliation.
- No root LICENSE file was found. Public source availability is not an implicit redistribution or resale licence. Do not invent rights.

## Discoverability and buyer value

The /solutions guide addresses four genuinely distinct needs, each with a real symptom, useful triage tests, several existing source-backed product links and a bounded next-step question:
1. A coding agent claims a fix but outside-in evidence is missing.
2. An integration or plugin advertises a tool but authenticated capability, permission or a real operation is missing.
3. A scheduled agent repeats consequences or loses durable work state.
4. An agent should hand a bounded job to an experienced human instead of broadening its own authority.

Every section links to actual products in the canonical catalogue and the current quote-first implementation service. No page implies a purchase, test result or access grant. The header, footer, homepage, catalogue, problem index, machine-readable guides and sitemap link into this useful decision graph. The page uses descriptive collection structured data, not invented Merchant Listing offers.

Google guidance:
- Crawler-friendly product and category links: https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure
- Canonicals and sitemap consistency: https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites
- Genuine Merchant Listing price and Offer requirements: https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- Sitemap discovery does not guarantee indexing: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview

## Four distinct product states

| Buyer choice | Current availability | Next step |
| --- | --- | --- |
| Public skill or prompt reference | Publicly inspectable | Browse the source-backed catalogue |
| Enhanced private execution kit | Not currently for sale | Build a distinct private tested deliverable, approve price and licence |
| Curated workflow bundle | Not currently for sale | Verify constituent kit interoperability, versions, updates and support |
| Professional integration or repository repair | Quote-first from separate Tail Wagging service | Agree a bounded job and acceptance criteria before payment |

Neither kit nor bundle may be presented as active inventory before the actual private deliverable, price, seller identity, rights and fulfilment are accepted.

## Sale-ready vertical slice

1. Select one real private execution kit that adds assets beyond public SKILL.md or PROMPT.md, such as tested scripts, fixtures, secure templates and rollback guidance. Keep its bytes in private storage.
2. Approve a merchant, exact GBP price, licence, included versions, tax/VAT position, refund and cancellation terms, support and delivery obligations. Do not reuse unrelated live Stripe products.
3. Use an independently governed offer record keyed to the canonical product ID, not copied price fields in product.json.
4. Implement server-authoritative Stripe Checkout and an idempotent signed webhook/reconciliation flow. Browser success is not proof of payment.
5. Persist the buyer's version-bound private entitlement only after independently verified payment; issue short-lived, revocable access without exposing premium files in the public app or repository.
6. Test valid purchase, bad SKU, amount injection, duplicate webhook, failed/ambiguous provider effects, refund and entitlement revocation.
7. Verify one separately authorised real paid order, private delivery and buyer access before reporting commercially live. Only then expand kits and introduce CLI buy/install/update; payment never grants repository or deployment authority.

## Measured funnel and release requirements

Treat each evidence state separately: crawlable page -> Google indexing -> observable search impressions -> relevant visit -> scoped enquiry -> accepted quote -> verified payment -> completed private delivery. IndexNow and sitemap submission alone prove none of the later states. Use consent-aware, privacy-preserving attribution where deployed.

Before any production claim: exact Git main vs Worker version; public product count; build, lint, TypeScript, tests and browser E2E; useful SSR problem copy and literal links; canonical/robots/sitemap agreement; genuine price and entitlement semantics; Google Search Console inspection after settled crawl. Preserve the independent OneClick IONOS DNS dependency; no domain changes are part of this work.

The P0 commercial launch issue is https://github.com/AyobamiH/agent-shop-products/issues/25. This slice improves problem-to-product discovery and honest buyer selection while the paid vertical slice remains gated.
