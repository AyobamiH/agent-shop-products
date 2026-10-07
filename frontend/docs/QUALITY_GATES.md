# Quality Gates

## Required before completion

1. TypeScript typecheck passes.
2. Lint passes.
3. Relevant unit tests pass.
4. Production build passes.
5. All declared routes smoke-test.
6. Search/filter logic has deterministic tests.
7. No source-backed catalogue product disappears unintentionally.
8. No mock product data is introduced.
9. No public bundle contains raw full prompt payloads.
10. Accessibility basics are checked.
11. Mobile and desktop layouts are checked.
12. File-size and modularity report is produced.
13. Drift guard is re-read before final handoff.

## Modularity thresholds

Count logical authored lines; ignore generated files and large declarative JSON datasets.

### Targets
- module/component: <= 200
- page/route: <= 180
- hook: <= 150
- utility: <= 150
- domain service: <= 250

### Review gates
- >300 lines: explain cohesion and consider split.
- >400 lines: split before completion unless generated/declarative or explicitly approved.

### Function gates
- target <= 50
- review >80
- redesign/split >120 unless algorithmically justified

## Complexity

Prefer:
- early returns;
- pure transformations;
- small decision tables/maps;
- typed discriminated unions;
- explicit selectors.

Avoid:
- nested conditional pyramids;
- boolean-flag soup;
- one function that parses, transforms, ranks, renders, and mutates state;
- repeated O(n) scans inside render loops when a precomputed map/index is clearer.

## Performance

For the current small static catalogue:
- do not introduce a backend search service;
- do not add vector search;
- do not use an LLM for runtime product search;
- do not fetch local static data repeatedly;
- build derived indexes once.

Optimise the architecture first; micro-optimise only with evidence.