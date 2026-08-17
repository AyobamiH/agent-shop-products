# Deterministic social publication pipeline

A production prompt for building an auditable social publishing system that uses immutable content specifications, durable slot ownership, one bounded provider write and official readback before declaring a post published.

This prompt is based on a working TypeScript publishing engine used for scheduled Threads and Instagram operations. It generalises the same architecture for any platform that exposes suitable official write and read APIs.

## Requirements

- An existing TypeScript or JavaScript service.
- Durable SQL storage such as SQLite or PostgreSQL.
- Official provider APIs for publishing and canonical object readback.
- A scheduler that identifies one named publication opportunity.
- Explicit authority for live writes.
- A zero-write shadow mode.
- Platform-specific text, media, quota and timing limits.

Do not use browser automation when the platform is official-API-only. A scheduler run, HTTP success response or returned provider ID is not proof that a publication exists.

## Prompt: build a deterministic social publication pipeline

Paste everything below the line into an AI coding assistant. Replace bracketed names where required, but keep the state machine, readback rules, ownership boundaries and terminal proof unchanged.

---

Build a production-grade deterministic social publication pipeline.

Use this flow:

```text
SELECT
  → SPECIFY
  → RENDER
  → VALIDATE
  → RESERVE
  → PUBLISH ONCE
  → READ BACK
  → RECONCILE
  → VERIFY
```

Every publication opportunity must produce exactly one auditable result:

```text
verified_published
confirmed_absent
verified_rejected
skipped_policy
skipped_no_candidate
failed_closed
reconciliation_required
```

## Non-negotiable rules

1. Official provider readback is publication truth.
2. A conversational agent, web route or scheduler callback may not call the provider directly.
3. A content model may render approved fields but may not select the product, campaign, evidence, platform, account or connector.
4. One opportunity has one durable slot identity.
5. One publication identity may cause at most one provider write.
6. Ambiguous writes enter reconciliation and are never blindly retried.
7. Only one scheduler owner may control a slot.
8. Content specifications are immutable after reservation.
9. Unavailable metrics are `null`, never zero.
10. Failed and superseded evidence remains append-only.

## Responsibility boundaries

### Planner

May:

- inspect approved campaign, audience, evidence and platform records;
- select an eligible candidate deterministically;
- produce a structured content specification;
- record an auditable skip.

May not:

- publish;
- choose an unapproved account;
- invent claims;
- bypass quotas, cooldowns or duplicate checks;
- declare success.

### Renderer

May:

- render approved text fields;
- produce or select approved media;
- fit output to platform limits.

May not:

- change commercial selection;
- change evidence or factual claims;
- change approval;
- publish;
- silently truncate required copy.

### Publication engine

Owns:

- slot reservation;
- immutable content identity;
- durable state;
- idempotency;
- connector authority;
- one write attempt;
- readback;
- reconciliation;
- terminal classification.

### Provider adapter

Owns:

- readiness;
- official API transport;
- request shape;
- provider object readback;
- possible-duplicate discovery;
- provider metrics where supported.

The adapter must not make campaign decisions or retry ambiguous writes.

### Scheduler

Owns timing only.

It must not render, publish, infer success, allocate the same slot twice or retry unresolved work.

## Package shape

Use a structure equivalent to:

```text
src/publishing/
  canonical.ts
  registry.ts
  selection.ts
  content.ts
  validation.ts
  store.ts
  engine.ts
  reconciliation.ts
  scheduler.ts
  ownership.ts
  visual-verification.ts
  metrics.ts
  types.ts
  connectors/
    contract.ts
    registry.ts
    [platform].ts
src/cli/
  publishing-harness.ts
config/publishing/
  registry.v1.json
  integration.v1.json
docs/
  publishing-architecture.md
  publication-runbook.md
test/
  unit/
  integration/
  adversarial/
```

Use strict TypeScript. Avoid `any`.

Imports must not call providers, discover credentials, start timers, mutate state, register schedules or infer account identities.

All state paths, accounts, connectors and modes must be explicit inputs.

## Versioned registry

Create one versioned registry containing:

- products or subjects;
- campaigns;
- audiences;
- problems and outcomes;
- approved claims;
- evidence;
- assets and hashes;
- calls to action;
- platform and account policies;
- schedules;
- templates;
- approvals;
- experiments;
- metric definitions;
- attribution definitions.

Every record must have lifecycle fields:

```ts
interface LifecycleRecord {
  id: string;
  version: string;
  status: "draft" | "active" | "paused" | "retired";
  validFrom?: string | null;
  validUntil?: string | null;
}
```

