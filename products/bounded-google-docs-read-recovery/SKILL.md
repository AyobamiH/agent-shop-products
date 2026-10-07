---
name: bounded-google-docs-read-recovery
description: Diagnose and recover bounded Google Docs reads when an application reports timeouts, generic authentication or validation errors, oversized JSON, or misleading preview success. Use for readers that combine OAuth refresh, Drive metadata and Docs content, including evidence-led WSL route diagnosis, compact responses, document integrity checks and separate runtime verification.
---

# Bounded Google Docs Read Recovery

## Establish the boundary

- Identify the affected reader, actual execution host, source revision and installed revision separately.
- Read the application's request, authentication, byte-limit and preview contracts before proposing changes.
- Confirm an authorised document and existing credential path; keep credentials in that path.
- Keep provider operations in the diagnostic phase read-only; perform source, host-configuration and deployment changes only within their separately established authority.
- Record a timestamped sequence: network connection, token refresh, Drive metadata, Docs response, validation, preview result.
- Inspect saved diagnostics first; request host output when the available terminal is a different machine.

## 1. Locate the failing network layer

- Compare the same endpoint from the affected environment and a known working environment.
- Record address family, connection result, HTTP status, elapsed time and process exit independently.
- Set connection and total deadlines; use a credential-free probe appropriate to the endpoint.
- Account for configured proxies, DNS and address selection before comparing results; do not change them blindly.
- Treat an expected HTTP rejection of an incomplete request as transport evidence only.
- Investigate an immediate connection failure with routes and interface state before blaming OAuth.
- Check effective WSL networking mode, global IPv6 addresses and a route to an observed reachable destination when WSL is involved.
- Avoid diagnosing a missing route from a curl exit number alone.

### Apply a WSL change only when the evidence supports it

- Check current Windows/WSL support and the [Microsoft networking guidance][wsl-networking].
- Consider mirrored mode only when the observed route deficit and host connectivity support that hypothesis.
- Read and back up the actual configuration; preserve unrelated values and write changed settings on separate lines.
- Read the result back; stop if it differs from the intended edit. Follow the [configuration guidance][wsl-config].
- Compare configuration-save and VM-boot timestamps; distinguish a saved setting from an effective setting.
- Account for every running distribution before a restart: `wsl --shutdown` stops all running distributions.
- Confirm restart authority for affected work, pause scheduled wake-ups and drain active or queued jobs using the application's verified procedure.
- Use a deadline and explicit readiness result; restore paused schedules on cancellation or failed drain.
- Leave restart pending if another affected workload cannot be safely interrupted within the authorised scope.
- Restore paused schedules if a ready restart is postponed.
- After restarting, verify boot time, effective networking mode, resumed schedules and endpoint connectivity.
- Avoid claiming that opening a terminal proves a VM restart or that mirrored mode fixes every WSL connection failure.

## 2. Separate authentication, metadata and document failures

- Run the real application's read path with its existing credentials and a bounded overall deadline.
- Identify the first failed stage before changing scopes, tokens or the document reader.
- Distinguish token refresh failure, Drive rejection, Docs rejection, response-size rejection and local validation failure.
- Infer success of an earlier request only from its recorded result or a verified sequential code path.
- Do not infer the failing stage from a missing version field when all error results omit that field.
- Restrict any new retry to the token-refresh operation; do not replay an entire sync or a document write.
- Retry only a failure classified as transient by the actual client/provider contract and safe for that credential flow.
- Set an attempt cap, bounded backoff and one monotonic deadline before retrying; keep existing stricter limits.
- Account for SDK retries within that same budget; avoid multiplying attempts through nested retry loops.
- Stop on invalid credentials or grants, permission denial, malformed data, response-size limits and stable validation errors.
- Surface retry exhaustion with a safe stage and error class; preserve the original failure category.

## 3. Expose a hidden exception safely

- Prefer the application's structured diagnostics over raw exception strings or verbose HTTP logging.
- If necessary, instrument only the failing read boundary for one bounded invocation.
- Allowlist stage, exception class, an independently parsed HTTP status, elapsed time and short code-frame locations.
- Omit tokens, headers, cookies, document contents, response bodies, full request URLs, local variables and identifying filesystem paths.
- Extract status from a trusted structured field or a strict known-safe error format; leave it unknown otherwise.
- Restore temporary tracing or hooks in a `finally` block, including on cancellation and exceptions.
- Match the observed code location to the running revision; avoid treating a generic exception class as the root cause.

