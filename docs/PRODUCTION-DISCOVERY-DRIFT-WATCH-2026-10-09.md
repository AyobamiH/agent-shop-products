
# Daily public catalogue and discovery drift watch

Updated 9 October 2026.

## Why

The canonical Agent Shop source has grown to 33 original product records while the last independently checked public Worker still served 25. Green pull-request CI is not production publication. Without an exact outside-in comparison, the gap can persist silently while Google reads stale pages.

The read-only checker at frontend/scripts/live-discovery-parity.mjs compares the repository's current public projection with the real https://agents.proofandstate.com catalogue and public search surfaces. It runs daily and is available as a manual GitHub Actions dispatch through live-discovery-parity.yml.

## What the checker validates

- The live catalogue's productCount matches the exact main-source record count.
- Every source ID exists in the live Worker with matching slug, type, name, summary, problem, outcomes, requirements, boundaries and tags.
- The live catalogue does not retain products missing from the source.
- No unapproved price, currency, checkoutUrl, Stripe price ID or merchant Offer appears in existing public discovery records.
- All source product detail URLs and the problem-led /solutions page are in the production sitemap.
- Four independently useful /solutions problem sections render in the live HTML.
- agents.txt advertises the /solutions path.

The source comparator is unit-tested with aligned, stale-deployment, metadata-drift, invented-price and incomplete-network-state fixtures. Normal CI runs only pure unit tests, not a live reachability check against unrelated deployed revisions. Scheduled/manual checks query the current public host with bounded HTTP timeouts.

## Failure semantics and safe recovery

- ALIGNED means the enumerated live contract matches canonical main for the checked properties. It does NOT guarantee a successful authenticated action, search engine indexing or a sale.
- DRIFT means records or page links disagree. The known 33-versus-25 mismatch is an expected **real failure** until a correct newer release is published; do not dismiss it as noise or silently mutate a catalogue to satisfy the test.
- UNAVAILABLE means a public endpoint could not be read. Treat it as unknown, not zero records or proof of no products.
- No automatic deploy or retry is authorised by this check. Resolve drift by reviewing the exact main commit, running the existing build/CI, deploying through the authorised Cloudflare account and performing independent public readback. Preserve current production and its rollback path if promotion is not safe.

## Independent monitoring

Search Console currently tracks the Agent Shop subdomain under sc-domain:proofandstate.com. Its inspection baseline had five individually indexed Agent Shop pages, many unknown/not-indexed pages, and no Agent Shop page rows in the latest 28 settled days of organic search analytics. Sitemap acceptance and IndexNow submissions are not indexing or visits. Keep the indexing tracker active, and measure separate source/referral demand, qualified requests, approved quotes, paid orders and fulfilment only when directly observed.

This read-only guard does not run Stripe, alter DNS, create GitHub secrets or assume that the connected remote desktop remains online. The approved paid execution-kit and bundle programme remains separately gated by issue #25.
