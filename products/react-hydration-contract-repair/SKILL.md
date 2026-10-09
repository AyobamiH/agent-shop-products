---
name: react-hydration-contract-repair
description: Repair React SSR hydration mismatches by preserving matching server and first-client snapshots across theme, authentication and data providers, then verify the real browser condition. Use when delayed initialization, mobile dark routes or external stores cause first-render divergence.
---

# React Hydration Contract Repair

Preserve the hydration contract and reproduce the actual mismatch.

## Capture the failing condition

Record the exact revision, route, viewport, server HTML, console errors, persisted storage, system theme, authentication state and data-provider initialization. Reproduce from a fresh navigation and reload.

Identify the actual hydrated root and which DOM nodes React owns. Do not assume the document element sits outside the root; applications can hydrate the whole document.

Read the current primary React documentation and the repository's rendering contract before changing initialization.

## Compare first snapshots

React expects the server markup and initial client render to agree. Trace theme, auth and data providers to their initial state and serialized inputs.

For an external store, make the server snapshot and hydration snapshot agree, using the framework's supported serialization or server-snapshot contract. A client-only persisted value must not silently replace the server value during the first render.

Keep initial React state stable across server and client. Defer browser-only storage reads and system preferences to a supported post-hydration boundary. Ensure dependent providers also preserve their first snapshot.

## Assign theme ownership deliberately

Where the verified root excludes the document element, apply a document-level theme class after hydration readiness through the existing DOM mechanism. Keep provider-rendered content consistent during the first React render.

If the themed node is owned by React, use the framework's supported theme and hydration approach. Do not directly mutate React-owned markup to conceal a state mismatch.

Preserve the user's stored or system theme after the safe boundary. Check theme controls and provider consumers so a class-only adjustment does not leave state permanently inconsistent.

An arbitrary number of frames, a larger timeout or suppressed warnings does not prove hydration readiness. A deliberately different client-only second pass can be valid when supported, but the first hydration pass must retain the agreed snapshot.

## Verify actual browser acceptance

Run the repository build and browser checks on affected routes. Exercise light and dark system settings, absent and stored preferences, representative desktop and mobile widths, anonymous and authenticated states where authorised.

Check fresh load, reload, navigation, theme changes, console hydration errors and functional interactions. A build passing or a screenshot looking correct does not establish absence of the race.

Use meaningful error capture so unexpected warnings fail the appropriate browser check. Do not add warning suppression as the acceptance condition.

## Report the repaired contract

Explain which initial state differed, how the server and first client now agree, which nodes own theme changes and which browser cases passed. Keep UI hydration acceptance separate from payment, attribution, deployment or downstream service acceptance.

Read [calibration cases and primary references](references/calibration-cases.md) when a delay or DOM patch appears to solve the symptom.