Fail closed when a reference is missing, approval is invalid, evidence is stale, an asset is unknown, policy is inactive, or an active connector lacks readback and duplicate discovery.

Do not silently repair registry defects at runtime.

## Publication opportunity

Treat scheduled time as an opportunity, not a promise to publish.

```ts
interface PublicationOpportunity {
  scheduleId: string;
  scheduledFor: string;
  timezone: string;
  slotKey: string;
  triggerId: string;
}
```

Generate `slotKey` deterministically from schedule identity and local scheduled time.

Enforce uniqueness in SQL.

If two triggers race, one owns the slot and the other receives the existing state. Neither may create a second reservation.

A process-local mutex is not enough.

## Eligibility and deterministic selection

Reject a candidate before scoring when:

- product or campaign is inactive;
- evidence or approval is invalid;
- platform, account or strategy compatibility fails;
- required text or media cannot be produced;
- quota is exhausted;
- cooldown remains active;
- identical content exists inside the duplicate window;
- an unresolved possible duplicate exists;
- an experiment is outside its approved window;
- the platform is prohibited.

Persist machine-readable rejection reasons.

Score only eligible candidates and persist named score components:

```ts
interface PublicationScore {
  expectedBusinessImpact: number;
  audienceRelevance: number;
  evidenceQuality: number;
  urgency: number;
  freshness: number;
  campaignPriority: number;
  platformFit: number;
  rotationNeed: number;
  repetitionRisk: number;
  value: number;
}
```

Use a documented formula. Resolve exact ties with a stable seed derived from:

```text
registryVersion + slotKey + platformId + accountId
```

The same registry, history and opportunity must replay to the same candidate.

Do not delegate selection to an LLM.

## Immutable content specification

Build this before rendering:

```ts
interface ContentSpec {
  id: string;
  schemaVersion: "1.0.0";
  registryVersion: string;
  slotKey: string;
  platformId: string;
  accountId: string;
  connectorId: string;
  productId: string;
  campaignId: string;
  strategyId: string;
  audienceId: string;
  claimIds: string[];
  evidenceIds: string[];
  assetIds: string[];
  callToActionId: string | null;
  templateId: string;
  experimentId: string | null;
  requiredCopySections: string[];
  maximumTextLength: number;
  contentHash: string;
  createdAt: string;
}
```

Calculate `contentHash` from canonical JSON of the complete object except the hash field.

After reservation, do not update or delete the specification, swap claims or assets, change account or platform, or regenerate different content under the same identity.

Enforce immutability in the database.

## Constrained rendering

The renderer receives only the immutable specification and referenced approved records.

```ts
interface RenderedCandidate {
  text: string;
  sections: Array<{ id: string; text: string }>;
  media: Array<{
    assetId: string;
    sourceHash: string;
    renderedHash: string;
    mimeType: string;
    width?: number;
    height?: number;
    durationSeconds?: number;
  }>;
  rendererId: string;
  rendererVersion: string;
}
```

When using an LLM:

- restrict it to allowed fields;
- require strict schema output;
- use the lowest supported randomness;
- provide a deterministic template fallback;
- validate every claim and section afterwards.

Reject output that omits required sections, changes claims, introduces unsupported facts, contains placeholders, leaks private details, exceeds platform limits, cuts text mid-sentence or references altered media.

## Copy and media validation

Define required semantic sections such as:

```text
hook
problem
evidence
explanation
next_step
```

Validate semantic presence, not just character count.

When limits are exceeded:

1. shorten optional language;
2. remove approved optional sections;
3. choose a shorter approved template;
4. fail closed.

Transport code must never silently truncate copy.

For media validate existence, MIME type, size, dimensions, duration, aspect ratio, checksum, lineage, captions, safe areas, legibility and crop safety.

Classify lineage:

```text
exact_asset
approved_recompression
approved_derivative
unknown_asset
```

Only approved lineage may publish.

## State machine and durable records

Use:

```text
planned
  → generated
  → validated
  → reserved
  → publishing
  → published_unverified
  → verified_published
```

Bounded alternatives:

```text
skipped_policy
skipped_no_candidate
failed_closed
verified_rejected
confirmed_absent
reconciliation_required
superseded
```

A provider ID does not skip `published_unverified`.

Create SQL records equivalent to:

