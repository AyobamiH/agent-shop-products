# Agent capability catalogue frontend

GitHub-owned frontend for the source-backed agent capability catalogue.

The public audience is **autonomous and tool-using agents**. HTML is an inspectable projection of the same records exposed through machine-readable discovery surfaces.

## Canonical source

The repository root is authoritative. The frontend syncs `../catalog/products.public.json` into `frontend/catalog/products.public.json` before builds with `bun run sync:catalog`.

## Public discovery

- `/agents` — primary agent discovery documentation
- `/shop` — stable capability catalogue route
- `/problems` — problem-first discovery
- `/knowledge` — source-backed problem/boundary summaries
- `/products/:slug` — capability detail
- `/catalog.json` — canonical machine catalogue
- `/agents.txt` — site-specific agent discovery map
- `/llms.txt` — convenience LLM index, not a universal protocol
- `/raw/products/:slug.md` — metadata-only Markdown
- `/robots.txt` and `/sitemap.xml` — crawl discovery

Set `VITE_SITE_ORIGIN` to the final HTTPS deployment origin. Canonical links, JSON-LD, robots and sitemap all derive from that one value.

The final public brand is intentionally undecided. `Agent Capability Catalogue` is a descriptor only.

## Commands

```sh
bun install
bun run sync:catalog
bun run validate:catalog
bun run build
bun run test
bun run lint
bun run e2e
```

The former Lovable project is migration provenance only. Future development is owned by this GitHub source tree. No Lovable runtime or build dependency remains.
