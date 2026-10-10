# Stripe-hosted Checkout and event rehearsal — 10 October 2026

**Account and environment:** Verified UK merchant test-mode account `acct_1QNKKrGbPfXt7ec5`, `livemode=false`. No real card or buyer is used, and no real money is moved. This proof is *not* approval for live sales, UK VAT registration, cancellation terms, private licences or final support/updates.

## Provider-owned test objects

- Dedicated Stripe Product `prod_agent_shop_sandbox_private_kit_v1`: active, `livemode=false`, metadata `application=agent-shop`, `environment=isolated-sandbox`, `commercial=not-approved-for-sale`. It cannot be mistaken for a live product.
- Dedicated one-time GBP Price `price_1UOoeoGbPfXt7ec5mf0iN5OQ`: **4,900 pence (£49) for test only**, `tax_behavior=exclusive`, active, non-recurring, `livemode=false`. This is an engineering fixture, not an approved commercial offer.
- Real Stripe **test-mode** hosted Checkout Session `cs_test_a1e4szWHuX12zGh5QNDuSMbOsxistdbhoJ2OtjNppzAd2hjZWWCjGgwDSO`, order reference `2fec5529-9768-4b30-9f1d-100100000001`. Stripe's independent server readback verified `mode=payment`, `livemode=false`, `amount_subtotal=4900`, `amount_total=4900`, `currency=gbp`, `automatic_tax.enabled=true`, `automatic_tax.status=requires_location_inputs`, `status=open`, **`payment_status=unpaid`**, `payment_intent=null`. The URL is retained privately outside Git; it does not grant access, cannot create an entitlement and should not be published.
- The current Stripe API (`2026-09-30.preview`) rejected Checkout creation with legacy `payment_method_types[0]=card`: it explicitly instructs integrators to configure payment methods through Stripe Dashboard rather than that parameter. Removing the obsolete parameter allowed creation of the real test-mode Session. Regression test prevents reintroducing it. Keep Stripe Tax enabled; do not silently omit it to get a green rehearsal.
- An independent official Stripe CLI fixture trigger created actual Stripe **test-mode** objects and a real `checkout.session.completed` event `evt_1UOolAGbPfXt7ec5SLIt5LLw` with `payment_status=paid`, `livemode=false`. Its unrelated, CLI-generated Checkout was **USD 30**, with a separate Price and no Agent Shop metadata: **it did NOT settle the Agent Shop £49 order and must not be counted as such**. Attempts to change the fixture's line item to the actual Agent Shop test Price failed either because line items were missing or the payment-page total changed. Do not claim this as an application success or repeatedly trigger arbitrary unrelated events.

## Genuine Agent Shop test-mode payment and refund — independently verified

Using an original, private Stripe CLI `fixtures` template and Stripe's **`tok_visa` test token** (not any buyer's card), I created and completed a **new** real Stripe test-mode Checkout for the exact Agent Shop £49 test-only Price. This was not the earlier unrelated USD fixture, and it involved no real buyer or live payment. Independent Stripe API readbacks establish:

- Session `cs_test_a1OTrR2beS4c2Ue87887qffQ42kokWhpZC5F4JbJle0Iy1HEE4tshLJqUn`: `livemode=false`, `mode=payment`, `status=complete`, `payment_status=paid`, `amount_subtotal=4900`, `amount_total=4900`, `currency=gbp`, exactly one line item with `price_1UOoeoGbPfXt7ec5mf0iN5OQ` and quantity one, `client_reference_id=2fec5529-9768-4b30-9f1d-100100000002`, and matching application/offer/version metadata. **Stripe Tax was enabled and completed**, with zero tax calculated in this particular test; zero tax here does not prove VAT treatment for a real buyer.
- Authentic provider event `evt_1UOoqNGbPfXt7ec5qdLzcwPW` is `checkout.session.completed`, `livemode=false`, `payment_status=paid`. The independent PaymentIntent `pi_3UOoqMGbPfXt7ec50uxoq5ze` was `succeeded`, `livemode=false`, amount 4900 GBP. These are **real Stripe test-mode provider records**, not synthetic fixture responses within the application.
- Test-only Stripe refund `re_3UOoqMGbPfXt7ec50ezaZ8Iu` returned `status=succeeded` for all 4900 pence. Genuine Stripe test-mode event `evt_3UOoqMGbPfXt7ec50VFBHx5n` is `charge.refunded`, `livemode=false`, with the matching PaymentIntent, `refunded=true` and `amount_refunded=4900`. No real money moved.
- A schema-preserving, anonymised version of that authentic paid Session and refund is in `frontend/src/server/commerce/__tests__/fixtures/stripe-real-sandbox-20261010.json`; production `verifyPaidSession` must accept the exact test Price/tax-complete provider shape and reject incomplete tax, altered amount, currency, payment state, offer metadata, price ID or live-mode substitution.

