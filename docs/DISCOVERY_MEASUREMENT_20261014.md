# Discovery measurement and acquisition — 14 October 2026

## Authority and current boundary

The owner authorised P1 implementation in issue #53. Root DEC-018 and frontend DEC-020 govern this slice. It does not alter signed Checkout, webhook settlement, D1 entitlement, private R2 delivery, purchase policy versions or merchant settings. Browser acceptance exposed an early-click recovery disclosure race; the native details element now uses explicit React state so a hydration-replayed click does not close the form again. Order access and recovery-authorisation semantics are unchanged. The existing sandbox acceptance is reused, not repeated as a real transaction. A request remains distinct from a quote, payment and verified delivery.

The public configuration `frontend/src/lib/analytics/configuration.json` ships disabled, with no invented property, stream or measurement ID. The connected GSC Wizard reporting account lists seven readable properties; none establishes a verified Agent Shop stream or Proof & State association. Reporting access does not prove Analytics Admin editor access. No unrelated brand property is reused. Site sessions and referral conversions are **unknown**, not zero. This configuration is not permission to enable live checkout.

## Implemented measurement contract

`page_view` describes an allowed public page; `select_capability` describes a real canonical external capability selected from its browser; `quote_click` describes a click on one of the two existing bounded Tail Wagging contact destinations. These are not lead, purchase or fulfilment events. A public capability ID is metadata, never an account or customer ID.

The boundary builds an explicit allowlisted payload. It does not copy the DOM text, full URL, query, fragment, document referrer, email, form data, search terms, order ID, claim token or receipt. Private completion, API, unknown-product and unknown-capability routes are excluded entirely. Unrecognised query strings are excluded rather than silently forwarded. Only complete fixed campaigns are admitted:

- `utm_source`: `linkedin`, `threads`, `reddit`, `github`, `proofandstate`, `tailwagging`.
- `utm_medium`: `social` or `referral`.
- `utm_campaign`: `agent_shop_evidence`, `agent_shop_integration`, `agent_shop_private_kit`.

Only the fixed label values enter explicit discovery dimensions. All URLs in event parameters are canonical and query-free. Unknown/direct traffic is labelled unattributed; this first implementation intentionally does not infer organic referrers or join identities across sites. Campaign labels are unsigned attribution hints, not trusted business evidence. Consent and URL exclusions mean GA4 coverage will be partial even after activation.

## Consent and browser safety

Use basic prior-consent gating for this deployment, not an assumed analytics exemption. The Google SDK is absent until explicit consent, valid reviewed configuration and a permitted current page. No denied-consent or cookieless ping is sent. Advertising features, Google Signals and automatic enhanced measurement must be disabled. There is no cross-domain identity linking.

Preferences are versioned, local and expire after 180 days. Invalid, stale, future or unreadable preferences deny collection. Allow and Reject have equal prominence. Withdrawal disables the measurement ID before clearing queued events and only Agent Shop-prefixed analytics cookies; necessary order storage is untouched. A successful withdrawal reloads the page to remove the previously loaded SDK. Failed preference storage remains denied in memory and cannot resurrect a previously saved grant. Another tab's preference change is observed. The current location is revalidated on navigation and before every custom event; capability clicks are captured before the router changes location. Route changes preserve a consented identifier instead of manufacturing a new session on each page.

The new `/privacy` notice is separate from versioned purchase terms, explains Google Fonts/Cloudflare separately from analytics, and links to the existing purchase privacy notice. When configuration is off, analytics runtime/domain code is lazy and no Google SDK or consent solicitation is loaded. Settings clearly report that analytics is off.

## Required activation evidence — not yet complete

Use an owner-authorised Google Analytics Administrator/Editor session or the official Admin API with supported `analytics.edit` authority. Read existing data streams before creating anything. Verify the intended owner's account and the exact web origin `https://agents.proofandstate.com`; do not rename/reuse a different brand's stream solely because it is readable.

