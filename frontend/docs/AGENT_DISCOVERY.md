# Agent discovery and crawl contract

## Audience

The public product is for autonomous and tool-using agents. Human-readable pages exist so operators can inspect the same records, not as a separate consumer-shopping experience.

## Canonical discovery

The authoritative public machine surface is `/catalog.json`.

Supporting discovery surfaces:

- `/agents` — primary HTML documentation
- `/agents.txt` — site-specific text discovery map
- `/llms.txt` — convenience language-model index; not claimed as a universal standard
- `/raw/products/{slug}.md` — metadata-only per-capability Markdown
- `/sitemap.xml` — indexable original HTML URLs only: the eight collection/service pages and canonical owned product pages. Machine JSON/text/Markdown and names-only external detail pages remain accessible through discovery links, but are excluded from the search sitemap.
- `/robots.txt` — broad public crawl permission

All derive from the same bundled projection, which is synced from the repository-root canonical catalogue before builds.

## Crawling and indexing

Public canonical HTML routes use `index, follow`, unique titles/descriptions and canonical links. Product pages emit truthful Product and BreadcrumbList JSON-LD. Collection routes emit WebSite, CollectionPage and ItemList data where appropriate.

`VITE_SITE_ORIGIN` is the one deployment-origin setting. Canonical links, JSON-LD, sitemap and robots derive from it.

404/missing-product responses may be noindex. Canonical public routes must not be.

## Payload boundary

Public discovery may expose metadata, summaries, problems, outcomes, requirements, boundaries, tags and source pointers. It must not expose complete PROMPT.md or SKILL.md payload bodies, secrets, private evidence or invented commerce claims.

## Commercial discovery and indexed content

The external capability registry contains 990 **advertised names**, not owned, verified or licensed products. Its individual names-only detail pages are accessible via GET and marked `noindex, follow` until original, verified, useful editorial value warrants search indexing. The collection index and the original source-backed product pages remain indexable.

A real quote-first integration introduction is published at `/integration-services`, linking to Tail Wagging's independently governed service catalogue and work-order intake. It has no Agent Shop checkout or claimed price. A work-order receipt is not acceptance, payment, repository authority or completion. Publicly readable source does not establish resale or redistribution rights.

## Future CLI

The planned agent transaction interface remains CLI-first: search, show, sample, buy, install and update. Transaction and installation commands are future work. MCP remains out of scope.


## Search-engine notification

The production build publishes a public IndexNow verification file at:

`https://agents.proofandstate.com/agents-proofandstate-indexnow-20261007.txt`

This key is intentionally public and exists only to prove control of the production host to IndexNow-participating search engines. IndexNow notification supplements the canonical sitemap; it does not replace Google Search Console or guarantee indexing.

## Separate human-subcontracting route

The source-backed `agent-subcontracting-commercial-handoff` record may link to the independently operated provider [Tail Wagging Website Design Factory Northampton](https://tailwaggingwebdesign.com/agents/) and its public machine service contract at `/agent-services.json`. This is a distinct business/service surface, not an Agent Shop purchase or installation backend.

The home page and relevant capability page offer inspectable navigation; `agents.txt` names the independent service URL. Other product records are not silently made available for purchase or delegated to that provider. The live provider contract governs current intake availability, quoting, payments and allowed actions; no agent acquires any operational permission by following these links. Google indexing and referred customer outcomes remain separately measured.
# External registry and agentic coding bugs

`/capabilities.json` returns every external listing by default. Valid `q`, `kind`, `provider` and explicit `page` filters select deterministic 40-record pages. `/capabilities/{id}` resolves stable IDs; `/capability-brief.json?id={id}` returns original integration deliverables and a deliberately incomplete provider handoff template. The buyer must supply contact, outcome, runtime, account access and authority, verify the live contract, and obtain accepted scope and terms. `/coding-bugs.json` carries scoped historical/candidate evidence and regression checks. HTML routes are `/capabilities` and `/coding-bugs`; every capability detail is in the sitemap. These surfaces add no Shop MCP, transaction execution or installation permissions.
