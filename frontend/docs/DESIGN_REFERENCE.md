# Agent Shop design rationale

## Problem

The public surface has to work for three readers at once without becoming three different products:

1. autonomous agents discovering a capability;
2. expert humans inspecting what the agent will consume;
3. future commerce flows that must not contaminate discovery with invented pricing or trust claims.

The design therefore treats the site as a registry first and a storefront only when a real purchase flow exists.

## Reference patterns

### Google DESIGN.md — persistent design authority

Google Labs' DESIGN.md format is the design governance model for this frontend.

- Specification: https://github.com/google-labs-code/design.md/blob/main/docs/spec.md
- Philosophy: https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md

The important lesson is that a design system needs both machine-readable tokens and prose describing intent, references and negative constraints. The prose carries the visual world; tokens keep repeated implementation aligned.

Agent Shop therefore keeps its design authority in `frontend/DESIGN.md` and validates it in CI against the pinned Google implementation.

### GitHub Marketplace — compact identity + factual listing

Reference:
https://docs.github.com/en/apps/github-marketplace/listing-an-app-on-github-marketplace/writing-a-listing-description-for-your-app

Useful patterns:
- small square mark that survives a circular/small badge context;
- concise capability description;
- screenshots that show product function rather than decorative mockups;
- high information density on the listing page.

Applied here:
- neutral registry-aperture mark with no text;
- short capability summaries;
- dense metadata/provenance surfaces;
- feature-card asset built from actual catalogue facts.

### npm and GitHub provenance — show source identity, not vague trust

References:
- https://docs.npmjs.com/viewing-package-provenance/
- https://docs.github.com/en/actions/concepts/security/artifact-attestations

Useful pattern:
trust is improved by exposing the build/source identity a consumer can inspect. A green badge alone is weaker than exact provenance.

Applied here:
- source path is visible on capability records;
- provenance stays distinct from evidence/outcome claims;
- no decorative "verified" badge is introduced without a verifier contract.

### Stripe — discovery and transaction are separate modes

Reference:
https://stripe.com/resources/more/checkout-ui-strategies-for-faster-and-more-intuitive-transactions

Useful pattern:
when a user has decided to buy, remove browsing noise, show the exact order/price and make one action dominant.

Applied here:
- the current Agent Shop remains discovery-only;
- future checkout must be a separate, low-noise state;
- catalogue pages do not invent price, offer or availability schema before commerce exists.

## Layer-by-layer design decisions

| Layer | UX problem | Design response |
|---|---|---|
| Identity | Final brand is not chosen | Symbol-only registry aperture; descriptor remains replaceable |
| Discovery | Agents should not scrape presentation UI | Dedicated JSON/text/Markdown routes made visually prominent |
| Selection | Too many records can become card noise | Query-first catalogue and provenance-led records |
| Trust | Generic "verified" labels are weak | Show source identity, boundaries and exact public metadata |
| Mobile | Dense technical UI can overflow | 8px rhythm, single-column collapse, bounded mono text |
| State | Success/availability can be conflated | Reserve state colour for actual evidence, not decoration |
| Commerce | Browsing and payment have conflicting needs | Keep checkout separate until an authoritative price/scope exists |
| Drift | Agents can restyle screens inconsistently | Google DESIGN.md file + CI lint + protected design rationale |

## Logo rationale

The registry aperture mark has five pieces:

- four open corners: machine access/discoverability;
- centre record: one bounded capability;
- square geometry: technical registry rather than lifestyle marketplace;
- signal blue: active/query state;
- no letters: survives future product renaming.

It deliberately avoids common AI-brand tropes: sparkles, neural meshes, robot heads, magic wands and gradients.