Record the actual property resource, stream ID, G- measurement ID and timestamp from independent readback. Disable every enhanced-measurement automatic event, including page-history, site search, forms, outbound clicks and downloads. Disable advertising/Signals and unwanted Google-tag destinations or cross-domain linking. Set two-month event retention, verify data-sharing/processor terms and the applicable international-transfer arrangement, and register event-scoped custom dimensions for the bounded discovery labels needed by reporting. No PII dimension is permitted.

Link the verified property in the owner's GSC Wizard/GA4 integration for `sc-domain:proofandstate.com`, and verify host filtering to Agent Shop rather than reporting the whole estate as Shop traffic. Do not treat the mere presence of a new G- ID as end-to-end acceptance.

Update the single configuration file with reviewed evidence through a PR; do not add an environment-variable bypass. Run the unit and browser acceptance suites. The current fail-closed assertions deliberately require revision during an approved activation, not removal of safety tests. Inspect a consented operator visit separately from genuine visitors, read the matching event from the correct property, and record the stream/host/event evidence. Do not import synthetic diagnostics as business results. A live event is still not an enquiry, accepted quote or order.

## Evidence funnel

| State | Authority | What the 14 October checkpoint actually establishes |
| --- | --- | --- |
| Indexed | Google URL Inspection, scoped URL | `/integration-services` indexed; private-kit and licence pages last reported unknown. Whole domain tracker: 36/61; not a Shop-only total. |
| Impression | Settled GSC page report | `/shop`: 1 impression for the settled 28 days through 11 October. |
| Search click | Same GSC page report | `/shop`: 0 clicks in that bounded report, not proof of zero all-channel traffic. |
| Website session / quote click | Verified GA4 stream + consented event | Unknown; stream not activated. |
| Qualified enquiry | Actual accepted provider enquiry, then qualification evidence | Unknown; a contact-link click or unsigned UTM cannot establish qualification. |
| Accepted quote | Explicitly accepted versioned provider quote | No buyer-specific completion evidence established by this slice. |
| Paid order | Signed payment + server reconciliation for the specific order | No verified external paid buyer established; live checkout remains closed. |
| Fulfilled deliverable | Exact entitled artifact/accepted revision + independent buyer-specific evidence | Sandbox acceptance exists separately; no invented external buyer or revenue. |

Issue #53 owns the acquisition experiment through 28 October. Preserve date windows and scopes. Do not sum unlike states or substitute indexed counts for demand. Tail Wagging referral persistence was merged in its #115; its #116 fulfilment implementation is a separate active workstream and is not duplicated here.

## Acquisition changes

Existing `/solutions` now contains an original, explicit pull-request acceptance checklist. Existing `/integration-services` explains how one reproducible webhook fault becomes a bounded quote and separates investigation from repair. These are illustrative scoping examples, not customer stories. The public README links the guide, quote-first service and distinct planned £9 kit using the bounded campaigns above, and replaces stale copied deployment/count claims with canonical evidence links. No thin pages for the 990 third-party names are created; their noindex and source boundaries remain intact.

## Verification and release

Run `bun run test`, `bunx tsc --noEmit`, `bun run lint`, production build and the existing browser suite. `e2e/discovery_analytics.py` compiles a test-only harness into a temporary directory, intercepts every remote request, and exercises the real transport with a fictitious test ID. It cannot send Google traffic or conduct a payment. It also inspects the actual inactive application at phone/desktop widths, its consent settings and crawlable content. The harness is not imported by production routes or included as a public asset.

The exact reviewed main must pass push CI before `node scripts/owner-local-release.mjs` can build, upload and promote it using the established scoped Cloudflare credential. Do not replace this with a dirty-worktree deployment. Record the PR, source SHA, CI run, Worker version, public surface acceptance and privacy/content readback in #53 and cross-reference #25. Keep both issues open while their independent gates remain unmet.

## Primary implementation sources

- ICO storage/access guidance and exceptions: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/
- Google basic versus advanced consent: https://developers.google.com/tag-platform/security/concepts/consent-mode
- Google GA4 configuration: https://developers.google.com/analytics/devguides/collection/ga4/reference/config
- Google Analytics Admin API: https://developers.google.com/analytics/devguides/config/admin/v1/rest

These sources inform the implementation. They do not settle the seller's outstanding factual tax or disclosure decisions, and no shared tax setting is changed by this release.
