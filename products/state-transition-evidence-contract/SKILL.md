---
name: state-transition-evidence-contract
description: Use when a system needs to stop conflating configuration, execution, provider acceptance, deployment, readback and outcome. Defines a multi-axis state contract, GREEN rule, evidence freshness and safe retry rules.
---

# State-Transition Evidence Contract

Use this skill when a workflow can produce a real-world consequence and a single `success` boolean would hide important uncertainty.

## Core rule

GREEN means the highest acceptance layer required by the work profile has passed with current evidence.

A lower-layer pass never promotes a higher layer.

## Model state on separate axes

Keep at least these axes separate:

- **availability:** unknown, discovered, present, installed, enabled, authenticated, runnable;
- **execution:** not_started, running, succeeded, failed_safe, failed_unsafe, blocked;
- **consequence:** none, attempted, accepted, rejected, ambiguous;
- **readback:** unknown, pending, matched, mismatched, unavailable;
- **outcome:** unknown, pending, verified, failed, not_applicable;
- **evidence:** claimed, observed, independently_verified, disproved;
- **freshness:** current, stale, superseded.

Do not compress these axes into one terminal label merely for dashboard convenience.

## Define acceptance layers before execution

For each work profile, identify the highest layer required:

1. exact source or configuration identity;
2. bounded local validation;
3. repository-native CI;
4. provider acceptance;
5. deployment or provider-side creation;
6. outside-in readback;
7. user or business outcome.

Write the required layer before performing consequential work. This prevents later redefinition of "done".

## Preserve unknown and ambiguity

Missing evidence remains `unknown`.

A missing response after a mutation is `ambiguous` until reconciled. Inspect provider state, operation identity, durable receipts or outside-in effects before retrying.

Never convert:

- timeout -> failure;
- provider 202 -> completed outcome;
- deploy command exit 0 -> live acceptance;
- sitemap submission -> indexed;
- queued job -> completed job.

## Bind evidence to identity and time

Every consequential observation should identify:

- subject or operation;
- exact revision/artifact/provider object when available;
- observed_at;
- evidence source;
- verifier identity or boundary;
- freshness state.

If the subject changes, old evidence becomes stale or superseded instead of silently remaining current.

## Keep verification independent

The executor may report what it attempted, but independent verification must come from another boundary when available:

- provider read API;
- public route readback;
- immutable CI record;
- independent verifier;
- downstream outcome.

Do not ask the same component to certify its own consequential effect when an external readback exists.

## Retry safely

Before repeating a consequential mutation:

1. classify the previous consequence;
2. if `ambiguous`, reconcile;
3. if provider accepted, read back;
4. if readback mismatches, diagnose rather than blindly replay;
5. use idempotency/correlation where supported;
6. preserve prior receipts.

## Render human status from the same contract

Dashboards and documentation should project the canonical state instead of maintaining independent colour labels.

An amber or red indicator should explain:

- current state;
- evidence;
- what remains unknown;
- next safe action;
- owner;
- staleness threshold.

## Completion

Report the highest verified layer, not the most optimistic interpretation.

A good completion statement distinguishes:

```text
source:
local validation:
CI:
provider acceptance:
deployment:
outside-in readback:
outcome:
remaining unknowns:
```
