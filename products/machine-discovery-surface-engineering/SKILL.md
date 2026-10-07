---
name: machine-discovery-surface-engineering
description: Use when making a public site discoverable to search engines, LLM crawlers and direct agents without inventing metadata or exposing private payloads. Covers canonical HTML, robots, sitemap, machine JSON, agent guidance and stable metadata routes.
---

# Machine-Discovery Surface Engineering

Treat machine discoverability as an engineering contract, not keyword stuffing.

## Establish one public authority

Choose a canonical origin and one authoritative public metadata source.

Derive every public projection from it:

- HTML;
- structured data;
- sitemap;
- machine JSON;
- agent/LLM guidance;
- per-capability metadata.

Do not maintain independent product lists that can drift.

## Required public surfaces

For a public capability site, provide:

1. canonical, server-readable HTML;
2. `robots.txt`;
3. `sitemap.xml`;
4. a machine JSON projection or equivalent;
5. an agent-discovery document/route;
6. stable per-capability metadata URLs.

Useful optional projections include `llms.txt`, `agents.txt` and metadata-only Markdown.

Present optional text files as site-specific convenience surfaces unless an actual standard says otherwise.

## Crawler policy

When public crawling is intended:

- explicitly allow documented major crawlers where useful for auditability;
- retain an appropriate wildcard rule so unknown/future crawlers are not accidentally excluded;
- keep sitemap location on the same canonical-origin contract.

Named crawler rules do not prove the provider will index, retrieve, train on or recommend the content.

## Separate public metadata from payload

Expose enough for an agent to decide whether a capability fits:

- name;
- summary;
- problem;
- outcomes;
- requirements;
- boundaries;
- tags;
- source/provenance pointer where safe;
- stable detail/raw metadata URL.

Do not expose full private prompt/skill bodies merely to improve discovery.

## Keep structured data truthful

Choose schema that matches the page's actual state.

If a capability is not currently sold as a commerce product, do not add fake `Offer`, price, availability, rating or review nodes to satisfy a validator.

Prefer a truthful non-commerce type when appropriate.

## Canonical-origin consistency

Use one origin input to generate:

- canonical link;
- Open Graph URL;
- JSON-LD URLs;
- sitemap entries;
- robots sitemap line;
- machine-record links;
- generated metadata links.

Fail CI when those surfaces disagree.

## Agent-first navigation

Make the important discovery graph available without client-only interaction.

Link machine surfaces from an agent guide and link capability records back to stable HTML detail routes.

A direct agent should not need to scrape presentation markup to find the inventory.

## Acceptance

Before calling discovery ready, verify:

- every canonical route is 200 and indexable;
- missing/retired routes remain fenced;
- machine routes have appropriate content types;
- product/capability counts match the canonical source;
- no private payload markers leak;
- structured data contains no invented commerce claims;
- crawler user agents are not blocked by application or edge rules.

Keep provider indexing state separate from crawlability.