```sql
CREATE TABLE publication_slots (
  slot_key TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  scheduled_for TEXT NOT NULL,
  state TEXT NOT NULL,
  publication_id TEXT,
  terminal_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE content_specs (
  id TEXT PRIMARY KEY,
  content_hash TEXT NOT NULL UNIQUE,
  spec_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE publications (
  id TEXT PRIMARY KEY,
  slot_key TEXT NOT NULL UNIQUE,
  content_spec_id TEXT NOT NULL UNIQUE,
  platform_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  provider_id TEXT,
  permalink TEXT,
  provider_receipt_json TEXT,
  readback_json TEXT,
  failure_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE publication_events (
  publication_id TEXT NOT NULL,
  sequence_number INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_json TEXT NOT NULL,
  previous_event_digest TEXT,
  event_digest TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (publication_id, sequence_number)
);
```

Use transactions and uniqueness constraints for slots, content and idempotency.

## Publication identity and connector contract

Derive a stable identity from:

```text
slotKey + contentHash + platformId + accountId
```

Use it internally and as the provider idempotency key where supported.

A repeated call with the same identity must return existing state and must not reserve, regenerate or publish again.

Create an explicit connector contract:

```ts
interface PublishingConnector {
  connectorId: string;
  platformId: string;
  accountId: string;

  readiness(): Promise<{ ready: boolean; reasons: string[] }>;

  publish(input: {
    idempotencyKey: string;
    contentSpec: ContentSpec;
    renderedCandidate: RenderedCandidate;
  }): Promise<{
    providerId: string | null;
    ambiguous: boolean;
    rawReceipt: unknown;
  }>;

  readBack(providerId: string): Promise<{
    found: boolean;
    providerId: string | null;
    permalink: string | null;
    ownedByExpectedAccount: boolean;
    contentHashMatches: boolean;
    publishedAt: string | null;
    evidence: unknown;
  }>;

  findPossibleDuplicates(input: {
    accountId: string;
    contentHash: string;
    earliestPossibleTime: string;
    latestPossibleTime: string;
  }): Promise<Array<{
    providerId: string;
    permalink: string | null;
    evidence: unknown;
  }>>;
}
```

An active account policy names the only approved connector. Reject mismatches before the write.

## Readiness and modes

Before mutation verify connector activation, credential reference, official account identity, scopes, quota, spacing, unresolved-write absence, media readiness, API version and explicit write authority.

Readiness failure becomes `failed_closed` with zero provider writes.

Support:

```text
shadow
canary
live
```

Shadow forces:

```text
dryRun = true
explicitWriteApproval = false
```

It exercises selection, rendering, validation, reservation simulation, readiness, duplicate checks and audit integrity with zero writes.

Canary requires one exact dated slot, one frozen content hash, one approved account and connector, at most one write, readback, duplicate discovery and visual verification.

Live requires a separate activation manifest. Credentials do not imply live authority.

## One write and ambiguous response handling

For a reserved publication:

1. verify state, connector and account;
2. persist the final payload and hashes;
3. run readiness;
4. transition to `publishing`;
5. call publish once;
6. persist response or error;
7. read back or enter reconciliation;
8. classify the result.

Do not wrap publish in automatic retry middleware.

Ambiguous responses include timeout after transmission, connection reset, missing body or provider ID, uncertain provider `5xx`, local crash after transmission, or multi-step container creation with unknown final state.

On ambiguity:

```text
state = reconciliation_required
blindRetryForbidden = true
```

The next action is readback or duplicate discovery, never another write.

## Provider readback and reconciliation

Success requires proof that the object exists, provider ID is canonical, account ownership matches, text and media match the final payload, publication time is plausible and permalink is canonical where available.

Only then set:

```text
verified_published
```

For `published_unverified` or `reconciliation_required`:

1. read by provider ID when available;
2. search possible duplicates by account, time window and content hash;
3. compare against the immutable specification;
4. classify:

```text
verified_published
confirmed_absent
verified_rejected
reconciliation_required
```

Exactly one matching object becomes verified. No object after an evidence-backed visibility window becomes confirmed absent. Explicit rejection with no object becomes verified rejected. Multiple plausible objects or unavailable readback remain unresolved.

Only a new separately approved publication identity may retry after confirmed absence or verified rejection.

## Multi-step providers and shared account admission

Represent multi-step providers as durable effects:

```text
container_planned
container_created
container_processing
container_ready
publish_requested
published_unverified
verified_published
```

Persist every provider ID. Never create another container while the first is uncertain.

When several campaign lanes use one account, create one account-level admission authority enforcing daily quota, minimum spacing, unresolved-write exclusion, cross-lane duplicate exclusion, account locking and maintenance state.

## Scheduler ownership and missed slots

Persist ownership:

```ts
interface ScheduleOwnership {
  scheduleId: string;
  owner: "legacy" | "deterministic-engine" | "graph-runtime";
  migrationId: string | null;
  effectiveFrom: string;
  previousOwner: string | null;
  status: "planned" | "shadow" | "active" | "rolled-back";
}
```

