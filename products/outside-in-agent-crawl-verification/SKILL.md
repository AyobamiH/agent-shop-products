---
name: outside-in-agent-crawl-verification
description: Use after deployment to prove a public agent/search surface from outside the runtime. Checks routing, canonical origin, machine endpoints, crawler user agents, payload boundaries and provider discovery state separately.
---

# Outside-In Agent Crawl Verification

A successful deploy command is not public acceptance.

Verify from the same unauthenticated boundary that a crawler or direct agent will use.

## Freeze the candidate

Record:

- exact deployed source/artifact identity;
- expected canonical origin;
- expected product/capability count;
- route inventory;
- retired/private routes that must remain unavailable.

Do not begin with provider dashboards. First prove the public surface itself.

## Read back core public routes

Fetch:

- root;
- primary agent guide;
- catalogue/list page;
- machine JSON;
- agent/LLM text surfaces;
- robots;
- sitemap;
- every capability detail page;
- every stable raw metadata route.

Require expected HTTP status and body identity. Use bounded retries only for documented DNS/edge propagation.

## Verify canonical origin

Check that canonical links, JSON-LD URLs, sitemap entries, robots sitemap line and machine-record links all use the promoted origin.

A route being reachable on an old workers.dev/preview host does not prove canonical promotion.

## Exercise crawler identities

Send read-only requests with representative documented user-agent strings for the providers you intend to allow.

Also test the wildcard public policy when appropriate.

The purpose is to catch application/edge blocking. Passing this check does not prove the provider will ingest or index the content.

## Verify inventory and privacy

For each canonical capability:

- detail page exists;
- machine record exists;
- public type/category matches;
- no forbidden payload markers appear;
- no invented commerce fields appear;
- sitemap contains the stable URL.

Require retired routes to return the intended 404/410/redirect state.

## Separate provider discovery

After the public surface passes, inspect provider state independently:

```text
crawlable
submitted
provider accepted submission
provider downloaded sitemap
provider knows URL
provider crawled URL
provider indexed URL
provider surfaced URL
```

Do not collapse those states.

If Google says "URL is unknown", record exactly that. It is different from blocked, noindex or fetch failure.

If IndexNow returns 202 pending key validation, do not call it delivered. Verify the public key file and resubmit/read back until provider acceptance is unambiguous.

## Promotion rule

Promote only when the required acceptance layer is green.

For a public launch this normally means outside-in readback. Indexing may remain a monitored provider-controlled outcome after launch if that was the declared boundary.

## Report

Return:

```text
deployed identity:
canonical origin:
route acceptance:
machine inventory:
crawler checks:
payload/privacy:
retired routes:
provider submission:
provider crawl/index state:
remaining unknowns:
```