**What this establishes:** Actual Stripe-owned test Price -> real Stripe-hosted test Checkout -> official CLI test-token payment confirmation -> independently verified genuine `paid` Session, PaymentIntent, signed event inventory and successful provider refund **before any first buyer**. It does **not** establish that Stripe's signing secret was securely injected into the separate Cloudflare sandbox receiver, or that the authentic event created its D1 entitlement. Keep those distinct boundaries open until separately observed.

## Independent private-fulfilment evidence

The app's actual `handleCommerceRequest` and remote EU Cloudflare D1/R2 were exercised separately, with a deterministic synthetic Stripe adapter and signed HMAC events. Evidence: `docs/ISOLATED_COMMERCE_SANDBOX_ACCEPTANCE_20261010.md`. It proved request/claim fencing, durable paid entitlement, private ZIP SHA-256 download, duplicate event, refund tombstone, checkout pause with historic entitlement preservation, forged signature and denied unauthorised download. These are strong Cloudflare integration tests **separate** from the now-authentic Stripe test Checkout and refund. Their event identities have not been joined into one signed webhook-to-entitlement run.

## What still defines the first-buyer acceptance gate

**Stripe-owned, real test-mode payment and refund are PASS.** The **remaining joined boundary** is that the authentic Stripe-signed `checkout.session.completed` event for the paid Agent Shop test Session must reach the isolated Cloudflare D1/R2 receiver using its own reviewed test webhook signing secret and the approved test-only provider key. Then verify **that exact order** receives a D1 entitlement, matches the private R2 ZIP digest, survives duplicate delivery, and is revoked by a genuine Stripe test refund event (including out-of-order delivery). A signed event's mere presence in Stripe's event inventory is not proof that the application processed it. Use a test payment method only. Never perform an actual card payment, live-mode charge, legal tax registration, or grant a buyer entitlement in production as part of this test. If an authenticated Stripe webhook listener cannot place its one-time signing secret into the isolated receiver through an authorised protected path, the webhook acceptance remains open.

Stripe's own automated-testing guidance warns that hosted payment interfaces employ measures that can prevent browser automation. Prefer provider-sanctioned Stripe CLI fixtures and API readbacks over brittle browser automation; the successful test used Stripe CLI's documented fixtures mechanism and supported test token, not a browser automation bypass. A session **created** or a success-page redirect is not evidence of a paid Session; only authenticated Stripe readback and durable server reconciliation are authoritative.

## Real Stripe-signed callback of the exact Agent Shop £49 test SKU — verified

I reran the approved test-only Price with a fresh Stripe CLI fixture (official `tok_visa` test token), while a Stripe CLI webhook listener forwarded authentic Stripe-signed test-mode events to a local receiver importing the **actual production `verifyStripeSignature`** implementation. The receiver read the ephemeral CLI listener signing secret locally, did not print it, verified the **raw request body and Stripe-Signature HMAC**, stored sanitized type/mode/verdict only, then returned HTTP 200 to Stripe CLI. No payment credentials, webhook secrets or customer data were sent to GitHub or the public Cloudflare Worker.

Independent Stripe provider readback of the new *Agent Shop SKU* test purchase:

- `cs_test_a1ql73nZOFwejxrJLAaUwQWuQdclvxWTaPOhSVmXhJzQJ8Scvg39X8yBof`: `livemode=false`, `status=complete`, `payment_status=paid`, `currency=gbp`, amount 4,900 pence, Stripe automatic tax **complete**, metadata `application=agent-shop` and exact offer/version/Price.
- PaymentIntent `pi_3UOp6yGbPfXt7ec501MPEZ26`: authentic test-mode payment against this Session. Refund `re_3UOp6yGbPfXt7ec50vbA6M2K`: succeeded, 4,900 pence, **test mode only**.
- The live Stripe CLI webhook feed reached the local receiver with a **genuine Stripe-signed** `checkout.session.completed` event (`livemode=false`, `payment_status=paid`, `merchantRefPresent=true`) and then a genuine signed `charge.refunded` event for the same test run. Both were accepted by production signature-verification code. Private receipt of the signed events is under `~/.config/woe-ops/agent-shop-sandbox-20261010/stripe-authentic-webhook-receiver.private.ndjson`; no secrets are in this repository. Listener and receiver were stopped after the controlled run.

