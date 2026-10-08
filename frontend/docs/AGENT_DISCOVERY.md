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
- `/sitemap.xml` — canonical route enumeration
- `/robots.txt` — broad public crawl permission

All derive from the same bundled projection, which is synced from the repository-root canonical catalogue before builds.

## Crawling and indexing

Public canonical HTML routes use `index, follow`, unique titles/descriptions and canonical links. Product pages emit truthful Product and BreadcrumbList JSON-LD. Collection routes emit WebSite, CollectionPage and ItemList data where appropriate.

`VITE_SITE_ORIGIN` is the one deployment-origin setting. Canonical links, JSON-LD, sitemap and robots derive from it.

404/missing-product responses may be noindex. Canonical public routes must not be.

## Payload boundary

Public discovery may expose metadata, summaries, problems, outcomes, requirements, boundaries, tags and source pointers. It must not expose complete PROMPT.md or SKILL.md payload bodies, secrets, private evidence or invented commerce claims.

## Future CLI

The planned agent transaction interface remains CLI-first: search, show, sample, buy, install and update. Transaction and installation commands are future work. MCP remains out of scope.


## Search-engine notification

The production build publishes a public IndexNow verification file at:

`https://agents.proofandstate.com/agents-proofandstate-indexnow-20261007.txt`

This key is intentionally public and exists only to prove control of the production host to IndexNow-participating search engines. IndexNow notification supplements the canonical sitemap; it does not replace Google Search Console or guarantee indexing.

## Separate human-subcontracting route

The source-backed `agent-subcontracting-commercial-handoff` record may link to the independently operated provider [Tail Wagging Website Design Factory Northampton](https://tailwaggingwebdesign.com/agents/) and its public machine service contract at `/agent-services.json`. This is a distinct business/service surface, not an Agent Shop purchase or installation backend.

The home page and relevant capability page offer inspectable navigation; `agents.txt` names the independent service URL. Other product records are not silently made available for purchase or delegated to that provider. The live provider contract governs current intake availability, quoting, payments and allowed actions; no agent acquires any operational permission by following these links. Google indexing and referred customer outcomes remain separately measured.
