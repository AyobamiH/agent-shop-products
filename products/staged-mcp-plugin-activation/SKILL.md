---
name: staged-mcp-plugin-activation
description: Diagnose and advance an MCP-backed plugin through package validation, endpoint verification, tool discovery, safe live tests, review and public connection. Use when a published skills plugin is mistaken for a working integration or an activation draft has unresolved findings.
---

# Staged MCP Plugin Activation

Identify the first unresolved acceptance layer and repair that layer with dated evidence.

## Establish the exact target

Record the existing public plugin, candidate draft, package version, package digest, MCP endpoint, deployed revision and account scope. Preserve working public listings. Reuse the same corrective draft instead of creating duplicates for each failed upload.

Read the provider's current package and submission rules before choosing a migration route. Verify whether adding MCP to an existing skills-only listing is supported; do not represent a separate initial draft as an update to the original listing.

## Validate the package boundary

Inspect the exact archive submitted to the provider. Check manifests, referenced files, tool configuration, listing URLs and required review metadata. Keep credentials and secure reviewer access outside the archive.

Verify that each referenced skill or resource exists in the package. Record archive content and digest. A valid source checkout does not prove the uploaded ZIP contains the same files.

Keep package validation, submission, approval, publication and installation as distinct states.

## Verify endpoint ownership and discovery

Use the existing authorised deployment mechanism. Preserve runtime bindings and secrets when applying a configuration-only ownership challenge. Verify the provider's domain result and actual tool discovery on the canonical endpoint.

A provider reaching the endpoint does not establish that every direct client route is unrestricted. Preserve client-specific failures separately and do not weaken edge controls or spoof identity to hide them.

## Repair semantic findings narrowly

Match each annotation to actual tool behaviour. Read-only calls to external repositories still interact with external entities; local deterministic validators can remain closed-domain. An annotation is descriptive metadata, not an authorisation mechanism.

For a compatibility-sensitive discovery change:

1. Preserve the historical fixture.
2. Name the exact tools and fields allowed to migrate.
3. Compare new discovery output against that bounded migration.
4. Reject all unrelated schema, result or digest drift.
5. Run existing contract and behavioural checks.

Do not blanket-change every tool or edit a fixture merely to make a test pass.

## Complete review evidence

Prepare the provider-required positive and negative scenarios with concrete prompts, expected tools and observable results. Run them on the submitted endpoint and supported account or client. Record actual execution separately from a written scenario definition.

Create a real, accessible walkthrough when required. A planned video, test description or screenshot is not a completed walkthrough. Enter reviewer access through the supported secure form.

Read fresh automated findings after deploying the repaired runtime. Policy edits and passing local tests do not prove that the provider's scanner is now satisfied. Document telemetry fields, recipients, retention and the scope of consent or opt-out behaviour using the actual implementation.

Preserve any applicable repository human-review gate. A green CI run or owner instruction cannot stand in for a required independent review.

## Test the public connection

After publication or installation is actually available and the action is authorised, connect the exact public listing and call the smallest representative tool with synthetic, non-sensitive input.

Inspect both output schema and semantic content, including omitted and empty optional inputs. A schema-valid handoff can still contain unwanted filler. Keep returned drafts, created projects and deployments separate.

An owner-account success proves that account's tested workflow. Keep clean-account installation, other workflows and customer availability as separate acceptance checks.

## Report the highest proved state

Return a table covering package, ownership, discovery, deployed repair, live cases, walkthrough, review, publication, connection and downstream consequence. Include exact revisions and evidence dates where safe. Name the next unresolved layer without claiming the whole integration is ready.

Read [provider notes and acceptance cases](references/provider-notes-and-cases.md) when applying this workflow to OpenAI plugin submission.
