---
name: consent-aware-plugin-measurement
description: Separate consented website measurement, operational MCP telemetry and native social activity when measuring a plugin launch. Use for GA4 property corrections, Analytics Engine queries, privacy-policy reconciliation or claims about installs, users, demand and attribution.
---

# Consent-Aware Plugin Measurement

Measure each surface according to what it actually records, then state only the supported conclusion.

## Define measurement planes

| Plane | Suitable observations | Unsupported inference |
| --- | --- | --- |
| Website | Consented page views and bounded CTA events | Plugin install or tool execution |
| MCP runtime | Allowed tool name, success/error, latency and package version | Unique people, installs or customer demand |
| Native social | Published post or scheduled queue readback | Website conversion or working integration |
| Controlled test | A dated synthetic input and actual result | Independent adoption |

Keep property, stream, hostname, dataset, endpoint, version and time window aligned. A stale property association or wrong hostname can produce believable but irrelevant data.

## Verify website behaviour

Use the deployed canonical page. Check default consent, explicit acceptance, refusal and withdrawal according to the actual implementation. Verify intended network requests and events in each state.

Check duplicate tags, stale property IDs, incorrect product labels and unbounded URL or form data. Record analytics-blocked and deployment-blocked states as unknown or unavailable rather than a measured zero.

Distinguish a website's consent controls from a server's operational telemetry. Do not claim that a chat-platform user expressed browser consent merely because the plugin made a server request.

## Minimise operational telemetry

Define an explicit allowlist of fields needed to understand service operation. Exclude prompts, tool arguments and results, credentials, repository content, raw personal data and persistent identifiers unless separately justified and authorised.

Use bounded classifications for failures. Distinguish protocol/HTTP failures from completed tool calls and tool-level errors. Preserve unknown-tool and unknown-outcome categories instead of silently counting them as successful product use.

When the implementation cannot distinguish tests from independent traffic, say so. Do not retrospectively label historical traffic as customer activity.

## Query the actual dataset contract

Record the API endpoint, SQL dialect, dataset schema, filter dimensions and UTC window before writing the query. Inspect representative rows or schema through the approved read-only path.

Apply sampling semantics for that exact API. The legacy Workers Analytics Engine SQL API uses explicit sample weights, such as SUM(_sample_interval) for represented events. Cloudflare's newer Analytics SQL API applies weights to supported aggregates itself. Do not copy a query between them without checking the contract or apply weights twice.

Keep retained-row count, sampling-weighted event estimate and distinct identifiers separate. Avoid publishing an exact people count from sampled operational events.

Use guarded denominators for rates and weighted averages. Report empty results, query errors and unavailable datasets distinctly. Keep unknown outcomes visible when calculating the classified success rate.

## Reconcile policy with implementation

Trace collection fields, recipients, cache lifetime, storage retention, access controls and deletion behaviour to actual code or provider settings. Treat cache expiry and telemetry retention as different clocks.

Describe opt-out scope precisely. Direct-client DNT or GPC handling does not prove that an intermediary forwards those signals. Correct policy copy and rerun required provider checks; an edited policy does not itself clear a privacy finding.

Keep reviewer access and sensitive diagnostics outside public archives and reports.

## Report bounded conclusions

Report the plane, target, window, query semantics, classified outcomes, sampling caveat, controlled-test caveat and remaining acceptance checks.

A success near a controlled test is consistent with that test; without a correlation mechanism it is not causal attribution. Repository tests, native publication, operational events and commercial outcomes remain separate evidence.

Use [measurement calibration cases](references/measurement-cases.md) to verify interpretations before updating launch claims.
