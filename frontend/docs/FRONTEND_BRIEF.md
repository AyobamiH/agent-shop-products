# Lovable Frontend Build Brief

## Product

Build the frontend for an agent-first, human-friendly shop for production-grade prompts and future skills.

This build starts from the attached real catalogue. It is not a mockup exercise.

## Mandatory first action

Before implementing UI:

1. save the supplied `AGENTS.md`, `/docs`, and `/catalog` files into the repository;
2. read them;
3. confirm the catalogue parses;
4. inspect the existing Lovable project;
5. implement against the existing React/TypeScript stack rather than migrating frameworks.

Do not spend tokens generating replacement product copy or sample products.

## Positioning

Working headline:

**Production-grade prompts and skills for agents that need to prove their work.**

Supporting idea:

Evidence-first systems for debugging, verification, production reconnaissance, governed autonomy, durable coding workflows, and reliable external actions.

Do not invent a permanent brand.

## Real catalogue

The frontend MUST render from `catalog/products.public.json`.

There are currently real source-backed products. Do not replace them with a smaller sample set.

Do not add fake prices or purchase buttons.

If commerce data is absent, the product page is a credible information/discovery page, not a fake checkout.

## Primary routes

```text
/
 /shop
 /products/:slug
 /problems
 /categories/:category
 /agents
 /knowledge
```

Only add routes that have real data/content.

Do not create empty “Coming soon” sections for visual completeness.

## Homepage

### Hero
- working headline;
- concise supporting text;
- primary CTA: Explore products;
- secondary CTA: Browse by problem.

### Problem-led discovery
Use real `problem`, `category`, and `coreOutcomes` catalogue fields.

### Featured products
Feature real catalogue products only.
If no featured flag exists, use a deterministic editorial rule documented in code rather than inventing ranking metrics.

A safe initial rule is a fixed source-backed curated id list stored in one config module, not scattered markup.

### Trust section
Explain the store philosophy:
- source-backed product descriptions;
- explicit boundaries;
- requirements shown before use;
- no invented evidence.

## Shop page

Provide deterministic:
- text search;
- category filter;
- product-type filter;
- tag filtering where useful.

Do not add filters for price, compatibility, reviews, or evidence level until those fields exist authoritatively.

Persist browse state in the URL when reasonable.

## Product detail page

Render only available source-backed sections:

1. product name;
2. type/category;
3. summary;
4. problem;
5. core outcomes;
6. requirements;
7. boundaries;
8. source-backed evidence-basis statement;
9. related products based on deterministic shared category/tag logic.

Do not expose the full prompt body in the public frontend.

Do not invent:
- pricing;
- ratings;
- customer counts;
- model compatibility;
- “works with” logos;
- testimonials;
- download count;
- purchase state.

## Problem discovery

Build `/problems` from catalogue data.

Group or index real problem statements and link to the products that address them.

This is the beginning of agent/human problem-first discovery and should share selectors with future CLI search semantics.

## Agent discovery page

`/agents` explains the machine-readable architecture, not MCP.

Document the planned CLI interaction concept:

```bash
shop search "problem"
shop show <product-id>
shop sample <product-id>
shop buy <product-id>
shop install <product-id>
shop update
```

Mark transaction/install commands as future roadmap only.

Do not implement fake CLI execution.

Provide a link or display for the machine-readable public catalogue if the deployment exposes it.

## Knowledge

Do not generate filler articles.

For this phase:
- build the knowledge index structure;
- populate only source-backed topic cards that can be derived directly from catalogue problem/boundary metadata;
- each topic must cite internally which products/source records support it.

Long-form articles wait until real source content is authored or deliberately derived/reviewed.

## Visual direction

Professional, restrained, engineering-led.

- clean neutral base;
- strong typography;
- warm accent;
- excellent spacing;
- compact metadata;
- subtle borders;
- low visual noise;
- mobile-first responsive behaviour.

Avoid:
- AI brain imagery;
- neon cyberpunk styling;
- robot mascots;
- random gradients;
- fake terminal animations;
- generic dashboard chrome;
- excessive motion.

The catalogue content is the visual hierarchy.

## Component boundaries

Expected reusable pieces:

```text
ProductCard
ProductList
ProductSearch
CategoryFilter
TagFilter
ProductHeader
RequirementList
BoundaryList
OutcomeList
ProblemCard
SourceBackedNotice
SiteHeader
SiteFooter
EmptyResults
```

Do not create one mega `ProductPage.tsx`.

## Engineering quality

Follow `ARCHITECTURE.md` and `QUALITY_GATES.md`.

Particularly:
- strict TypeScript;
- no `any` to bypass modelling;
- pure catalogue selectors;
- no duplicated product transforms;
- no business logic in JSX;
- stable keys;
- no client effects for synchronous derived state;
- no unnecessary state copies;
- no unnecessary dependencies;
- small cohesive modules;
- accessible controls;
- deterministic tests.

## Testing

Minimum:
- catalogue schema/shape test;
- unique id/slug test;
- product lookup test;
- search/filter selector tests;
- route render smoke tests;
- missing product 404/not-found behaviour;
- no-mock sentinel test scanning for known forbidden placeholder strings if practical.

## Completion report

Return:
- implemented routes;
- modules created;
- tests run/results;
- build/lint/typecheck results;
- largest authored source files and line counts;
- any file above review threshold and why;
- any source field omitted from UI and why;
- drift check against `DECISIONS.md`;
- deferred work.

Do not call the build complete if validation was not executed.