## 4. Test compact JSON under the existing byte cap

- Confirm that the actual bounded-response check rejected the Docs response before changing request representation.
- Add `prettyPrint=false` to the Docs read using the existing query builder; preserve all other parameters.
- Use the [Google system-parameter definition][google-parameters] for the supported value.
- Keep the same byte cap, connection/read deadlines, TLS policy, parser checks and decompression safeguards.
- Enforce the cap during bounded receipt and before JSON parsing; do not introduce an unbounded intermediate buffer.
- Run one temporary preview of the changed request without applying imports, receipts or document updates.
- If the response remains too large, retain the explicit size failure and report the remaining limitation.
- Do not raise the cap, truncate content or introduce a lossy field mask merely to make the preview pass.

## 5. Preserve the complete document contract

- Preserve `includeTabsContent=true` when the reader requires all tabs; use the [Google tabs guide][google-tabs].
- Traverse every top-level tab and its `childTabs` recursively; read each tab's `documentTab` content.
- Avoid reading only the first tab or double-counting legacy document-body fields alongside tab content.
- Preserve nested tables, cells, paragraphs and the structural elements required by the existing reader.
- Preserve the established suggestion-view mode and exclusion rules; compact output must not turn proposed edits into accepted document text.
- Retain tab identities, text positions and start/end indices used by downstream reconciliation; do not regenerate positions from flattened text.
- Retain document/revision identifiers and any existing revision-based update preconditions, even during preview.
- Preserve the application's before/after Drive metadata consistency check where one exists.
- Compare each version or revision value within its own API contract; do not equate a Drive version with a Docs revision ID.
- Report changed metadata or invalid revisions as an unsuccessful coherent read; do not apply work from a mixed snapshot.
- Keep later write eligibility distinct from read success; this diagnostic workflow does not perform those writes.

## 6. Judge the real preview by its semantic result

- Print a starting message immediately and set a total deadline with a bounded termination grace period.
- Report elapsed time, semantic result, error class, safe version evidence, eligible-item count and aggregate skip reasons.
- Require the application's successful preview/read result and expected document validation evidence.
- Treat process exit zero as command completion when the payload reports unavailable or failed work.
- Explain zero eligible items from recorded skip reasons; do not label an empty import set a failed read.
- State any local credential-refresh or diagnostic writes made by preview; verify that remote updates and imports stayed disabled.
- Keep temporary request success separate from the installed reader and the saved collector observation.

## 7. Make the repair durable and reviewable

- Put the minimal successful request change in the reader's source; remove temporary diagnostic overrides.
- Add a regression that reproduces the original size failure and demonstrates the intended request parameter.
- Exercise nested tabs and tables, preserved positions/revisions, and rejection when compact JSON still exceeds the cap.
- Exercise metadata drift, permanent authentication failure and bounded transient refresh exhaustion without replaying the sync.
- Check that diagnostics omit secrets and that unavailable preview results cannot be mistaken for success.
- Record the reviewed revision and test outcomes; distinguish code review, regression checks and historical host previews.
- Use the existing authorised deployment process and verify the installed revision on the actual host.
- Read a fresh saved observation after deployment; verify its timestamp, semantic result and relevant revision association.
- Leave installation, saved-observation refresh or downstream acceptance pending when their evidence is absent.

## Report the result

Return a compact evidence table, using `unknown` or `pending` where a result has not been observed:

| Boundary | Required report |
| --- | --- |
| Network | Host/environment, probe timestamp, address family, route and endpoint result |
| Authentication | Refresh result, safe failure class and bounded attempt outcome |
| Drive and Docs | Successful stages, size-limit outcome and metadata consistency |
| Preview | Semantic result, version evidence, eligible count and skip reasons |
| Source repair | Reviewed revision and relevant regression outcomes |
| Runtime | Observed installed revision and actual host acceptance result |
| Saved observation | Observation timestamp and semantic result after installation |

Keep historical evidence dated. Describe unresolved stages without promoting preview success or reviewed code into a live installation claim.

[google-parameters]: https://docs.cloud.google.com/apis/docs/system-parameters
[google-tabs]: https://developers.google.com/workspace/docs/api/how-tos/tabs
[wsl-networking]: https://learn.microsoft.com/en-us/windows/wsl/networking
[wsl-config]: https://learn.microsoft.com/en-us/windows/wsl/wsl-config
