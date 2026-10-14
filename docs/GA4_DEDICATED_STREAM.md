# Dedicated Agent Shop GA4 stream

The owner authorised a correctly owned Agent Shop stream and enabled the Google
APIs in the existing OAuth project on 14 October. Direct inventory verified the
business account and found no existing Shop stream. This is separate from a visitor
consenting to tracking and from authorising a real-money purchase.

`scripts/google-provision-shop.mjs` provides a narrow preview/apply flow using the
existing saved owner grant. Preview requires an observed `accounts/ID` and prints
an exact SHA-256 of the proposal. Apply requires that reviewed hash. It creates or
reuses only a dedicated property named `Agent Shop — Proof & State`, reporting in
Europe/London and GBP, with one `Agent Shop website` stream for the exact Shop
origin. It refuses a same-named property used by another host, duplicate matches,
trashed/moved/mismatched resources and ambiguous creation intents. It does not
change or delete unrelated properties or accept Google Signals terms on the owner’s
behalf. No billing, advertising account, Measurement Protocol secret or checkout
is created.

Before every non-idempotent create the owner-only journal records intent. After
creation the returned identity is persisted and independently read back. An
ambiguous response is reconciled from the existing resource inventory; absence
remains unresolved rather than causing a blind retry. Privacy PATCH operations
are idempotent and independently checked. The local exclusive lock prevents two
copies of this operator overlapping, not an atomic lock on Google's entire account.

The target disables all eight enhanced-measurement switches, disables Google
Signals, uses two-month event/user retention without resetting user retention,
enables email and specified query-parameter redaction, and adds six event-scoped
bounded discovery dimensions. Google Ads links must be absent. It does not mark
quote clicks as qualified leads or purchases. The detailed evidence is saved in
the private operator directory. The website remains unchanged and tracking stays
off until a separate reviewed configuration and browser/ingestion acceptance.

```sh
node scripts/google-provision-shop.mjs --account accounts/ACTUAL_ID
node scripts/google-provision-shop.mjs --account accounts/ACTUAL_ID --apply --expected-sha256 REVIEWED_HASH
```

Actual resource IDs come from direct Google readback, never illustrative values.
Use `agent-shop-google inventory`, `inspect-stream`, `analytics-report` and
`realtime-report` for independent checks. Search Console reporting is already a
separate direct API source, not a GSC Wizard dependency. An enabled Admin API does
not imply the Analytics Data API is enabled; check each response independently.

Primary contracts: Google Analytics Admin API properties/create and dataStreams/create;
EnhancedMeasurementSettings; GoogleSignalsSettings; DataRetentionSettings;
DataRedactionSettings. The 14 April 2026 retention schema includes both event and
user retention. See Google's official Admin API REST reference. Unit tests use
synthetic resources and do not send Google or payment requests.
