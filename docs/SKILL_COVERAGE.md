# Skills catalogue and work coverage

Reviewed on **7 October 2026**.

The catalogue contains **16 products: 11 prompt products and 5 skill products**. This update retains the 13 existing products and adds three original reusable skills. It accounts for **13 procedures** in the recovered work and **four named supporting platform skills**.

## Scope and evidence

This review covers the canonical repository at [the starting revision](https://github.com/AyobamiH/agent-shop-products/tree/6b75108e0953c62240557daae53df3123a50428c), all **65 visible messages** in the owner-supplied work conversation, a targeted authorised review of relevant implementation and hosted CI, and the follow-on continuity and catalogue work.

That is the completeness boundary. Unreviewed conversations, hidden/internal content and every lifetime tool invocation are outside it. Video attachments were referenced in the conversation but were not independently replayed during this catalogue review.

A product mapping means its procedure covers the work; it does **not** claim the product's payload was loaded as a runtime skill. The named platform invocations are listed separately below. Presence in the pre-existing catalogue is also distinct from observed use in this work.

The implementation review involved a private source repository. This public record contains original generalised instructions and sanitised evidence summaries. Private code, repository and CI links, commit identifiers, raw transcripts, shared links, document contents, credentials and host identifiers are excluded. The private review summaries are not independently inspectable public proof.

The machine-readable authority for this coverage record is [catalog/skill-coverage.json](../catalog/skill-coverage.json). Product source and metadata remain authoritative in each product directory; [catalog/manifest.json](../catalog/manifest.json) indexes them.

## New reusable skills

### Bounded Google Docs Read Recovery

[Read the skill](../products/bounded-google-docs-read-recovery/SKILL.md) · [Metadata](../products/bounded-google-docs-read-recovery/product.json)

Localise failures across the actual host's network route, token refresh, Drive metadata, Docs response and local validation. Use bounded, sanitised diagnostics and compact JSON while preserving the configured response ceiling, complete nested content, text positions, revisions and coherent-read checks. Interpret the preview's semantic result independently of process exit status or eligibility count.

The historical record includes operator output from a successful read-only preview. The authorised source review supports the compact-response implementation and relevant regressions. Neither establishes installation of the final revision or a fresh scheduled observation. WSL networking changes are conditional on evidence and the full restart scope.

### Safe Scheduled Runtime Upgrade

[Read the skill](../products/safe-scheduled-runtime-upgrade/SKILL.md) · [Metadata](../products/safe-scheduled-runtime-upgrade/product.json)

Inventory schedules, dependencies, queued jobs and active workers; preserve original activation states; pause new wake-ups and drain work within a bound. Create a fresh state-bound review, apply through the existing guard once, reconcile ambiguous outcomes and restore scheduling through the agreed recovery path. Verify the actual running process separately from checkout or release metadata.

Reviewed implementation and regressions support the procedure, including stale reviews, cancellation, restoration failures and readiness bounds. The final host switch and live acceptance were not confirmed in the reviewed record. Asynchronous collection/refill acceptance remains distinct from completion.

### Live Dashboard Update Verification

[Read the skill](../products/live-dashboard-update-verification/SKILL.md) · [Metadata](../products/live-dashboard-update-verification/product.json)

Trace an observation through collection, transport, accepted state and rendering. Preserve shared live DOM targets, verify a complete first snapshot and successive events across views, retain focus and reading state, and test under the production content security policy. Distinguish a measured zero from blocked, stale, unknown and failed collection states.

Reviewed source and hosted browser regressions support the exercised synthetic rendering behaviour. Browser CI covered the same integrated source tree as the merged change. This establishes neither current owner-host deployment nor live provider correctness; unexercised reconnect and viewport paths remain unverified.

## Complete product inventory

All existing IDs, slugs, metadata and payloads are retained. The 11 migrated prompt payloads and both pre-existing skill payloads remain unchanged.

| Product | Type | Relationship to the reviewed work |
| --- | --- | --- |
| [Autonomous Coding Workflow with a Work Ledger](../products/autonomous-coding-workflow/PROMPT.md) | Prompt | Context recovery, bounded diagnostics and exact-revision handoff. |
| [Bounded Google Docs Read Recovery](../products/bounded-google-docs-read-recovery/SKILL.md) | Skill | New: layered provider-read diagnosis, compact JSON and coherent document reads. |
| [Capability-Gap Learning System](../products/capability-gap-learning-system/PROMPT.md) | Prompt | Existing product; invocation or direct use not established in the reviewed work. |
| [Continuous Autonomous Business Operations Graph](../products/continuous-business-operations-graph/PROMPT.md) | Prompt | Existing product; the full operating-graph workflow was not established. |
| [Deterministic Social Publication Pipeline](../products/deterministic-social-publication/PROMPT.md) | Prompt | Preview eligibility and later publication acceptance remain separate. |
| [Evidence-Backed Open-Source Contribution](../products/evidence-backed-open-source-contribution/SKILL.md) | Skill | Bounded patches, regression evidence, native CI and truthful handoff. |
| [Evidence-First Live Diagnostic and Repair](../products/evidence-first-live-diagnostic-repair/PROMPT.md) | Prompt | Failure localisation, safe tracing and semantic result interpretation. |
| [Graph-Native Agent System Migration](../products/graph-native-agent-system-migration/PROMPT.md) | Prompt | Existing product; routine runtime maintenance does not establish a graph migration. |
| [Live Dashboard Update Verification](../products/live-dashboard-update-verification/SKILL.md) | Skill | New: shared DOM ownership, streaming updates and freshness verification. |
| [Local-First Verification CLI](../products/local-first-verification-cli/PROMPT.md) | Prompt | Evidence classification across source, CI, runtime and visible results. |
| [Production Agent Operating Files](../products/production-agent-operating-files/PROMPT.md) | Prompt | Durable context and explicit evidence/authority boundaries. |
| [Published Package Contract Verification](../products/published-package-contract-verification/SKILL.md) | Skill | Existing skill; package-export verification was not established in this work. |
| [Read-Only Production System Reconnaissance](../products/read-only-production-reconnaissance/PROMPT.md) | Prompt | Host, route, process and collection-state inspection. |
| [Safe Scheduled Runtime Upgrade](../products/safe-scheduled-runtime-upgrade/SKILL.md) | Skill | New: drain, guarded apply, schedule restoration and process acceptance. |
| [Self-Identifying Product Campaign](../products/self-identifying-product-campaign/PROMPT.md) | Prompt | Retained; editorial/model-provider context is inherited or pending. |
| [Signed Agent Action Receipts](../products/signed-agent-action-receipts/PROMPT.md) | Prompt | Retained; cryptographically signed receipt execution was not demonstrated. |

## Procedure coverage

“Demonstrated” identifies observed work or reviewed implementation/regression evidence for that procedure. It does not imply a live deployment. “Partially demonstrated” identifies a useful procedure whose operational sequence, explanation or final acceptance remains incomplete. Consult the evidence and limits for each record in the JSON.

| Procedure | Status | Catalogue coverage |
| --- | --- | --- |
| Recover an earlier conversation into durable working context | Demonstrated | [Autonomous Coding Workflow with a Work Ledger](../products/autonomous-coding-workflow/PROMPT.md); [Production Agent Operating Files](../products/production-agent-operating-files/PROMPT.md) |
| Separate host routing, transport, authentication and document failures | Partially demonstrated | [Bounded Google Docs Read Recovery](../products/bounded-google-docs-read-recovery/SKILL.md); [Read-Only Production System Reconnaissance](../products/read-only-production-reconnaissance/PROMPT.md); [Evidence-First Live Diagnostic and Repair](../products/evidence-first-live-diagnostic-repair/PROMPT.md) |
| Back up host configuration and verify effective activation | Partially demonstrated | [Safe Scheduled Runtime Upgrade](../products/safe-scheduled-runtime-upgrade/SKILL.md); [Bounded Google Docs Read Recovery](../products/bounded-google-docs-read-recovery/SKILL.md); [Read-Only Production System Reconnaissance](../products/read-only-production-reconnaissance/PROMPT.md) |
| Pause wake-ups, drain work and restore scheduling | Partially demonstrated | [Safe Scheduled Runtime Upgrade](../products/safe-scheduled-runtime-upgrade/SKILL.md) |
| Run bounded host diagnostics and recover from malformed shell input | Demonstrated | [Read-Only Production System Reconnaissance](../products/read-only-production-reconnaissance/PROMPT.md); [Evidence-First Live Diagnostic and Repair](../products/evidence-first-live-diagnostic-repair/PROMPT.md); [Autonomous Coding Workflow with a Work Ledger](../products/autonomous-coding-workflow/PROMPT.md) |
| Reconcile dashboard state with the underlying observation | Partially demonstrated | [Live Dashboard Update Verification](../products/live-dashboard-update-verification/SKILL.md); [Local-First Verification CLI](../products/local-first-verification-cli/PROMPT.md); [Evidence-First Live Diagnostic and Repair](../products/evidence-first-live-diagnostic-repair/PROMPT.md) |
| Localise collector failure and shared deadline starvation | Partially demonstrated | [Evidence-First Live Diagnostic and Repair](../products/evidence-first-live-diagnostic-repair/PROMPT.md); [Bounded Google Docs Read Recovery](../products/bounded-google-docs-read-recovery/SKILL.md); [Read-Only Production System Reconnaissance](../products/read-only-production-reconnaissance/PROMPT.md) |
| Read semantic preview results and eligibility correctly | Demonstrated | [Bounded Google Docs Read Recovery](../products/bounded-google-docs-read-recovery/SKILL.md); [Deterministic Social Publication Pipeline](../products/deterministic-social-publication/PROMPT.md); [Evidence-First Live Diagnostic and Repair](../products/evidence-first-live-diagnostic-repair/PROMPT.md) |
| Trace a swallowed reader failure without exposing provider data | Demonstrated | [Bounded Google Docs Read Recovery](../products/bounded-google-docs-read-recovery/SKILL.md); [Evidence-First Live Diagnostic and Repair](../products/evidence-first-live-diagnostic-repair/PROMPT.md) |
| Reduce document formatting overhead while preserving read contracts | Demonstrated | [Bounded Google Docs Read Recovery](../products/bounded-google-docs-read-recovery/SKILL.md) |
| Repair shared DOM ownership and verify successive dashboard updates | Demonstrated | [Live Dashboard Update Verification](../products/live-dashboard-update-verification/SKILL.md) |
| Deliver a narrow repository change with truthful validation | Demonstrated | [Evidence-Backed Open-Source Contribution](../products/evidence-backed-open-source-contribution/SKILL.md); [Local-First Verification CLI](../products/local-first-verification-cli/PROMPT.md) |
| Hand off an exact runtime revision with separate live acceptance | Partially demonstrated | [Safe Scheduled Runtime Upgrade](../products/safe-scheduled-runtime-upgrade/SKILL.md); [Local-First Verification CLI](../products/local-first-verification-cli/PROMPT.md); [Autonomous Coding Workflow with a Work Ledger](../products/autonomous-coding-workflow/PROMPT.md) |

### Why only three new products?

Existing products already cover durable work context, read-only reconnaissance, evidence-first diagnosis, bounded contribution work, source/CI/runtime evidence distinctions and deterministic publication acceptance. Those procedures are mapped to their existing products instead of being repackaged as duplicate inventory.

The distinct gaps were bounded Google document-read recovery, safe maintenance of a scheduled runtime, and live dashboard rendering verification. The new payloads provide actionable procedures for those gaps. They are repository products, not a claim that personal platform skills were installed.

## Named supporting platform skills

These are observed dependencies of the work, not additional products in this repository. Their implementations are not copied or republished.

| Named skill | Observed use | Scope |
| --- | --- | --- |
| `personal-context` | Recover earlier decisions and continuity context. | Explicitly announced in the recovered thread and used in follow-on continuity/catalogue work. |
| `openai-library:library` | Persist the recovered transcript and capture artefact. | Follow-on capture session. |
| `pages:write-page` | Create and read back a structured handover. | Follow-on capture session. |
| `skill-creator` | Author and validate reusable skill payloads. | This catalogue update. |

Only `personal-context` was explicitly named as invoked in the recovered 65-message thread. Similarity to another platform skill's subject matter does not establish its invocation. The other three named skills were observed in the subsequent capture or catalogue work.

A saved transcript and handover preserve recoverable context. They do not guarantee automatic recall in every future conversation, grant operational permissions or convert historical claims into fresh evidence.

## Open and inherited work

These items are retained for continuity and are not marketed as completed capabilities:

| Item | Evidence state | What remains |
| --- | --- | --- |
| final runtime acceptance | unconfirmed | Final installation, running revision, restored scheduling and live console acceptance still require fresh host evidence. |
| fresh scheduled observation | unconfirmed | Read-only preview success must be followed by an observed saved scheduled result before ongoing recovery is claimed. |
| collector budget and provider recovery | unresolved | Shared collection deadline pressure and distinct source/reply failures were identified; completion of their repair was not demonstrated. |
| model provider acceptance | inherited or pending | Earlier model-provider publication claims and later readiness blocks are historical context. A new provider acceptance result was not established. |
| editorial and supply acceptance | pending | Editorial checks, usable supply and normal scheduled publication acceptance remain separate from transport and UI recovery. |
| windows git bridge | inherited only | An earlier handover mentioned a Windows-to-guest repository bridge; its operational sequence was not demonstrated in the reviewed thread, so no new skill product is claimed. |
| runtime package warning | deferred | An incidental package-manager/runtime warning was deferred. No repair or new product is claimed. |

Source review, regression results, hosted CI, merge state, installation, process readiness, saved observations and downstream outcomes must remain separate when updating these records. A later heavyweight diagnostic timeout does not by itself invalidate independently observed lightweight readiness or authorise repeating a release switch.

## Maintaining the catalogue

1. Read [AGENTS.md](../AGENTS.md), [DECISIONS.md](DECISIONS.md) and the [catalogue contract](CATALOG_CONTRACT.md).
2. Author a real payload and metadata in its product directory; preserve stable identifiers and existing source provenance.
3. Add a procedure only when reviewed evidence supports its scope. Keep pending work and named dependencies distinct from product inventory.
4. Synchronise the manifest, public projection and canonical payload blob hashes. Preserve original provenance for existing products.
5. Update the coverage JSON and this human-readable index together; do not silently reinterpret procedure mappings as skill invocations.
6. Run the read-only integrity check before committing:

```sh
python3 scripts/validate_catalog.py
```

The validator checks metadata, IDs/slugs, source containment, manifest membership, public projection equality, canonical blob hashes and coverage references. It does not verify the truth of private evidence summaries, remote origin availability, installation or live application behaviour. Review those claims against their actual evidence.

Git history records subsequent catalogue changes. Do not publish private evidence merely to make a public product claim appear stronger.