The price, genuine paid Stripe Session, genuine matching test refund and **authentic signed ingress** are now proved for the *same Agent Shop test SKU*. They are not yet proof that this exact real Stripe event was received by the **isolated Cloudflare D1/R2 Worker** and issued its entitlement, because the temporary signed receiver ran locally and had **no D1/R2 write bindings**. The separate EU Cloudflare Worker end-to-end order/payment/R2/refund proof used a synthetic Stripe backend. Keep the joined Stripe→Cloudflare fulfilment acceptance gate open. A webhook signature verifier returning 200 without durable fulfilment must never be recorded as a delivered kit.

## Genuine test card decline — first-buyer negative case

Another Stripe-owned test-only Checkout used the exact approved sandbox Price with `tok_chargeDeclined` through the documented CLI fixture procedure. As expected, payment confirmation failed with Stripe `card_declined`. Stripe's independent Checkout readback showed `livemode=false`, `status=open`, `payment_status=unpaid`, tax status complete, GBP subtotal 4,900 pence; the corresponding real test PaymentIntent remained `requires_payment_method`, with `last_payment_error.code=card_declined` and `decline_code=generic_decline`. No `checkout.session.completed` paid event or private entitlement was issued for that test. A card-declined buyer must be offered a safe retry inside Stripe Checkout; no fake purchase success or ZIP access is allowed. This is a **negative acceptance PASS**, not a Checkout failure incident requiring a production change.

## Scope ledger after provider proof

| Boundary | Evidence status |
| --- | --- |
| Own test Product and tax-exclusive GBP one-time Price | PASS — authentic Stripe sandbox objects |
| Payment attempt and customer-facing Stripe-hosted Checkout | PASS — authentic test mode, no buyer |
| Provider status `paid`, exact amount/Price/mode/metadata, completed tax | PASS — independent Stripe API readback |
| Real sandbox refund and matching charge refund event | PASS — independent Stripe API readback |
| Authentic signed callback accepted by production HMAC verifier | PASS — local Stripe CLI forwarding, exact SKU |
| Real card-decline negative test | PASS — `requires_payment_method`, no paid event |
| Durable EU D1/R2 order→entitlement→ZIP→refund | PASS — separate controlled synthetic-provider test |
| The SAME real signed Stripe event issuing/revoking a Cloudflare D1 entitlement | NOT YET VERIFIED — separate trust boundary |
| Real sale, customer payment, UK terms/tax approval, customer support fulfilment | NOT ENABLED |

The next paid-commerce gate is to securely configure the **dedicated** Cloudflare sandbox Stripe test runtime key and a Stripe webhook signing secret for the *exact* isolated endpoint, rerun a test Checkout before activating any live buyer, and independently confirm event-to-D1-to-R2-to-refund reconciliation. Never turn production checkout on just because this table has multiple green cells.

## Lower introductory £9 sandbox price (10 October 2026)

The owner rejected £49 as a launch price for this small reference kit. Dedicated new **Stripe test-mode** Price `price_1UOp7qGbPfXt7ec5XHftnGUj` for the same product was created: GBP 900 pence, one-time, tax-exclusive, `livemode=false`, `environment=isolated-sandbox`. A genuine Stripe-hosted Checkout Session `cs_test_a1A205uc7w5daiez3SjOv6DGZtxDkscYhPzb57tdtu644PM3F21wVEEi3Z` was successfully created with one £9 item and Stripe Tax enabled. It remained `status=open`, `payment_status=unpaid`, with no real money movement. The previous £49 fully paid/refunded Stripe test is retained as historical provider evidence. **Do not claim that the new £9 session has been paid or that an authentic £9 signed webhook reached Cloudflare D1.** The source config blocks accidental new £49 charges after the reviewed £9 introductory direction.

See `docs/PRIVATE_KIT_INTRODUCTORY_PRICE_20261010.md` for the offer, code admission rule, fee context, legal gate and conversion instrumentation.
