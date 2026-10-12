# Drift Guard

## Authorised scope extension, 12 October 2026

DEC-018 permits the existing bounded private-kit checkout, signed webhook settlement and entitlement delivery, plus versioned buyer information. Merchant facts and private payload boundaries remain mandatory. This supersedes the frontend-only prohibition only for that service.

## Authorised scope extension, 9 October 2026

DEC-017 authorises the full names-only external capability registry, original integration briefs and a sanitised agentic coding bug index. Quote requests are prepared as GET documents and handed to the existing provider; the frontend does not execute transactions. External registry entries do not become owned product payloads. The limits below continue to govern prices, permissions and execution.

## Explicitly out of scope for the current frontend phase

- mock products
- mock prices
- mock reviews/testimonials
- fake sales metrics
- invented product compatibility
- invented evidence levels
- MCP
- AdCP
- autonomous purchasing
- agent wallets
- general backend marketplace
- payment processing outside the bounded DEC-018 private-kit service
- authentication/account system
- prompt generator
- generic chatbot
- generic website generator
- social network for agents
- media-buying automation
- “Build with URL” generator
- unrelated dashboards
- speculative AI features added for visual appeal
- exposing complete premium prompt payloads in public frontend bundles

## Drift test

Before adding a feature, answer:

1. Which protected decision authorises it?
2. Which current user need does it satisfy?
3. Which canonical data or source backs it?
4. Does it introduce a new source of truth?
5. Does it add backend or transaction semantics?
6. Does it cause product data duplication?
7. Could the same outcome be achieved with an existing module?

If the feature cannot be justified, do not build it.

## Change procedure

A protected decision changes only after explicit user direction.

When changed:
1. update `DECISIONS.md`;
2. update this file if scope changes;
3. update architecture/catalog contracts;
4. then update implementation;
5. report the decision delta in the handoff.

## Authorised original package discovery, 12 October 2026

DEC-019 adds metadata-only original integration package listings and offline request preparation. All premium code stays private. Public listings do not establish live adapters, external licences, sale availability or outcomes.
