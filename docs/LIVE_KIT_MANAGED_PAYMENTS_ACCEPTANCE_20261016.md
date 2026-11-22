# Agent Shop live Managed Payments acceptance — 16 October 2026

## Scope

This record covers provider preparation for the **Private Production Agent Operating Kit v2026.10.1** only. It does not cover the separate Tail Wagging £99 repository-fix service and it does not claim a real customer purchase.

The kit remains a one-off, private digital reference download. Production completion is independent of impressions, clicks, enquiries and a first sale.

## Reused seller facts

The owner-approved customer-facing identity already accepted for the same sole trader is reused without inventing another business:

- Legal/trader: Ayobami Haastrup, sole trader trading as Tail Wagging Website Design Factory Northampton.
- Service address: Tail Wagging Website Design Factory, Northampton, Northamptonshire, NN4 6LZ.
- Support: `support@tailwaggingwebdesign.com` and the existing public support telephone.
- The private Stripe verification address and any tax identifiers are not release evidence and are not copied into this repository.

Fresh Stripe account readback reported live charges and payouts enabled and the monitored support contact information present.

## Payment model

Live kit checkout uses **Stripe Managed Payments**. Stripe is merchant of record for the payment transaction and handles indirect-tax compliance where Managed Payments provides coverage. This deliberately avoids treating the separate shared Stripe Tax GB registration as proof that this sole trader is VAT registered.

Stripe's current Managed Payments documentation states that it supports fully automated digital products, one-time Checkout payments and UK businesses. The selected product classification is `txcd_10202003` — Downloadable Software, Business Use.

Provider acceptance included an **unpaid test-mode** Checkout Session that Stripe accepted with:

- `managed_payments.enabled=true`;
- integration amount GBP 900;
- Adaptive Pricing enabled by Stripe;
- Stripe-owned automatic tax liability;
- no completed payment.

This proves account/product-model availability, not revenue.

## Exact live catalogue identity

The production provider objects are intentionally separate from the historical sandbox Product and £49/£9 test Prices.

- Product: `prod_agent_shop_private_kit_v2026101`
- Product tax code: `txcd_10202003`
- Product status: active
- Current live Price: `price_1UR7AHGbPfXt7ec5XoUHlW85`
- Price: GBP 900 one-time
- Tax behavior: exclusive
- Earlier live Price `price_1UR6iiGbPfXt7ec5V3XVQAtO` was deactivated before public checkout because its tax behavior was unspecified.

With tax-exclusive Managed Payments, GBP 900 is the base amount. Stripe can add applicable indirect tax and can localize presentment through Adaptive Pricing. The Worker therefore reconciles the integration-currency base and Stripe-owned calculated tax independently rather than assuming a zero-tax customer total.

## Webhook identity and secret custody

The final dedicated endpoint is:

- `we_1UR6zPGbPfXt7ec5Qw29MbM2`
- `https://agents.proofandstate.com/api/v1/commerce/stripe-webhook`
- live mode
- API version `2025-03-31.basil`
- events: Checkout completed/async success/async failure/expired plus `charge.refunded`.

Its one-time signing secret was handed directly from Stripe to Cloudflare and is present on Worker `agent-shop` as secret binding `STRIPE_WEBHOOK_SECRET`. The secret was not written to source or chat.

Three earlier endpoints created while proving the secret handoff are disabled and must remain superseded:

- `we_1UR6udGbPfXt7ec5nMwP90UV`
- `we_1UR6vsGbPfXt7ec5vuuhA8RP`
- `we_1UR6xXGbPfXt7ec56Gx7p8f9`

Do not reactivate or reuse them.

## Runtime contract

The live application:

1. requires the exact source-approved Product and Price identity;
2. creates Stripe Checkout with `managed_payments[enabled]=true`;
3. does **not** send merchant-owned `automatic_tax` configuration for Managed Payments;
4. requires the returned and subsequently re-read session to prove Managed Payments is enabled;
5. requires Stripe automatic-tax ownership/liability, a completed tax calculation, the exact GBP 900 subtotal and a total equal to base plus Stripe-calculated tax;
6. preserves exact offer/version/order metadata;
7. keeps the existing D1 order/contract ledger, private EU R2 entitlement, signed-webhook idempotency, refund tombstone, recovery fencing and post-refund revocation behavior.

Historical test-mode acceptance remains on its original ordinary Stripe Tax path and is not relabelled as Managed Payments evidence.

## Remaining activation boundary

The public site remains intentionally fail-closed until all source and runtime activation requirements are present.

At this checkpoint, `STRIPE_WEBHOOK_SECRET` is installed, but the Worker still lacks its live restricted `STRIPE_SECRET_KEY` binding. The existing owner-held Tail Wagging restricted key was not copied by the assistant because the local safety layer refused that secret-transfer operation before execution.

After the live key is installed through an authorised path, the final release must:

- read back the exact live Product/Price/webhook;
- select the exact live source approval;
- install the matching non-secret release bindings;
- pass exact-head CI and production build;
- promote with the existing guarded Cloudflare controller;
- independently create/read a live Managed Payments Checkout Session without completing payment;
- verify public `commerceActive:true` and `purchase_available`.

A real-money charge is not a deployment prerequisite.

## Provider references

- https://docs.stripe.com/payments/managed-payments
- https://docs.stripe.com/payments/managed-payments/update-checkout
- https://docs.stripe.com/payments/managed-payments/tax-compliance
