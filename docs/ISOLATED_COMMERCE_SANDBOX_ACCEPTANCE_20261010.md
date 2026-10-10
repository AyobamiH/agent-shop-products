# Agent Shop private-kit sandbox acceptance — 10 October 2026

**Result: Cloudflare-integrated synthetic payment lifecycle PASS. This is not a live or Stripe test-mode paid transaction.** Do not classify it as a buyer acceptance or Stripe-hosted Checkout acceptance.

## Isolated infrastructure and evidence

* Production application at `https://agents.proofandstate.com` is operating on the independently accepted release source `1175b5c3d99985e9d6f7209febabb06f83134147`, with Worker Version `984d0f2a-3244-494a-abac-3b9063026d5b`. Guarded Cloudflare deployment `4501ec3d-859d-4cc7-b4f1-387ab42f840a`: independently verified 33 owned products, 990 names-only external capabilities, 20 agent-coding bugs; production commerce is `planned`, disabled, no approved GBP sale.
* Isolated **EU D1** `agent-shop-commerce-sandbox`, ID `a964dfc2-4ac2-4e40-b417-47746e5b1745`. Reviewable migration `commerce/migrations/0001_commerce.sql` applied remotely, seven statements accepted. It is **not** the production D1 database.
* Isolated **EU private R2** `agent-shop-private-kits-sandbox`. Independent private test ZIP copied to `private-kits/production-agent-operating-files/2026.10.1/kit.zip`. No production deliverable or customer object was changed.
* A temporary Cloudflare `wrangler dev --remote` environment used the real remote sandbox D1/R2 bindings and a **synthetic Stripe API adapter and local dummy webhook signing key**, without a real Stripe API key in Cloudflare, without an approved price and without a customer charge. The test Worker was reachable only through the local Wrangler proxy `127.0.0.1:18787`; no public storefront or real merchant offering was enabled.

## HTTP and durable lifecycle evidence

The private local acceptance record lives outside Git at `~/.config/woe-ops/agent-shop-sandbox-20261010/acceptance.json`. Test responses passed:

1. A test-only, fake £49 base price was displayed inside the isolated Worker; production did not expose a price.
2. Test Checkout creation returned a single order, non-URL bearer claim and synthetic Stripe-hosted URL structure; it generated **no Stripe PaymentIntent or money movement**.
3. Before the signed synthetic paid event, the order returned `checkout_open`, no entitlement, and download returned HTTP 409.
4. A synthetic HMAC-signed paid event, reconciled through the deterministic sandbox provider adapter, made one durable paid order and active entitlement. A duplicate signed delivery event created no second entitlement.
5. An unauthorised claim returned HTTP 404. Authenticated private R2 download produced the expected original ZIP SHA-256 `d1a23812ab4a80ccaaa28978b90b0e71f3f035063b4745f61b56bf76c51f19d7` (3,967 bytes).
6. A synthetic signed refund produced a durable tombstone, revoked the order and entitlement and blocked a later download with HTTP 409.
7. A forged Stripe signature returned HTTP 400; a missing bearer on order read returned HTTP 401.
8. Independent Cloudflare D1 readback of the isolated sandbox: **one order, one revoked entitlement, two webhook events and one refund tombstone**. Separate independent production D1 readback: **zero orders, zero entitlements, zero webhook events**.

## Explicit limits before commercial activation

The sandbox provider was synthetic, NOT an authenticated Stripe test-mode Checkout/charge. Stripe's actual merchant sandbox must separately prove real test-price identity, hosted payment completion with a test payment method, actual signed webhook, replay, provider fault/timeout, tax computation, private fulfilment and refund-to-revocation. Connecting to a Stripe live-mode account alone is not that acceptance; the connected Stripe plugin currently does not expose an Agent Shop test-mode account. The existing owner-managed local Stripe test credentials cannot automatically establish approved Agent Shop merchant, purchase terms or live pricing.

GitHub production `main` environment exists and is branch-scoped. Its `CLOUDFLARE_ACCOUNT_ID` variable is configured; `CLOUDFLARE_API_TOKEN` environment secret remains unconfigured because secret-transfer attempts through the current execution tooling were blocked. The independently successful guarded Cloudflare API release must not be described as a GitHub Actions deployment. A future approved, scoped secret can be stored directly with official `gh secret set --env production` or the GitHub UI; never copy the Cloudflare bootstrap token.

Paid/ongoing customer entitlements must survive suspension of NEW purchases. The related fix separates checkout admission from settlement and recorded private delivery: `COMMERCE_ENABLED=false` closes new Checkout without invalidating signed pending payments or an already-paid buyer's R2 entitlement. It never enables a public Buy button or exposes unrelated R2 keys. Regression tests cover settlement after closure, private download without current merchant keys and refund after closure.

**Decision:** Cloudflare + simulated provider integration accepted. Real Stripe sandbox and legally approved live pricing remain the clearly defined next gates. No fabricated sales, impressions, payment success or customer installation were claimed.
