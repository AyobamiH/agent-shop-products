# Production completion, independent of demand — 15 October 2026

## Owner correction and effective finish line

The owner rejected treating the 28 October acquisition experiment or its first
qualified enquiry as a predecessor to finishing production. That dependency was an
assistant workflow mistake, not a product requirement. Issues #25 and #53 now
separate release readiness from post-launch results. Continue engineering and
rollouts immediately; never wait for impressions, clicks, enquiries or a first sale.

A usable public catalogue/quote route, an available live paid checkout and a proved
real customer purchase are three different states. Do not call the entire paid
product ready merely because the first state works. Conversely, do not require the
third state before releasing a properly tested and configured second state.

## Actual source defect repaired

Both deployment paths formerly required `commerceActive:false` and the candidate
metadata guard unconditionally rejected `COMMERCE_ENABLED=true`. Even a correctly
configured live offer could not pass those release checks. The public verifier also
accepted only a broad amount/URL shape for active offers, without a live/test label.

The new `commerce/release-policy.json` and shared release-policy module select the
expected commercial mode from reviewed source. They require the exact approved
£9 GBP price and legal URLs/versions, matching live decision and offer bindings,
private secret binding types, existing merchant facts and independent outside-in
readback. The active offer now identifies `mode:test` or `mode:live`, preventing a
sandbox response from being mistaken for a production payment path.

The default remains closed. This change enables a legitimate live release path; it
does not invent merchant facts, create a real payment, modify tax registrations,
publish a private address, change a key or waive the existing checkout/recovery gates.
A policy cannot replace the provider checks or the authorised live secret setup.

## Fresh factual and configuration blockers

Read-only connected live Stripe inspection on 15 October found charges and payouts
enabled, but the public merchant support name/email/URL/address fields unset. The
already approved business name and monitored contact email are available and need
not be requested again. The connected account API exposed retrieval but no supported
account-profile update operation in this session; this is a tooling boundary, not
missing owner permission.

The active GB Stripe Tax registration still contradicts the owner's stated
non-VAT-registered position. Stripe records do not establish HMRC registration.
A customer's lawful seller address has not been authorised beyond the supplied
location/postcode. The private verification address is not publication authority.
These are factual decisions, not analytics metrics or engineering tests.

The complete connected live-webhook listing contained no Agent Shop endpoint at
`https://agents.proofandstate.com/api/v1/commerce/stripe-webhook`. The metadata-scoped
Agent Shop live-product search returned no matching product; this narrow search is
not a claim that every differently labelled product was inspected. Do not reuse
another service's payment product or webhook. Live Stripe credentials, permanent
webhook signing configuration and the exact live offer must be secured and verified
before opening this paid route. No existing unrelated endpoints were changed.

## Remaining release sequence, with no traffic dependency

1. Reuse the established seller name, telephone, monitored email and £9 one-off
   direction. Obtain only the genuinely missing authorised customer-facing address
   and resolution/explicit authority for the conflicting shared tax configuration.
2. Align the public merchant support profile through a supported authorised write.
   Provision the exact Agent Shop live Price and permanent webhook with private
   scoped key custody; independently read back the account, mode, amount and endpoint.
3. Publish the final factual buyer information and exact policy versions. Record
   only sanitised truthful evidence in launch-readiness. Supply the matching reviewed
   live release-policy approval and runtime bindings; no real charge is necessary.
4. Run exact-source tests/CI, upload the immutable candidate, verify private storage
   and expected public contract, promote safely and independently read production.
5. Record the shop as ready for its first real buyer only when those requirements
   pass. Record later traffic, actual purchases and fulfilled deliverables separately.

## Validation

The regression suite covers live release with no customer/traffic, every missing
seller fact, unsupported approval bypasses, wrong prices/currencies/terms, opaque
or duplicate flags, missing/unsafe secret bindings, sandbox-as-live confusion,
public contract drift and the full simulated provider promotion. Tests use synthetic
merchant evidence and no network payment. Existing payment/refund/recovery fixtures
are reused. Actual command/CI/release receipts are recorded in issue #25 after running.

## Primary factual references

- UK distance-selling buyer information: https://www.gov.uk/online-and-distance-selling-for-businesses
- UK online-selling requirements: https://www.gov.uk/online-and-distance-selling-for-businesses/online-selling
- Stripe Tax registration scope: https://docs.stripe.com/api/tax/registrations

These establish why seller facts and provider configuration differ from sales
performance. They do not establish the owner's VAT status or an authorised address.
