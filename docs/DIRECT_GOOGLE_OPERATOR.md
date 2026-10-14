# Direct Google Analytics and Search Console operator

## Owner-authorised boundary

On 14 October 2026 the owner requested direct Google access rather than dependence
on GSC Wizard. `scripts/google-operator.mjs` is the owner-local operator entry point.
It uses Google's OAuth, Analytics Admin/Data and Search Console APIs directly.
There is no GSC Wizard endpoint, subscription check, scraped session, copied vendor
token or new public MCP server. This does not change the Shop's CLI-first contract.

The current executable commands establish authorisation, inspect the actual owned
accounts/streams/privacy settings and retrieve scoped reports. They do not create,
update or delete a Google property, enable website collection, change billing,
charge a customer or grant repository/provider execution authority. The requested
Analytics edit permission prepares the separately reviewed, specifically targeted
stream-provisioning step after actual account inventory is available.

## Existing desktop registration, independent saved grant

Use the owner's existing Google **Desktop app** OAuth JSON. A web/mobile client is
rejected. The normal browser displays Google's actual consent page, then redirects
to a listener bound only to `127.0.0.1`. Each run uses independent random state and
an S256 PKCE verifier. No callback code, access token, refresh token or client secret
is printed. The connection link expires after 30 minutes or successful handling.
The callback rejects mismatched/duplicate parameters, validates the signed-in
owner through Google's authenticated user-info endpoint and requires the requested
scopes. The expected owner email is supplied privately at invocation, not committed.

The scopes are OpenID/email identity, `analytics.readonly`, `analytics.edit`, and
`webmasters.readonly`. No Drive/Docs, Gmail, Cloud IAM, user-management, advertising
or billing permission is requested. Google's Analytics edit scope is broader than
one stream; account/property roles still control the operations Google allows.
Authorising an application does not grant the Google user a missing Editor role.

This reuses an **application registration**, not an existing Post-Once refresh
token. New authority is stored separately under `~/.config/agent-shop-google/`.
The original document/publishing credential is neither read nor written by this
operator. Reusing the registration means this is not a separate Cloud project;
revoking the entire Google application's account access could affect its other
consents. Do not revoke or rotate shared registration credentials as routine cleanup.

The state directory is owner-only (0700); credential/status/report files are 0600,
atomically replaced and fsynced. Credential reads reject symbolic-link files and
unsafe ownership/modes. Authorisation and token refresh have separate exclusive
locks. Unresolved/stale locks are not overwritten. If a host abruptly stops, inspect
its lock PID and prove the old operation ended before any manual lock recovery.

## Commands

Run with Node 24 or newer, from a reviewed checkout:

```sh
node scripts/google-operator.mjs help
node scripts/google-operator.mjs status
node scripts/google-operator.mjs auth --client-file "$HOME/google-desktop-client.json" --expected-email "$GOOGLE_OWNER_EMAIL"
node scripts/google-operator.mjs inventory
node scripts/google-operator.mjs inspect-stream --property properties/ACTUAL_ID --stream ACTUAL_ID
node scripts/google-operator.mjs search-report --start 2026-09-14 --end 2026-10-11
node scripts/google-operator.mjs analytics-report --property properties/ACTUAL_ID --stream ACTUAL_ID --start 2026-09-14 --end 2026-10-11
node scripts/google-operator.mjs realtime-report --property properties/ACTUAL_ID --stream ACTUAL_ID
node scripts/google-operator.mjs inspect-url --url https://agents.proofandstate.com/private-kits
node scripts/google-operator.mjs sitemaps
```

`ACTUAL_ID` is deliberately not an invented account or stream. Replace it only with
an independently observed resource. No credential bytes belong in command arguments,
GitHub comments, repository files, website bundles or chat messages. Set the owner
email locally or use the already supplied owner's account in the authorised session.
The browser opening the connection link must reach the operator's loopback listener;
for the existing WSL computer, use its normal desktop browser.

After a successful consent callback, the already running authorisation process saves
the grant and attempts one direct, read-only account/stream/Search Console inventory.
It does not provision or enable tracking automatically. Later commands refresh the
separate token and revalidate the same Google subject before calling fixed HTTPS
Google endpoints. Redirects and oversized responses are rejected; provider errors
are returned as bounded codes, without raw provider text or credential values.

## Reporting is not a commercial outcome

Search reports are scoped to `sc-domain:proofandstate.com` and the exact Agent Shop
hostname, request settled/final rows and record the requested dates. Google may omit
anonymised queries and returns top rows rather than guaranteeing all data. A zero-row
response is a scoped observation, not proof of zero website traffic. Raw query rows
are stored privately. Do not publish individual query data without a privacy review.

Analytics reports first retrieve the exact stream and require its default URI to
match `https://agents.proofandstate.com`. Standard reports filter both hostname and
stream ID. Realtime reports use the independently verified stream ID; realtime does
not expose the same dimensions as historical reporting. Consent coverage is partial;
operator diagnostics must not be presented as organic visitors or qualified demand.
Session counts overlap across page/event rows and must not be added as unique users.

URL Inspection is limited to public Shop URLs with no query or fragment; API/order
completion URLs are rejected. It reads Google's indexed-version information, not a
live indexing request. Sitemap reads select only the Agent Shop origin. Each report
records its source and observation time. Report commands save provider results in
the private state directory and print the evidence path rather than the raw rows.

## Admission and failure states

- `credentialPresent` is local file presence, not proof of current API access.
- `awaiting_google_consent` means the real owner approval has not completed.
- `connected` means the owner identity and required scopes were verified and saved;
  each API can still be unavailable independently.
- `GOOGLE_API_DISABLED_*` means enable that specific API in the existing Cloud
  project using its authorised owner. Analytics Admin, Analytics Data and Search
  Console are independent services. OAuth consent alone does not activate APIs.
- `GOOGLE_HTTP_403_*` is not zero data: inspect the Google property/account role or
  project access. Do not substitute another brand's stream.
- `GOOGLE_GRANT_EXPIRED_OR_REVOKED` requires a new owner consent flow, not repeated
  unattended retries or access through the third-party provider.

The website's `frontend/src/lib/analytics/configuration.json` stays disabled until
actual stream identity, privacy settings, consent behaviour and event ingestion have
separate acceptance. This operator does not edit it. Live checkout remains governed
by #25; the direct measurement experiment remains in #53. Google APIs remove the
GSC Wizard dependency, not Google's permission requirements or the seller's legal gates.

## Verification and primary references

`node --test scripts/*.node-check.mjs` includes this adapter's token/identity fixture,
private storage, callback/state, scope, pagination, host/date/report boundaries and a
real loopback listener tested without contacting Google. Existing release tests are
preserved. A local test is not actual Google consent or a verified GA4 event.

- https://developers.google.com/identity/protocols/oauth2/native-app
- https://developers.google.com/analytics/devguides/config/admin/v1/rest
- https://developers.google.com/analytics/devguides/reporting/data/v1
- https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-api-schema
- https://developers.google.com/webmaster-tools/v1/how-tos/authorizing
- https://developers.google.com/webmaster-tools/v1/searchanalytics/query
