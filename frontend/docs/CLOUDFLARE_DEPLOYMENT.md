# Cloudflare deployment

## Production topology

- Worker: `agent-shop`
- Acceptance/diagnostic origin: `https://agent-shop.woeinvests.workers.dev`
- Canonical public origin: `https://agents.proofandstate.com`
- Final product brand: undecided

The neutral `agents.proofandstate.com` hostname is intentionally independent of the eventual product name.

## Reused estate pattern

GitHub is the source of truth. The frontend builds to a Cloudflare Worker plus Workers Assets, Wrangler performs deployment, and an outside-in readback gate determines whether deployment is accepted.

No D1, KV, Queues, Durable Objects, Workers AI, Vectorize or Containers are required for this phase.

## workers.dev acceptance evidence

The first real Cloudflare acceptance deployed merged revision `9e766c957dc750459010f669bf4067bae71003ce` through the existing Cloudflare credential custody already used by DoneState.

Evidence run:

- DoneState bridge run: https://github.com/AyobamiH/donestate/actions/runs/37626738083
- Worker deployment: PASS
- `https://agent-shop.woeinvests.workers.dev/agents`: reachable
- root SSR routing: PASS after `run_worker_first=true`
- outside-in machine/crawler acceptance: PASS

The acceptance covered root, agent discovery, catalogue JSON, agent/LLM text surfaces, robots, sitemap, every product page, every metadata Markdown record, canonical-origin consistency, payload privacy, retired-product 404s and representative crawler user agents.

## Production acceptance evidence

Merged production revision `3390144799af39368a87b7827bfb4ca23cc4aca7` was deployed to the same `agent-shop` Worker and bound to the neutral custom domain.

Evidence run:

- DoneState bridge run: https://github.com/AyobamiH/donestate/actions/runs/37627383743
- Worker upload: PASS
- Static asset upload: 23 files
- Workers.dev route retained: `https://agent-shop.woeinvests.workers.dev`
- Custom domain bound: `https://agents.proofandstate.com`
- production DNS/edge reachability: PASS after bounded propagation
- outside-in result: `{"status":"PASS","origin":"https://agents.proofandstate.com","products":16,"crawlerAgentsChecked":10}`
- machine surfaces checked: `/catalog.json`, `/agents.txt`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`

This is the accepted production runtime for the current code slice.

## Discovery policy

`robots.txt` explicitly allows major documented AI/search agents, including OpenAI, Anthropic, Perplexity, Google, Microsoft/Bing and Apple agents. It also retains `User-agent: * / Allow: /` so other and future LLM/search crawlers are not accidentally excluded.

Named rules are an auditable statement of intent. They do not imply that every LLM vendor has a unique crawler, and robots directives do not guarantee indexing or model ingestion.

## Canonical origin contract

`VITE_SITE_ORIGIN` must equal the origin being promoted.

For production:

```text
https://agents.proofandstate.com
```

Canonical links, JSON-LD, `robots.txt`, `sitemap.xml`, catalogue URLs and generated Markdown detail links all derive from that value.

## Required GitHub secrets

The canonical deployment workflow expects:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Secrets stay in GitHub/Cloudflare and are never committed.

At the time of production acceptance, these secrets were not yet available in the `agent-shop-products` repository itself. Bounded one-off bridge workflows reused current DoneState Cloudflare secret custody for the live acceptance and were retired immediately afterwards.

The canonical deployment workflow is therefore manual and fails closed when repository-owned Cloudflare credentials are missing. It must not report a successful deployment when no deployment occurred.

## Acceptance gate

After every deployment, `scripts/verify-deployed-surface.mjs` checks:

- root and `/agents`;
- `/catalog.json`, `/agents.txt`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`;
- every product detail page and raw Markdown record;
- canonical-origin consistency;
- all current skill/prompt records;
- retired Audiogram 404s;
- no raw prompt/skill payload markers;
- representative crawler user agents receive HTTP 200 rather than a Cloudflare/application block.

A Wrangler success alone is not sufficient evidence of deployment acceptance.
