# Agent Shop — private execution kit commercial boundary (v1)

**Source:** `AyobamiH/agent-shop-products`; **business status:** quote-first services available, private kit unpriced and unavailable for purchase until approved. Code and tests are NOT evidence of a real paid transaction.

## What is being sold (not a resale of public files)

The proposed "Private Production Agent Operating Kit" is separate from the public source-backed "Production Agent Operating Files" prompt. The proposed private deliverable is a versioned ZIP containing *new*, privately authored runtime guard examples, executable policy tests, integration harnesses and deployment/rollback worksheets. The original prompt remains freely readable and is not an entitlement.

The public `commerce/offers.json` is product intent only, with status `planned`, **no price ID, amount or policy claims**. Never commit the private ZIP to this public repository. `commerce/migrations/0001_commerce.sql` is a D1 migration to apply only to the specifically created private commerce D1 after reviewed acceptance. The source contract includes an exact private object path; that path is not an access mechanism.

## Operator approval and legal prerequisites — required before test-mode Checkout, even more before real charges

Record the approved Stripe merchant/account, genuine private ZIP digest and version, purchaser rights, approved GBP one-off price, applicable VAT/tax responsibilities, identity/contact, refunds/cancellations/digital-consent language, duration of updates/support, commercial decision ID, and the actual public terms/licence/refund URLs. The legal links must exist and be independently HTTP-200 before activation.

Never activate from generated sample values or an unrelated merchant's products. Only the account owner may approve the precise offer terms and mode. In particular, **a connected Stripe livemode account is not a test-mode API key or evidence that it is Agent Shop's merchant**.

## Production topology

- Cloudflare Worker: public catalogue and separate `/api/v1/commerce/*` backend.
- `COMMERCE_DB`: dedicated D1 database; reviewed migration with unique order/idempotency/session/payment indexes, atomic batches, revocable entitlements, refund tombstones and durable webhook event IDs.
- `PRIVATE_KITS`: **private R2 bucket with NO r2.dev or custom-domain public access**. Verify exact ZIP object is privately present and contents are genuinely differentiated.
- `COMMERCE_RATE_LIMITER`: Cloudflare runtime rate limiter for checkout creation; fail closed when missing.
- Stripe-hosted Checkout: fixed allowlisted price and currency from signed-off runtime offer, not browser request. Verify the Stripe-owned Price is active, one-off, has matching amount/currency and mode **before** creating Checkout, never after potentially charging the buyer. Raw-body Stripe-Signature verification, 5-minute timestamp window, provider session reconciliation by amount, price ID, currency, mode, paid status, intent, metadata and order linkage. A `success_url` is not proof of payment or entitlement.
- Claim token: 256-bit random, hashed at rest, never placed in Stripe URLs. Browser sessionStorage is same-tab only; cross-device/missing-claim recovery remains an authenticated manual support workflow until separate account recovery exists.

### Activation settings (environment-specific and secret; never commit actual values)

`COMMERCE_ENABLED=true`, `COMMERCE_MODE=test` (first), `COMMERCE_OFFER_APPROVAL=<approved JSON>`, `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`, D1/R2/limiter bindings.

Approval JSON requires these exact fields: `offerId`, `version`, `priceId`, `unitAmountPence`, `currency=gbp`, `termsVersion`, `licenceVersion`, `refundPolicyVersion`, `commercialDecisionId`, `termsUrl`, `licenceUrl`, `refundUrl`. Legal URLs must be approved HTTPS `/legal/<slug>` paths on `agents.proofandstate.com` or `proofandstate.com`, with no query string or fragment. The live branch additionally requires `COMMERCE_MODE=live`, a matching `sk_live_...`, and a separate exact `COMMERCE_LIVE_APPROVED=yes:<commercialDecisionId>` attestation.

These are explicit authority gates; they are **not automatically provisioned** by merging a PR or visiting the offer.

## Infrastructure readback (9 October 2026)