Cutover sequence:

1. inventory every trigger reaching the provider;
2. run the new path in shadow;
3. compare decisions;
4. freeze a canary slot;
5. disable the old owner for that slot;
6. activate the new owner;
7. observe the natural cycle;
8. verify provider outcome;
9. record completion.

Never leave two owners active.

Classify missed opportunities as:

```text
missed_before_reservation
missed_after_reservation
provider_unavailable
scheduler_unavailable
policy_blocked
```

Recovery must explicitly skip, create a new recovery slot, request approval or supersede. A recovery uses a new slot identity.

## Visual verification, metrics and audit

Provider readback proves existence, not presentation quality.

For media posts verify required copy, no silent truncation, correct media, legible overlays, safe crop, aspect ratio, cover frame, captions, carousel order and permalink.

Record visual verification separately from publication truth.

When a metric is unavailable:

```text
availability = unavailable
value = null
```

Do not infer revenue from engagement alone.

Append every transition with publication ID, slot key, content hash, sequence number, previous digest, event digest, actor, event type, timestamp and bounded metadata.

Do not delete failed histories.

## Operator surface and diagnostic harness

Expose authenticated governance routes such as:

```text
GET  /api/publishing/overview
GET  /api/publishing/slots
GET  /api/publishing/publications
GET  /api/publishing/audit
POST /api/publishing/slots/plan
POST /api/publishing/reconcile/:publicationId
```

Do not expose a generic provider-write endpoint.

Build a non-writing harness:

```bash
npm run publishing:harness -- validate-registry \
  --registry ./config/publishing/registry.v1.json

npm run publishing:harness -- diagnose \
  --registry ./config/publishing/registry.v1.json

npm run publishing:harness -- replay \
  --registry ./config/publishing/registry.v1.json \
  --date 2026-08-05 \
  --days 7
```

The harness must replay slots twice, prove stable selection and hashes, prove atomic reservation, suppress duplicate triggers, verify audit integrity and perform zero provider writes.

## Required tests

Test:

- registry validation and deterministic slot identity;
- eligibility, scoring and tie-break replay;
- immutable content hash and required-section validation;
- platform limits and media lineage;
- connector and account authority;
- two triggers racing for one slot;
- write plus readback becoming verified;
- provider ID without readback remaining unverified;
- readiness failure causing zero writes;
- ambiguity entering reconciliation;
- retry after ambiguity causing zero writes;
- duplicate discovery resolving exactly one object;
- several plausible duplicates remaining unresolved;
- absence only after the visibility window;
- restart resuming reconciliation;
- shared account collision blocking;
- renderer changing claims or losing required copy;
- transport truncation;
- two scheduler owners active;
- readback returning another account's object;
- process crash after transmission or provider-ID storage;
- cropped or incomplete media.

## Natural proof

Do not finish from tests alone.

### Phase A: shadow

At one natural slot prove scheduler trigger, deterministic selection, immutable content, readiness and reservation logic, zero external writes and a `shadow_verified` result.

### Phase B: canary

With explicit authority for one named slot and frozen payload, prove one owner, at most one write, official readback, duplicate absence and visual verification.

### Phase C: later natural cycle

Without manual triggering, prove one owner, one publication identity, at most one write, provider existence, account ownership, content and media match, no duplicate and a terminal next action.

## Completion contract

Do not claim completion until:

- registry validation passes;
- active connectors support readiness, readback and duplicate discovery;
- content specifications are immutable;
- SQL uniqueness protects slot, content and idempotency;
- conversational and web surfaces cannot bypass the engine;
- ambiguous writes cannot be blindly retried;
- official readback is required for success;
- visual verification exists for media;
- shared account admission is enforced;
- scheduler ownership is singular;
- restart reconciliation is tested;
- shadow mode proves zero writes;
- one canary is verified;
- one later natural slot is verified;
- no duplicate is found;
- evidence paths, IDs, permalink and audit status are reported.

Final report:

```text
Mode:
Schedule owner:
Slot key:
Publication ID:
Content hash:
Platform/account:
Connector:
Provider writes:
Provider ID:
Permalink:
Provider readback:
Content match:
Media match:
Visual verification:
Duplicate discovery:
Terminal outcome:
Metrics availability:
Audit-chain status:
Tests:
Remaining approval boundaries:
Next safe action:
```

Do not report `published` when the actual state is `published_unverified`, `reconciliation_required`, `confirmed_absent`, `verified_rejected` or `failed_closed`.
