---
name: live-dashboard-update-verification
description: Verify dashboards that receive live events or snapshots, especially when counters stop updating after a view switch, panels share DOM targets, or first-load and freshness states disagree. Trace data to the visible interface, preserve reading state, and separate browser rendering proof from collector and provider evidence.
---

# Live Dashboard Update Verification

Verify the complete path from a bounded input observation to the interface a person reads.
Identify the failed boundary before changing the collector, state reducer, or rendering code.
Treat synthetic browser checks, live transport observations, and provider truth as separate evidence.

## Establish the verification boundary

- Read repository instructions and identify the existing browser test and build commands.
- Name the affected views, values, event source, data contract, and expected update behavior.
- Record the tested source revision, build, browser, viewport, and observation interval.
- Use isolated fixtures for controlled events; do not send production messages or writes to make a counter move.
- Use live observations only within the user's existing authorization and record unavailable access.
- Define success for the affected update path; avoid interpreting it as whole-application health.

## Map data flow and target ownership

Trace these boundaries and record the owning module or handler for each:

1. Provider or fixture input and its observation time.
2. Collector result, including partial results and collection errors.
3. Transport delivery and event or snapshot identity.
4. Parsing, state reduction, revision handling, and freshness calculation.
5. Rendering subscription, DOM targets, and view switching.

For every shared live target, identify its original node, lookup mechanism, update owner, and mount lifetime.
Check for duplicate IDs, clones, stale cached references, and multiple handlers writing the same target.
Verify that a subscription reaches the intended node after navigation and subsequent events.
Keep original targets attached when hidden views share subscriptions that retain those targets.
Check node identity and connection status; a new node with the same selector does not prove continuity.
If the design intentionally unmounts a target, require explicit teardown and rebinding, and test that lifecycle.

## Prove a complete first snapshot

- Establish the documented snapshot/event ordering and how events arriving during initialization are retained.
- Verify that required targets exist before a renderer attempts to update them.
- Exercise a cold load with an early event and a complete initial snapshot.
- Check every affected summary, detail panel, counter, status, and freshness label against that snapshot.
- Detect early returns that leave only the currently visible panel initialized.
- Confirm that an event between subscription and initial rendering is buffered, replayed, or reconciled by revision.
- Do not replace missing fields with zero to make the first screen appear complete.
- Preserve partial or unknown state when the source contract permits an incomplete snapshot.

## Exercise successive events across views

Use a short deterministic sequence with distinct observation identities and visibly different expected values.
Include an unchanged value with a newer observation so freshness can be tested independently of magnitude.

1. Load the first view and assert the complete baseline.
2. Deliver the next event through the real parser and rendering path; assert its expected values.
3. Switch views and assert that the selected view reflects the accepted current state.
4. Deliver another event while a previously active view is hidden.
5. Return to that view and assert the latest values without a page reload.
6. Revisit the first view and check that it still responds to a further event.

Track source observation time, delivery time, accepted revision, rendered state, and the counter's meaning separately.
Advance a counter only according to its contract; event count and item count need not match.
Do not treat a heartbeat, successful fetch, or recent rendering time as a fresh source observation.
Where the contract defines ordering, exercise older or repeated revisions and verify the documented handling.
Use the configured freshness threshold and clock assumptions; record missing definitions as an uncertainty.

## Interpret evidence states honestly

Keep value, collection status, and freshness independently inspectable.
Use the application's names for these distinctions rather than introducing an incompatible status enum.

| State | Required interpretation |
| --- | --- |
| Known zero | A successful observation measured zero within the stated scope and time. |
| Blocked | A known permission, approval, policy, or prerequisite prevents the operation. |
| Stale | A prior observation exists but exceeds the documented freshness window. |
| Unknown | No adequate observation establishes the value or outcome. |
| Collector failure | Collection returned or recorded an error; retain any prior value with its original timestamp and qualification. |
| UI failure | Accepted state or a delivered error cannot be rendered as required by the interface contract. |

Test a genuine zero separately from absent, blocked, stale, and error fixtures.
Confirm that the UI displays a collector failure without converting it into a healthy empty result.
A missing update alone does not locate the defect: compare collection, delivery, accepted state, and DOM evidence.
If the collector failed before emitting data, report that boundary without declaring rendering broken.
If data reached accepted state and the original target failed to update, capture that narrower UI failure.

## Preserve the reader's state

- Record the focused control, selected view, filters, scroll position, and expanded content before an update.
- Assert that an unrelated event preserves the state the interface promises to retain.
- Check focused input identity and selection when updates occur while typing.
- Keep shared targets attached while hiding their panels; verify that returning restores the expected reading position.
- Avoid replacing a containing subtree merely to refresh an unrelated metric.
- Exercise pause or manual refresh behavior only where those controls exist, with their documented semantics.
- Classify intentional state changes separately from focus loss, resets, or unexpected scrolling.

## Verify in a real browser under the production policy

Use the built application with its actual content security policy and relevant response headers.
Keep CSP enforcement enabled; do not make a failing check green by bypassing the policy.
Route controlled inputs through an existing test adapter or transport fixture and label the evidence synthetic.
Exercise application subscriptions and rendering; do not directly overwrite DOM text to simulate an update.

Use bounded, awaited semantic assertions for text, values, visibility, focus, and attachment.
With Playwright, prefer its retrying locator assertions and use bounded polling for compound observations.
Remember that locator re-resolution can find a replacement node; check identity separately when it is the invariant.
Wait for the expected revision and meaning, not an arbitrary delay or a generic network-idle signal.

Capture console errors, page errors, blocked script requests, CSP violations, and failed assertion details.
Use screenshots for presentation evidence alongside assertions that prove values and state transitions.
Record actual desktop or mobile viewports exercised; a desktop pass does not establish mobile behavior.
Record reconnect, disconnect, and replay behavior as unverified unless those transitions were exercised.
A real browser with fixtures proves behavior for those fixtures, not that a live collector or provider is healthy.
For live evidence, correlate the bounded observation with the same transport, state, and visible outcome.

## Completion and handoff

Accept the bounded change only when:

- the first snapshot initializes every affected target;
- successive events remain visible across the exercised view transitions;
- node ownership and hidden-view attachment match the update contract;
- counter, revision, and freshness claims correspond to their source observations;
- known zero, blocked, stale, unknown, and failure states remain distinguishable;
- required reading and focus state survives unrelated updates;
- browser assertions pass with the tested production CSP enforced;
- unexercised viewports, reconnect paths, and live sources are explicitly identified.

Report the result in this form:

```text
Scope and source revision:
Build, browser, viewport, and CSP:
Input class: synthetic fixture / live observation
Initial snapshot and successive event identities:
Expected and observed values, revisions, and freshness:
Target ownership and attachment evidence:
Reading-state preservation:
Failure boundary and supporting observations:
Assertions and presentation evidence:
Unverified paths and next justified action:
```

Keep evidence references bounded and redact private content, identifiers, and credentials before sharing.
Do not promote fixture success into a claim that provider data is correct or the entire application is healthy.

## Reference

Use [Playwright's assertion documentation](https://playwright.dev/docs/test-assertions) for the assertion APIs supported by the project's installed version.
