---
name: auditable-indexing-state-reconciliation
description: Use when a sitemap is valid but Google URL Inspection still shows unknown, discovered or non-indexed pages, or when monitoring reports inconsistent classifications.
---

# Auditable indexing-state reconciliation

Separate four independent assertions: a page exists on the public origin, a sitemap references it, Google knows it, and Google has chosen to index it. None implies the next.

## Establish a stable observation
1. Identify the owner-authorised Search Console property, canonical public origin and current exact sitemap URL set.
2. Fetch the sitemap and each URL with bounded unauthenticated requests. Record status, final URL, canonical, robots directive and response time without assuming user-agent equivalence to Google.
3. Read official Google URL Inspection **indexed-version** results for each allowed URL, bounded by the inspection quota. Save each row's verdict, coverage label, last crawl and canonical selection. Provider failure is a separate error state.
4. Store a dated, owner-private, immutable observation. Reuse an existing complete same-day observation instead of issuing the same provider reads.

## Reconcile individual rows before totals
Normalize coverage-label Unicode before matching, including Google's en dash in “Discovered – currently not indexed”. Do not silently classify it as zero because an ASCII-hyphen regex missed it.

For each unique URL classify into: **indexed**, **discovered-but-not-indexed**, **unknown**, **other-not-indexed**, or **inspection-error**. Assert that their counts sum to the number of rows, and that inspected URLs match the sitemap set. Keep missing/failed inspections outside the denominator when reporting an inspected-URL index rate.

Compute transitions by exact URL and label them precisely:
- **newly indexed** or **lost indexing**: relevant provider state changes;
- **unknown ↔ discovered**: provider classification movement, not an indexed-page gain;
- **public fetch/canonical/robots regression**: a technical defect only when evidenced;
- **no difference**: retain history without noisy re-submission.

## Fix what is actually broken
Check internal HTML links and source-to-public catalogue parity before suggesting a code fix. Genuine 404, redirect, noindex, canonical mismatch and inaccessible linked HTML deserve repair. A fully crawlable original page can still be omitted by Google; treat that as a separate content/discovery investigation, not a fabricated routing defect.

## Acceptance
- The snapshot is date-stamped, append-only and includes source and time.
- Coverage counts and URL sets reconcile, including Unicode-dash fixtures and an explicit API-error fixture.
- A repeated same-day run performs no duplicate inspections.
- No re-submission or page rewrite occurs merely because a provider still says “unknown”.
- Publication, crawling, indexing, search impressions and customer value remain separately measured.

**Evidence boundary:** The reviewed 2 November 2026 Agent Shop run inspected 48 sitemap URLs with 23 indexed, 10 discovered-not-indexed and 15 unknown; the prior observation's false-zero discovered counter came from an ASCII-hyphen-only parser. These are dated owner observations, not a guaranteed indexing improvement or a published Google log.
