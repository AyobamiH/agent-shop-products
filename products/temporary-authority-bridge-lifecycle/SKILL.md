---
name: temporary-authority-bridge-lifecycle
description: Use when one repository lacks direct deployment or provider credentials but an already-authorised repository can perform a bounded operation. Reuses existing custody without copying secrets, verifies the consequence, then removes the bridge with separate proof.
---

# Temporary Authority Bridge Lifecycle

Temporary authority is an operation, not architecture.

Use this pattern only when the intended target repository cannot yet perform a bounded provider action and another already-authorised authority can do so without revealing or copying the credential.

## 1. Establish custody without reading the secret

Record:

- provider;
- authority holder;
- storage location class;
- scope;
- intended consumer/target;
- last proven usability;
- rotation status if known.

Never record the secret, token, private key or password in governance metadata.

## 2. Define the bounded bridge

Before creating anything, state:

- purpose;
- source authority;
- target;
- exact source/artifact revision;
- bounded operation;
- expiry condition;
- removal owner;
- independent acceptance check.

Do not create a general cross-repository deploy lane for a one-off acceptance test.

## 3. Fail closed on stale custody

Presence of a secret name is not proof the credential works.

Run the smallest provider-authenticated preflight allowed by the existing workflow. If the provider rejects the token, record stale/invalid custody and stop using that bridge.

Do not infer that a different repository's credential has the same state.

## 4. Use the exact target identity

The bridge should fetch or receive an immutable target revision and verify it before performing the provider action.

Do not deploy "latest main" from the authority repository when the target belongs elsewhere.

## 5. Perform one bounded consequence

Use the provider's normal deployment/action tool with the credential remaining inside its existing secret store.

Do not print, export, transfer or rewrite the credential.

Preserve provider operation/deployment identity and timestamps.

## 6. Verify outside the bridge

After the provider accepts the action, perform independent readback from the target boundary.

Examples:

- public route readback;
- provider deployment metadata;
- exact custom-domain response;
- machine-surface acceptance.

A successful workflow run alone is not enough when the public consequence is observable.

## 7. Remove the bridge

Immediately remove the temporary workflow/configuration after:

- success;
- known failure;
- abandonment.

Record removal separately from action success.

If the bridge must become permanent, stop and create a new reviewed authority decision instead of silently retaining it.

## Evidence record

```text
purpose:
authority holder:
target:
exact target revision:
credential material exposed: no
provider action:
provider result:
outside-in readback:
expiry condition:
bridge removed:
removal evidence:
remaining credential-custody gap:
```

## Completion

A bridge is complete only when both are true:

1. the bounded operation reached its declared acceptance layer or failed safely;
2. the temporary authority path has been removed or explicitly promoted by a separate decision.
