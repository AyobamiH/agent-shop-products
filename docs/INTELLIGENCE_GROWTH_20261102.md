# Agent Shop — 2 November 2026 intelligence growth review

## Why this refresh exists

The public 9 October baseline held 33 original products, 38 reviewed procedures, 24 engineering bugs and a separate, dated inventory of 990 external capability names. The user-maintained source indexes have since grown and are not automatically reflected in the public shop.

## Read-only, private input sources

A protected owner-host intake snapshot at `~/.local/share/agent-shop/intelligence-intake-20261102.json` contains identifiers, titles, verification labels and limitations only (file mode 0600). It was fetched from existing native Google Sheets through the authorised connector. No Google credentials or raw chats were copied into this public repository.

| Source slice | Rows | Treatment |
| --- | ---: | --- |
| General Chat History — Problems & Solutions | 141 | Problem evidence, not products |
| General Chat History — Reusable Solutions | 64 | Reviewed candidate queue |
| Remote execution harvest — Reusable Solutions | 26 | Reviewed candidate queue |
| Remote execution harvest — Research Candidates | 29 | Research, not release-ready |
| Project memory index — Reusable Solutions | 9 | Reviewed candidate queue |
| **Total records examined** | **269** | **Not deduplicated or saleable-product count** |

Records overlap across sources. Many are historical proposals, partial tests, already catalogued methods, or require original provider evidence. Treating all 269 as products would invent authority and create thin/duplicate pages.

## Public, scoped first batch

Four original generalised skills have individual `SKILL.md` payloads, canonical `product.json`, Git blob provenance and procedure/evidence coverage:

1. Auditable Indexing-State Reconciliation — original owner-only Google Search Console API inspection and Unicode-safe counter repair. The 48 URL inspection is dated; no indexing improvement asserted.
2. CI Admission and Fallback Triage — exact GitHub Actions billing-lock annotation plus independent clean-checkout tests. Hosted CI remains blocked; fallback never silently satisfies a required gate.
3. Protocol-Faithful Analytics Command Queues — two confirmed merged source fixes for the actual Google tag command protocol. No live GA4 destination hit or consent claim inferred.
4. Architecture-Matched Release Rehearsal — AMD GAIA superseded contributor PR with genuine native Apple Silicon smoke receipts and separately merged identical correction. No downstream release success inferred.

Four new coding-bug records preserve the distinction between fixed source, unresolved provider admission and unverified release outcomes. The external 990-name inventory remains a **9 October snapshot**, not a statement that the current provider tool landscape contains exactly those entries.

## Repeatable promotion contract

1. Read a fresh source-index snapshot and check exact source IDs, privacy and verification scope; never extract directly into a public catalogue.
2. Deduplicate against canonical product IDs, similar existing procedures and known bugs. Separate already-covered, research-only, candidate and publishable methods.
3. Require a concrete original, generalisable procedure with a specific, dated evidence record and explicit unsupported claims. Create `products/<id>/SKILL.md` and `product.json`; never publish third-party payloads.
4. Derive manifest, source hashes, public projection, frontend sync and procedure coverage from that canonical metadata; keep private/workbook contents out of Git.
5. Run catalogue, capability, frontend and commerce-release guards. Publish only through the existing exact-head CI or an explicitly approved trusted alternative, protected merge and owner-local guarded promotion with independent outside-in readback.
6. Indexing, impressions, qualified enquiries and paid fulfilment remain separate and cannot be declared from deployment success.

**Current state:** Candidate repository work only. Neither this document nor local validation proves deployment to agents.proofandstate.com.

## Build and verification portability

The in-repository \`frontend/vitest.config.mjs\` runs the 19 existing application/commerce unit-test files with explicit source and catalogue aliases, avoiding the Nitro dev-server watcher setup on file-watcher-exhausted hosts. It does not alter production Vite/Cloudflare configuration or convert tests into hosted CI evidence. The initial candidate was validated with 100/100 Vitest tests, 88/88 Node tests, catalogue/inventory validators, TypeScript checking and a Cloudflare-targeted production build. Normal public deployment remains protected by exact-source release gates.
