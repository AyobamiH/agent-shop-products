---
name: agent-subcontracting-commercial-handoff
description: Design a public, machine-readable subcontracting surface that lets autonomous agents discover a human service provider, submit a bounded job request, choose only server-authoritative published packages, and keep receipt, acceptance, payment, execution and completion as separate states.
---

# Agent Subcontracting Commercial Handoff

Use this skill when a business wants autonomous agents to bring it bounded work instead of attempting every task themselves.

The pattern is not "let agents buy anything". It is:

```text
discover
  -> inspect scope and authority
  -> submit structured job
  -> owner scope review OR published-package selection
  -> authoritative payment boundary
  -> execution
  -> outside-in outcome/readback
```

Keep those states separate.

## 1. Publish a machine-readable service contract

Expose a public service catalogue containing only facts the business can prove:

- business identity;
- canonical origin;
- supported service scopes;
- published package IDs and authoritative amounts when they exist;
- custom-scope treatment such as `quote_required`;
- structured job-intake endpoint;
- required and optional fields;
- payment-provider availability;
- authority and completion boundaries.

Do not publish:

- invented prices;
- arbitrary caller-defined commercial terms;
- unsupported payment providers;
- credentials;
- private customer data;
- repository access claims that were never granted.

If PayPal is not configured, say so. Do not advertise it because it may be possible in theory.

## 2. Give agents a stable discovery graph

Provide stable public routes such as:

```text
/agents/
/agents.txt
/llms.txt
/agent-services.json
/pricing/
/sitemap.xml
/robots.txt
```

The human page explains the contract. The JSON/text surfaces let agents consume it directly without scraping presentation markup.

Keep the canonical route shape consistent across HTML, sitemap and machine guidance.

## 3. Separate published packages from custom work

Use two procurement modes.

### Published package

A published package may expose:

- stable `planId`;
- package name;
- currency;
- server-authoritative amount;
- checkout endpoint;
- published scope URL.

The caller submits only the stable package identifier.

The server resolves price and provider identity. Do not accept caller-supplied amount, currency or Stripe price IDs.

### Custom scope

For repository fixes, audits, automation or other uncertain work:

- publish `quote_required`;
- omit a fabricated price;
- collect the requested outcome and constraints;
- scope the work before payment.

Do not force custom engineering work into a fake fixed-price checkout merely to make the API appear complete.

## 4. Accept a bounded job handoff

A useful structured request includes:

```json
{
  "contactEmail": "operator@example.com",
  "requestedOutcome": "Fix the responsive navigation and return a reviewable patch.",
  "agentName": "optional",
  "operatorName": "optional",
  "repositoryUrl": "https://github.com/owner/repo",
  "siteUrl": "https://example.com/",
  "scope": "small_repo_fix",
  "notes": "Constraints and evidence"
}
```

Require:

- a valid contact path;
- a concrete requested outcome;
- bounded field lengths;
- HTTPS URLs where supplied;
- an allowlisted scope value;
- rejection of unexpected fields that could smuggle price or authority.

Rate-limit the endpoint and keep mutation authority out of the request.

## 5. Return a receipt, not a false completion claim

A successful intake response should identify the request and its current state:

```json
{
  "success": true,
  "jobId": "...",
  "state": "received",
  "next": "scope_review_or_published_package_selection"
}
```

`received` does not mean:

- owner accepted;
- repository access granted;
- price agreed;
- payment completed;
- work started;
- work completed.

Those are later state transitions with their own evidence.

## 6. Keep payment state authoritative

For published packages, create checkout through the server-owned price catalogue.

Useful rules:

- caller sends `planId`, not amount;
- server resolves the current price;
- checkout creation is a provider consequence, not business-outcome proof;
- payment webhook/readback remains separate from job execution;
- ambiguous provider responses are reconciled before retry.

For custom work, payment follows scope/acceptance rather than preceding it blindly.

## 7. Preserve repository and production authority

Discovery is not permission.

A job request may point to a repository or site, but mutation still requires explicit authority for that target.

Before technical execution, verify:

- repository/site identity;
- authorised access path;
- requested scope;
- prohibited scope expansion;
- review/merge/deploy boundary;
- required acceptance layer.

Do not let a structured intake endpoint become an implicit grant of write access.

## 8. Make the surface discoverable without weakening trust

Use the same machine-discovery discipline as any public agent capability surface:

- canonical HTML;
- robots;
- sitemap;
- structured data that matches actual service state;
- agent/LLM guidance;
- machine-readable service JSON;
- search/index notification where appropriate.

Do not use fake ratings, fake reviews or unsupported "verified" claims.

## 9. Verify outside-in

Before calling the subcontracting surface live, read it back from the public boundary.

Check:

- agent page returns 200 and is indexable;
- canonical URL matches the live route;
- machine catalogue returns the expected business/service facts;
- published package amounts match the server catalogue;
- custom scopes remain quote-first;
- unsupported providers remain marked unavailable/not configured;
- structured job intake rejects caller-supplied price fields;
- crawler user agents are not blocked;
- public payloads contain no credentials/private data.

A green source diff or CI run is not enough when the public contract is observable.

## State model

Keep at least these states distinct:

```text
discovered
job_received
scope_review
owner_accepted
quote_issued
payment_pending
payment_verified
authority_granted
work_running
technical_readback_verified
business_outcome_verified
rejected
blocked
unknown
```

Do not collapse `job_received` into `owner_accepted`, or `payment_verified` into `work_completed`.

## Evidence record

```text
business:
canonical origin:
service-catalogue URL:
job-intake URL:
published package IDs:
custom scope rule:
payment providers proven:
payment providers not proven:
job receipt state:
authority boundary:
outside-in readback:
crawler/index notification:
remaining unknowns:
```

## Completion

Call the subcontracting surface ready only when:

- public discovery surfaces are reachable;
- service metadata matches the server-authoritative commercial contract;
- custom work cannot invent its own price;
- structured intake is bounded;
- receipt state is explicit;
- repository authority remains separate;
- payment state remains separate from execution/outcome;
- outside-in readback confirms the public contract.
