# Original integration packages

Three original private reference packages were authored for the Shop: capability access preflight, governed service delivery and durable effect recovery. Their public authority is `commerce/integration-packages.json`; actual payloads remain private. They contain executable Node.js 24 modules, operating instructions and tests. All 26 packaged automated checks and independent skill forward-review passed.

The lifecycle distinguishes accepted quote, verified payment, independent resource authority, technical delivery and business outcome. The recovery journal reserves effects before execution and blocks unknown outcomes from blind retry. Preflight validates supplied evidence fields without pretending to authenticate arbitrary caller assertions.

These are reusable integration components, not deployed provider adapters, a marketplace backend or copies of external skills. The 111/868/11 snapshot remains external discovery metadata. Prices, licences for distribution and live commerce are not inferred. The existing £9 kit and historical entitlements are unchanged.

## Offline request CLI

Run `node scripts/integration-request.mjs INPUT.json NEW_PRIVATE_OUTPUT.json` from the repository. Input contains contactEmail, requestedOutcome, targetRuntime, capabilities as kind/name pairs from the canonical inventory, and acceptanceCriteria. Optional repositoryUrl/siteUrl must be HTTPS without credentials or query tokens. Unknown fields, unknown or excluded capabilities and oversized requests are rejected.

The CLI writes a new mode-0600 provider-compatible request; it never sends it, charges a card or creates an accepted job. Review the provider's current contract before a separately authorised submission. Do not include credentials, confidential source, customer data or private chat excerpts.

## Remaining service integration

Tail Wagging currently provides work-order receipts and status. A full service lifecycle still needs authenticated operator/customer/payment adapters, transactional state persistence, an authorised executor and independent delivery acceptance. The reference packages do not claim those deployment steps are complete.

No conversion metrics are manufactured: existing tracked referral links identify the source of a visit, not a verified quote, customer or sale.