- Dedicated **EU D1** created: `agent-shop-commerce` (`f3fa2e0b-bb41-4c51-8b44-25f699baa39b`). Migration `0001_commerce.sql` was applied and five expected tables independently returned by SQLite metadata. No customer/order rows were created.
- Dedicated **EU R2** bucket: `agent-shop-private-kits`. Independent Cloudflare readback confirmed **zero enabled custom domains and disabled r2.dev public endpoint**.
- A genuine privately authored pre-release reference archive was created outside the public repository, with 17 standalone Node tests passing. R2 object key matches `commerce/offers.json` and an independent authenticated byte readback returned SHA-256 `d1a23812ab4a80ccaaa28978b90b0e71f3f035063b4745f61b56bf76c51f19d7` (3,967 bytes). No private ZIP bytes were committed to public GitHub or made publicly accessible.
- `frontend/wrangler.jsonc` binds only this D1, this private EU R2 and a dedicated 6/minute checkout creation limiter. **No live price, merchant approval, legal text or Stripe secret is configured**. The offer remains `planned` and purchasing disabled.

## Error handling and replay semantics

All public error responses are bounded stable error codes plus a correlation ID, not raw provider data, customer identity, stack traces or tokens. Invalid/missing fields return 400/401/403/405/409. Rate limits return 429 with Retry-After. Unavailable storage, provider transport, missing private asset and early webhook races return safe retryable 503. Unknown orders or invalid bearer claims return a uniform 404. Worker may not return an active offer without the entire configuration and resource contract.

On signed webhooks: match known stored orders, re-read Stripe Checkout Sessions server-side, verify exact price and paid state, and commit paid ledger, entitlement and event ID in one D1 batch. D1 batch atomic rollback is required. Ignore unrelated event types. Duplicate event IDs are idempotent. Refunds add terminal payment-intent tombstones, revoke both paid state and entitlement, and protect against later paid-event replays. A webhook arriving while checkout is still being created must be retried, not silently acknowledged. Never create a new entitlement from the browser redirect.

The checkout creation boundary is intentionally conservative: a repeated idempotency request returns conflict, not a second Stripe charge or retrievable claim secret. If Stripe accepts a session but D1 persistence fails, reconciliation through signed provider events and owner audit is required before any customer claim; do not auto-recreate a second session or deliver an unrecorded order.

## Release / commercial acceptance gates

1. **Source:** code review, canonical branch, regression/unit/negative tests, lint/typecheck, browser E2E and exact-head CI. Production builds require an explicit `VITE_SITE_ORIGIN=https://agents.proofandstate.com`; local placeholder canonical links are rejected.
2. **Preview:** upload version without changing production routing; inspect public GET discovery, security headers and disabled-offer response. Promotion and Cloudflare readbacks remain separate evidence.
3. **Migration/bindings:** create a separate D1 and private R2 bucket; audit zero public R2 access; apply reviewed SQL; verify real binding IDs and private object SHA-256; test missing/malformed settings fail closed.
4. **Stripe sandbox:** use an owner-approved merchant test account and real Stripe test key, an approved test price and signed webhook endpoint. Reconcile a test-mode paid event, duplicate delivery, delayed async, missed webhook recovery, Stripe failures, invalid amount, bad signature, timeout, refund and access revocation. A synthetic/mock test does not satisfy this gate.
5. **Production activation:** approve UK seller identity, buyer legal terms, price, tax/refunds, support/updates and verified deliverable; configure LIVE keys and restricted webhook secret. Deploy through guarded release path, independently verify the exact public SKU/legal URLs and observer capabilities before enabling a real Buy button.
6. **Revenue verification:** separately record search indexing, impressions, clicks, view, checkout started, Stripe payment, verified entitlement, private delivery, installed use and real outcome. No purchases/conversions can be inferred from source counts, sitemap submissions or endpoint uptime.

## Recovery and rollback

Maintain the previously accepted Worker Version ID. Turn off `COMMERCE_ENABLED` or roll Worker deployment back on any reconciliation/integrity failure; do not delete payment/order ledgers, refund tombstones or purchaser entitlements during rollback. Pause and investigate if a paid Stripe session has no matching DB row. Handle reconciliation manually until a separately tested administrative idempotent recovery flow exists. Stripe webhook retries and provider logs are not a substitute for internal reconciliation monitoring.

