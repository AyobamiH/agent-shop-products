# Cloudflare acceptance deployment

## Purpose

The first public deployment is an acceptance origin, not the final brand/domain decision.

- Worker: `agent-shop`
- Acceptance origin: `https://agent-shop.woeinvests.workers.dev`
- Production custom-domain candidate after acceptance: `https://agents.proofandstate.com`
- Final brand: undecided

The acceptance origin proves that the GitHub-owned frontend works outside CI and that Cloudflare does not block search/AI discovery.

## Reused estate pattern

This follows the existing portfolio convention: GitHub is source of truth, the frontend builds to a Cloudflare Worker plus Assets, Wrangler performs deployment, and an outside-in readback gate determines whether deployment is accepted.

No D1, KV, Queues, Durable Objects, Workers AI, Vectorize or Containers are required for this phase.

## Discovery policy

`robots.txt` explicitly allows major documented AI/search agents, including OpenAI, Anthropic, Perplexity, Google, Microsoft/Bing and Apple agents. It also retains `User-agent: * / Allow: /` so other and future LLM/search crawlers are not accidentally excluded.

Named rules are an auditable statement of intent, not a claim that every LLM vendor has a unique crawler or that robots directives guarantee indexing.

## Required GitHub secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Secrets stay in GitHub/Cloudflare and are never committed.

## Acceptance gate

After Wrangler deploys, `scripts/verify-deployed-surface.mjs` checks:

- root and `/agents`;
- `/catalog.json`, `/agents.txt`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`;
- every product detail page and raw Markdown record;
- canonical-origin consistency;
- all current skill/prompt records;
- retired Audiogram 404s;
- no raw prompt/skill payload markers;
- representative crawler user agents receive HTTP 200 rather than a Cloudflare/application block.

Only after this acceptance origin passes should a custom production domain be bound.
