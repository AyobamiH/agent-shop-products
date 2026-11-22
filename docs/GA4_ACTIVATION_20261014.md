# Agent Shop consent-bound GA4 activation — 14 October 2026

## Actual owner and Google resources

The saved owner consent is valid. Direct calls now verify all three Google APIs:
Analytics Admin, Analytics Data and Search Console. No GSC Wizard subscription,
connector token or second sign-in is required. The original Post-Once document/
publishing credential remains untouched.

The dedicated **Agent Shop — Proof & State** property is `properties/559055643`,
under the existing business Analytics account. Its single **Agent Shop website**
stream is `16129921164`, measurement ID **G-9LH3DJYS4B**, default URI exactly
`https://agents.proofandstate.com`. These IDs are observed Google resources, not
secrets or invented placeholders. The website uses the reviewed configuration file,
not an environment-variable bypass.

Direct readback confirms all enhanced-measurement switches off, Google Signals
disabled, event/user retention TWO_MONTHS without resetting on new activity,
email/query redaction enabled, no Google Ads links, and six event-scoped dimensions.
Google lowercases case-insensitive redaction keys; the verifier compares their
normalised sets rather than creating another stream or falsely failing a correct
setting. Its regression test models the actual normalisation. The original private
journal/plan hash is retained and no duplicate property or stream was created.

## Consent, public data and deployment boundary

Consent version **2026-10-14.2** invalidates any pre-activation preference. The initial
page has no Google SDK, analytics cookies or denied-consent pings. Allow and Reject
remain equally accessible. Only explicit, valid consent on the exact production
origin and a permitted public URL can start measurement. Preview/localhost pages
do not invite consent or send Google data. Private completion/API paths, unknown
URLs and unrecognised query strings stay excluded, including after earlier consent.

Withdrawal disables collection and removes only Shop-prefixed analytics cookies;
necessary order recovery storage is unchanged. Configuration availability, a loaded
SDK, a collected event, a qualified enquiry and a paid order are distinct states.
The outside-in verifier now reports `analyticsConfigured` and
`analyticsRequiresConsent`, not the misleading claim that an SSR read establishes
an active visitor session. Commerce remains fail-closed and no payment code,
purchase policy version, seller address or shared tax setting changes here.

## Operator diagnostics are not acquisition

The bounded local session preference `agent-shop:analytics-diagnostic=operator`
changes only the custom event name to `agent_shop_diagnostic`, with a fixed
operator-acceptance marker and the original public event type. It is not accepted
from a URL, does not bypass consent and grants no account or repository authority.
Normal events remain `page_view`, `select_capability`, `quote_click`.

Native historical/realtime business reports explicitly include only those three
normal event names. `realtime-report --diagnostic` explicitly selects the diagnostic
name. Thus test views/selections/quote clicks are not presented as business funnel
counts. Generic Google-interface totals may still contain operator sessions; do not
present them as external demand. Built-in debug/internal flags are not required for
this reportable diagnostic: those flags can be excluded by provider-side filters.
No unverified claim is made about the property's data-filter configuration.

Realtime uses the directly verified streamId/eventName/eventCount combination;
adding activeUsers to that combination was rejected by the live provider. No user
or session total is inferred from the event count. Historical reporting retains
its separately scoped date and host/stream filters. A successful collection HTTP
response is transport evidence only: Google reporting readback is separate.

## Verification performed and required

Unit contracts preserve disabled/malformed configuration cases alongside the real
stream binding. The browser suite serves the actual compiled app under its canonical
origin with Google intercepted; it proves initial denial, explicit grant/reject,
withdrawal, private-URL exclusions, old-consent expiry, storage failure, bounded
selection/quote events and separate diagnostics. CI uses pointer activation. The
same suite supports genuine keyboard activation for accessibility and for an owner
host whose browser frame scheduler is unavailable; it never sets consent directly.
A local WSL check showed requestAnimationFrame absent even on a static test document,
so local functional acceptance used focus/Enter rather than forced clicks or weakened
privacy assertions. CI retains normal pointer checks.

A separately authorised private browser acceptance script uses real Google only
for operator diagnostic events. It validates the stream, allowed event name and
query-free public location before allowing requests, records only non-sensitive
fields and response statuses, and tests withdrawal. It does not submit a quote,
create a sale, copy browser identifiers to reports or alter the running publishing
pipeline. Candidate diagnostics are labelled separately from production checks.

Exact-head PR/main CI, the guarded scoped Worker release, independent production
readback and Google reporting observations are recorded in #53. Do not call this
source deployed merely from this document. #53 remains open for the genuine
external discovery-to-qualified-enquiry experiment; #25 retains its actual legal,
tax and specifically authorised real-money fulfilment gates.
