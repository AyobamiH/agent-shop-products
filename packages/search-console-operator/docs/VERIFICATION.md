# M1 verification record

Verified on 19 October 2026. This record covers the independent twelve-tool Search Console reporting package. It does not establish GSC Wizard numerical parity, a hosted release, or support for the remaining 119 reference tools.

## Automated acceptance

The complete `npm test` suite passed on the owner's Linux/WSL computer with Node 24.18.0: **74 tests passed, 0 failed, 0 skipped**. The final run inherited a restrictive `077` umask. The unsafe-directory fixture sets its intended test permissions explicitly, so it tests the same boundary regardless of the user's file-creation defaults.

| Area | Evidence exercised |
| --- | --- |
| Dates and calculations | Pacific date boundaries, DST, leap days, equal-length comparisons, ratio-of-sums CTR, impression-weighted positions, zero baselines and missing values. |
| Provider collection | Ordered dimensions, exact filters, 1,000-row pages, 50,000-row synthetic scans, row/byte bounds, repeated keys, changing aggregation and initial/late cancellation. |
| Authentication | Read-only endpoint enforcement, minimal fresh consent, explicit existing-grant selection, PKCE/state, owner identity, single-flight refresh, expiry, token rotation and revoked grants. |
| Local callback | Real loopback requests, malformed targets, Host/Origin checks, cancellation, synthetic grant exchange and failure to save the final status receipt. |
| Persistence | Concurrent independent writers, immutable publication, restarts, tampering, permissions, symlinks, FIFO refusal, bounded listing and deterministic replay. |
| Reporting integration | All twelve tools through the actual provider/service/store, independent totals, missing-versus-zero results, partial/failed sections, exact page/query matching and unknown aggregation coverage. |
| Transport | Real SDK stdio processes, current protocol handler round trips, strict schemas, twelve-tool discovery, accurate snapshot-write annotations and bounded errors. |

Unrecognised exception codes and messages cannot enter retained collection reasons. The tests include uppercase secret markers as well as ordinary exception text. Test identities, credentials, sites and provider responses are synthetic and remain in test files only.

## Authorised live Google acceptance

The explicit existing-owner adapter connected directly to Google. The live runner completed at **2026-10-19 12:24:24 UTC** against one owned domain property, using a 28-day reporting window from 19 September to 16 October 2026.

- All **12 advertised tools** returned complete results.
- Both period and daily position-distribution modes were exercised, producing 13 calls in total.
- **10 reports** were saved as immutable snapshots.
- A separate direct Search Analytics aggregate request matched the service's clicks, impressions, CTR and position.
- **10 of 10 reports** replayed identically through a newly constructed service without selecting a credential directory.
- No provider failure was reported by the live runner.

The property identity, account information, metrics, queries, URLs and snapshot identifiers remain in the owner's private state directory. They are excluded from this public source record. The live sample was a low-volume property; large scans and failure conditions were exercised using controlled synthetic responses.

The reusable opt-in runner is [scripts/verify-live.mjs](../scripts/verify-live.mjs). It is excluded from ordinary tests and CI. Its private `live-acceptance.json` distinguishes passed, failed and limited evidence, and records unexercised page/query tools if a property returns no suitable rows.

## Dependency and repository checks

A current-registry `npm audit --json` returned **zero known advisories across 14 installed dependencies**. Lockfile integrity entries and installed licence files were checked. Dependencies were installed with lifecycle scripts disabled. The package dry run contained source, documentation and synthetic tests, with no credential files, retained reports or bundled dependencies.

`git diff --check` passed. The change adds the isolated package and its path-filtered CI workflow. Existing catalogue, commerce, production and direct Google operator source remains outside this change.

## Remaining evidence before public release

The fresh Desktop OAuth flow was exercised with a local listener and synthetic Google responses. Live acceptance reused the already-authorised independent owner grant; it did not run a new Google consent ceremony for another user. A fresh-account onboarding trial, public OAuth configuration, package licensing/notices and distribution packaging remain release work. Hosted operation, broader account scale, GA4, historical warehousing and the other reference workflows are outside M1.
