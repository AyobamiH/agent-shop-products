# Buyer records, recovery and retention — 12 October 2026

## Implemented contract

New checkout creates an immutable per-order copy of the offer and buyer policies in the same database transaction as the order. If that persistence fails, no Stripe Checkout request is made. Verified payment adds the actual tax and total. The authenticated buyer can save the complete record as plain text before downloading the private archive. Refunded buyers can still retrieve their purchase record. Historic orders without this new snapshot retain their existing delivery behaviour.

Access recovery is an owner-only CLI operation. The operator must first verify control of the original billing contact; knowledge of an order reference or receipt alone is insufficient. The CLI independently retrieves the matching paid Stripe session and checks the billing email, session, order, payment intent and mode. A conditional, atomic rotation invalidates the old claim and records a bounded audit event. Refunds, concurrent recovery and repeated request IDs are rejected. Replacement claims go only into an exclusive, permission-0600 local output file, never logs or URLs. The customer can enter the replacement code on the order-help page.

Cleanup removes only failed attempts that never reached a payment session after 30 days, closed checkout URLs after two days, processed webhook references after 90 days and expired rate-limit entries. Paid records, active licences, refund tombstones and legal holds are preserved. Financial-record review dates use the UK tax year in Europe/London and the self-employed record-keeping minimum; the date triggers review, not automatic erasure of ongoing rights.

## Acceptance

- 78 unit tests passed, including seven new real-SQLite transaction, immutable-record, identity mismatch, recovery race, cleanup rollback and tax-year tests.
- Real isolated Cloudflare D1 accepted both additive migrations and demonstrated atomic rollback when the second statement failed.
- Authentic Stripe test-mode £9 Checkout paid through the deployed application. Its direct signed webhook confirmed the order.
- The authenticated purchase record downloaded before the exact private ZIP. The archive hash matched the existing reviewed asset.
- The owner recovery CLI retrieved the genuine test-mode paid session, rotated the claim, denied the old claim and accepted the replacement.
- A genuine Stripe test refund revoked access. Replay and declined-card checks passed. No live-money payment occurred.
- Mobile and desktop browser checks verified support-code entry, code removal from the form, purchase-record download and the download prerequisite.

The acceptance used the isolated working candidate; release requires an immutable commit, CI, the additive production migration, guarded promotion and live readback. No production merchant fact is inferred from sandbox success.

## Operator commands

Run with Bun from the reviewed repository:

```text
bun scripts/commerce/owner-commerce.ts status PRIVATE_CONFIG
bun scripts/commerce/owner-commerce.ts retention PRIVATE_CONFIG
bun scripts/commerce/owner-commerce.ts recover PRIVATE_CONFIG PRIVATE_INPUT PRIVATE_OUTPUT
```

Configuration is permission-0600 JSON containing accountId, databaseId, mode and a protected Cloudflare credential source. Production mode is restricted to the known Shop D1 database. Recovery additionally needs a protected stripeKeyFile; production requires a restricted live key. Test fixtures may use a test key.

Recovery input contains requestId (UUID), orderId, customerEmail and verifiedCustomerControl=true. Use a new request ID only after investigating a failed operation; never retry blindly after token rotation. Deliver the new code only through the already verified customer channel. Do not place credentials or customer input in Git, command arguments, chat or support logs.

The daily retention job must use the dedicated Shop credential and reviewed main checkout. Record each result as counts only; inspect failures and financial review counts. It must not alter unrelated runtime services.

## Sources

- [UK distance-selling information and durable purchase confirmation](https://www.gov.uk/online-and-distance-selling-for-businesses)
- [Self-employed record retention](https://www.gov.uk/self-employed-records/how-long-to-keep-your-records)
- [ICO storage limitation and retention schedules](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/)
- [Cloudflare D1 atomic batches](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Cloudflare administrative D1 query API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/)
