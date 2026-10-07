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
