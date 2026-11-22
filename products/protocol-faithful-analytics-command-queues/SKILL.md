---
name: protocol-faithful-analytics-command-queues
description: Use when an analytics SDK loads successfully but consented pageview or event hits never appear, especially where the application implements a custom gtag wrapper.
---

# Protocol-faithful analytics command queues

A loaded SDK is one gate. A correctly shaped command and an actual destination receipt are independent gates.

## Reproduce without expanding collection
1. Confirm the explicitly permitted public page, current consent decision, and approved measurement destination.
2. Verify the SDK script request completed. Do not infer a pageview or event was sent.
3. Inspect the installed command function and its queue. For the reviewed Google gtag integration, the documented global snippet uses a regular function and queues its genuine `arguments` object:
   `function gtag(){dataLayer.push(arguments)}`.
4. Compare queue entries with the provider contract. A rest-array wrapper `(...args) => dataLayer.push(args)` changes the command shape and was the observed no-hit cause in two applications.
5. Keep the correction narrow to the command adapter and add a regression that distinguishes `[object Arguments]` from `Array.isArray(entry)===true`. Creating the queue must not itself contact Google.
6. After a real consented browser exercise, separately inspect the network request and eventual authorized GA4 readback. Mark missing destination evidence explicitly.

## Privacy and authority
Preserve the existing consent selection, public-path exclusions, UTM minimisation, redaction rules, retention and withdrawal cleanup. Do not use this diagnosis to silently override visitor choices.

## Acceptance
Tests catch wrong command shape before deployment. A verified browser request and provider-side event are separate later acceptances. Do not infer qualified leads or revenue from successful measurement.

**Evidence boundary:** The relevant targeted source repairs were merged in OneClickPostFactory PR #44 and Global Bill Forge PR #10 on 21 October 2026. Their merged state proves reviewed source availability, not live GA4 collection or customer conversion.
