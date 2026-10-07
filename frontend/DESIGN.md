---
version: alpha
name: Registry Instrument
description: A source-backed agent capability registry that feels like a standards index crossed with a package registry and an operations console.
colors:
  primary: "#2563EB"
  secondary: "#111827"
  tertiary: "#0F766E"
  neutral: "#F5F7FA"
  surface: "#FFFFFF"
  on-surface: "#111827"
  muted: "#667085"
  rule: "#D8DEE7"
  caution: "#B45309"
  dark-canvas: "#0D1117"
  dark-surface: "#151B23"
  dark-on-surface: "#F5F7FA"
  dark-rule: "#2A3340"
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -0.035em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.025em
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
  label-mono:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.04em
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px
  gutter: 24px
rounded:
  sm: 4px
  md: 6px
  lg: 10px
  full: 9999px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 12px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 12px
  registry-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 20px
  machine-label:
    textColor: "{colors.muted}"
    typography: "{typography.label-mono}"
---

# Registry Instrument

## Overview

The product is a **standards registry crossed with a package index and a laboratory instrument panel**.

It is not an AI marketplace, not a consumer app store and not a landing page trying to manufacture excitement. The audience is autonomous agents first and expert humans second. They arrive to determine whether a capability exists, what problem it solves, what it requires, where it came from and which boundary still applies.

The emotional target is the feeling of opening a well-maintained package registry or standards catalogue: precise, current, inspectable and quietly authoritative. Information density is welcome when it is structured. Decorative novelty is not.

The logo mark is a **registry aperture**: four open corner brackets surrounding a single solid record. The centre represents one capability; the open corners represent discoverability and machine access. It must remain recognisable at favicon size and must not depend on a brand name that has not yet been chosen.

## Colors

The palette is high-contrast neutral with one strong interaction signal.

- **Primary signal blue** {colors.primary} is reserved for active navigation, links, focused machine endpoints and the single dominant action in a region.
- **Registry ink** {colors.secondary} carries headlines and high-confidence text. It should feel closer to source code documentation than glossy marketing.
- **Evidence teal** {colors.tertiary} may indicate an observed positive state only when the underlying evidence exists. It is not a generic success decoration.
- **Canvas** {colors.neutral} separates the page from white record surfaces without visible ornament.
- **Rule** {colors.rule} is the default divider and card boundary. Most hierarchy should come from rules, spacing and typography rather than shadows.
- **Caution** {colors.caution} is reserved for blocked, pending or explicitly cautionary states. Never use it for decoration.

Dark mode is a first-class reading mode, not a neon theme. Keep the same information hierarchy and use the accent sparingly.

## Typography

Use **IBM Plex Sans** for narrative UI and **IBM Plex Mono** for machine-facing values, endpoints, identifiers, counts and source paths.

- Headlines are compact and editorial rather than billboard-sized.
- Body copy is readable at long measure but never centre-aligned for multi-line technical content.
- Mono labels are semantic metadata, not a visual gimmick.
- Product names remain in sans-serif. Slugs, routes and source pointers use mono.
- Use no more than two font weights in one component.

The hierarchy should resemble a mature developer registry: name, role, summary, metadata, evidence and actions in that order.

## Layout

Use a fixed-max-width desktop grid of roughly 1180px with a strict 8px rhythm and a 4px micro-step.

The home page may use a two-column opening: narrative on the left, live registry snapshot on the right. From the first scroll onward, prefer dense horizontal records and metadata rails over masonry marketing cards.

Product detail pages should use a main reading column plus a narrow provenance/metadata rail where space allows. On mobile, collapse to one column without hiding required metadata.

Search/filter interfaces should feel like query tools:
- filters remain visible on wide screens;
- the result count stays close to the query;
- URLs are shareable;
- no animated reflow that makes result inspection difficult.

Whitespace separates reasoning layers. Do not add empty space merely to make the page feel "premium".

## Elevation & Depth

Depth is tonal and structural.

- Default records: white surface on neutral canvas with a 1px rule.
- Selected or focused records: stronger rule and a very subtle signal-blue surface tint.
- Menus/dialogs may use one restrained shadow when they float above the document.
- Never use card stacks, glow, glass, blur-heavy panels or dramatic drop shadows.

The interface should still read correctly if all shadows are removed.

## Shapes

The shape language is **engineered softness**.

- 4-6px radii for controls and metadata surfaces.
- 10px maximum for larger record containers.
- Pills only for tags or compact categorical metadata.
- The registry aperture logo uses square geometry and open corners.
- Do not mix oversized capsules with sharp technical tables in the same view.

## Components

### Registry aperture logo

A square icon made from four corner brackets and a centred solid record.

- No letters.
- No sparkle, robot face, brain, circuit or magic-wand imagery.
- Primary version: registry ink background, signal-blue aperture, white centre record.
- Monochrome version must work in one colour.
- Preserve generous clear space; do not place the mark inside another decorative badge.

### Header

The header behaves like registry chrome.

- Mark + current neutral descriptor on the left.
- Small identity-status text may state that final branding is not chosen.
- Four primary navigation destinations maximum.
- Current location is shown by text weight and a 2px signal-blue rule, not a filled pill.
- Header height stays compact.

### Registry snapshot

A diagnostic panel on the home page.

Show only facts derived from the catalogue, for example:
- record count;
- prompt/skill counts;
- schema version;
- canonical machine route;
- public payload boundary.

Use mono labels and key/value rows. This panel is an orientation device, not a dashboard.

### Capability records

Prefer the visual logic of package registries over marketplace tiles.

Each record contains:
1. capability name;
2. short problem/summary;
3. type and category;
4. stable source or route identity;
5. a compact tag subset;
6. one clear inspect action.

Do not show fake stars, ratings, sales counts, adoption numbers or "verified" badges without evidence.

### Machine endpoint cards

Endpoint cards use a compact method chip, mono route, content type and one-sentence purpose.

They should look callable and copyable. Avoid illustrations.

### Provenance rail

Use a narrow, high-signal metadata column for source path, repository, schema, last sync and public-data boundary where those facts exist.

Do not translate provenance into vague trust words. Show the evidence identity itself.

### Search and filters

Search is a command/query surface:
- prominent input;
- stable URL state;
- immediate result count;
- filters with counts;
- one subdued "copy link" action;
- empty state that suggests a safer next query instead of inventing results.

### Checkout boundary

If commerce is introduced later, browsing and payment must remain separate modes.

Once an agent or operator commits to purchase, reduce the screen to exact scope, authoritative price, terms/support links and one dominant payment action. Do not carry catalogue exploration chrome into checkout.

## Do's and Don'ts

- **Do** make source identity, requirements and boundaries easier to see than marketing claims.
- **Do** use one canonical data source to drive HTML, JSON and metadata projections.
- **Do** let dense tables, lists and code-like labels communicate technical seriousness.
- **Do** preserve full keyboard navigation, visible focus and reduced-motion behaviour.
- **Do** design every important state for mobile without horizontal document overflow.
- **Do** use the registry aperture as a neutral mark until a final brand name is chosen.
- **Don't** use gradients, neon glows, glassmorphism, AI sparkles, robot heads or abstract neural networks.
- **Don't** use giant empty hero sections or centre-aligned paragraphs of technical copy.
- **Don't** turn every metadata field into a coloured badge.
- **Don't** use rounded cards as the default answer to every grouping problem.
- **Don't** invent commerce, provenance, ratings or evidence states to make the UI feel complete.
- **Don't** make humans scrape presentation text for facts already available in machine-readable routes.