## Source-of-truth references

- Stripe: hosted Checkout Sessions, raw webhook signature validation, retry/idempotency and payment-state fulfilment.
- Cloudflare: D1 prepared statements and atomic `batch` transactions; private R2 bindings and deny-public bucket configuration; Workers rate-limits.
- Repository: `commerce/offers.json`, `commerce/migrations/0001_commerce.sql`, `frontend/src/server/commerce/`, `frontend/src/routes/private-kits*.tsx`.

## Nitro binding incident and permanent regression gate

The 9 October version candidate at `bc65dad` returned HTTP 503 for
`/api/v1/commerce/offers` despite healthy catalogue routes. The inner
TanStack SSR service invoked `src/server.ts` without passing the outer
Cloudflare `env` argument; Nitro's generated Cloudflare entry sets
`globalThis.__env__` at the outer request boundary. The fix resolves the
runtime binding on each request, never captures it during module loading,
and falls back to empty/disabled for a missing environment. This is
covered by server-entry unit tests, browser smoke checks and the
source-to-public verifier. If the Nitro integration changes, the
`/api/v1/commerce/offers` canary must pass before promotion; a
`COMMERCE_DEPENDENCY_ERROR` is **not** an acceptable pass.

The current source uses Nitro's observed `globalThis.__env__` contract.
At the next framework upgrade, reassess against Cloudflare's documented
`cloudflare:workers` env import and require a new deployed canary.

## Candidate release acceptance, 9 October 2026 (no commerce activation)

The Nitro `__env__` recovery is independently accepted at a version URL:
`https://preview-commerce-nitro-env-agent-shop.woeinvests.workers.dev`
(Worker version `8a67c930-c208-4b48-a86d-06b207486f8a`). The
source-to-public verifier reported **PASS** for 33 owned products, 990
advertised external capabilities, 20 coding bugs, 10 crawler agents,
`/private-kits`, disabled `/api/v1/commerce/offers`, protected order lookup,
correct canonical `https://agents.proofandstate.com`, and agent discovery
surfaces. An earlier version returning HTTP 503 for the harmless offers GET
was rejected before promotion.

Versioned Worker URLs use configured production resources. No checkout was
activated, no payment call was made and no customer entitlement was created.
A source revision and a successful candidate are not equivalent to a merged
main commit, production promotion or a verified paid purchase.

## Commercial tax and checkout safety

Checkout requires Stripe's `automatic_tax[enabled]=true`; the approved merchant must configure Stripe Tax and complete its tax/VAT assessment before activation. If tax computation is unavailable, session creation is rejected rather than silently making a tax-free claim. The D1 creating-row insert and checkout session persistence each require exactly one affected row before returning a purchase URL. An interrupted or ambiguous provider/network response is a recovery case, not permission to issue a second charge.

### Out-of-order refunds

When Stripe delivers a signed refund before a delayed paid-session event, the payment-intent refund tombstone is durable. The subsequent paid event reconciles provider payment details, atomically marks the order revoked and leaves no active download entitlement. Only after an independent state readback is the webhook event acknowledged. Synthetic tests cover both refund-before-paid and paid-before-refund ordering.

### Tax-aware payment reconciliation

The approved GBP kit price is a **pre-tax, one-time, tax-exclusive** price. Before opening Stripe-hosted Checkout, the server verifies Stripe's Price really is active, the correct one-off amount/currency/mode and `tax_behavior=exclusive`. It requests Stripe automatic tax. Fulfilment reconciles `amount_subtotal` to the approved kit price, zero discounts and shipping, and `amount_total = amount_subtotal + total_details.amount_tax`. It would be unsafe to compare tax-inclusive `amount_total` directly to the pre-tax price: doing so could strand a legitimately taxed buyer's delivery after payment. Synthetic tests cover both correct tax additions and forged subtotals/tax/discounts.
