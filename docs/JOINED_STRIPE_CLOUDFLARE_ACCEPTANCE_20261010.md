# Joined Stripe-to-Cloudflare private-kit acceptance — 10 October 2026

**PASS at 12:18:54 UTC.** Tested production commerce source `21bcfa75a49abb3b5c6fa859c0e5224b352764ca` with authentic Stripe test-mode payments and signed callbacks, isolated remote EU Cloudflare D1 and private EU R2. No real buyer or live money was involved.

This closes the previously unverified **same-payment Stripe → signed callback → D1 entitlement → private R2 download → genuine refund → revocation** technical gate. It supersedes the open joined-boundary statements in the earlier Stripe and synthetic sandbox reports. It does not activate production sales.

## One joined run

The isolated entry imported the actual production `handleCommerceRequest`, without a synthetic Stripe provider. Wrangler 4.135.0 remote preview used only the dedicated sandbox D1/R2 bindings. Stripe CLI 1.53.1 forwarded authentic Stripe-signed test events through a loopback relay that preserved the raw body and signature; the actual remote Worker verified and processed them. Test credentials stayed in a private local temporary `.dev.vars`, which was removed when the run finished. The listener and preview were stopped.

1. The connected test account and exact one-time, tax-exclusive GBP **900 pence (£9)** Stripe Price were independently verified.
2. The actual application Checkout endpoint created and persisted the order and its corresponding real Stripe-hosted test Session. A duplicate idempotency request returned 409. Before payment, private download returned 409; a wrong bearer returned 404.
3. Stripe's official CLI fixture mechanism used its supported `tok_visa` test-card token to complete that **existing application-created Session**, rather than an unrelated generated Checkout. Independent Stripe readback confirmed test mode, exact order linkage, paid/complete status and completed automatic-tax calculation.
4. That Session's authentic `checkout.session.completed` callback returned 200 from the actual remote application. The order became paid, and authenticated private R2 delivery returned the original **3,967-byte ZIP**, SHA-256 `d1a23812ab4a80ccaaa28978b90b0e71f3f035063b4745f61b56bf76c51f19d7`.
5. Replaying the same signed paid callback returned 200 without another entitlement. A forged signature returned 400.
6. A genuine full Stripe test refund succeeded. The matching authentic signed `charge.refunded` callback returned 200, the order and entitlement became revoked, and download returned 409. Replaying the old paid event after refund did not restore delivery.
7. An independent Cloudflare D1 API readback confirmed the exact order amount was 900 pence, with **one revoked entitlement** and a revoked order.
8. A second Checkout created by the actual application used Stripe's `tok_chargeDeclined` test-card token. Stripe independently reported unpaid test mode, PaymentIntent `requires_payment_method` and `card_declined`. The application reported fulfilment unavailable and denied download with 409. The unpaid test Session was expired afterwards.
9. Independent public offer readback confirmed production commerce remained disabled.

The private receipt and provider/session/event records are stored on the owner-managed machine under `~/.config/woe-ops/agent-shop-sandbox-20261010/joined-20261010/`. Do not publish its claim tokens, hosted payment URLs, raw event payloads or credentials. The repeatable private orchestrator is `joined-acceptance.py` in its parent directory.

## Limits and remaining launch work

This is real **Stripe test-mode** integration acceptance, not a real sale, customer conversion, browser visual acceptance, production webhook-endpoint acceptance or revenue. Authentic callbacks reached the remote Worker through the official CLI listener and local Wrangler proxy; a permanent deployed sandbox/production webhook endpoint still requires its own deployment/configuration readback.

The test account had zero Stripe tax registrations when inspected. A completed test tax calculation does not establish real VAT obligations, registration or appropriate tax collection. Final seller/contact identity, purchase terms, licence, digital-content consent/cancellation, refunds, support scope and applicable tax responsibilities remain separate commercial launch requirements. Production checkout remains closed.

During setup, an old cached Wrangler was replaced with the release's known 4.135.0 version. Cloudflare preview rejected Python's default HTTP user agent with error 1010; the diagnostic curl request succeeded, and the harness used curl's HTTP user agent for subsequent readbacks. These were harness/environment issues; production application source was not modified.
