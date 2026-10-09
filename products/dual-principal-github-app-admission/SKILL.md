---
name: dual-principal-github-app-admission
description: Require selected GitHub App capability and the authenticated customer's actual repository write authority before admitting an App-backed objective. Use when installation-token metadata is mistaken for a customer's permission, or repository discovery is being promoted into write admission.
---

# Dual-Principal GitHub App Admission

Admit a repository write objective only when both principals have the required authority.

## Identify the two principals

Record the authenticated customer identity, selected installation, exact owner/repository and intended operation. Bind the checked actor to the server's trusted identity; never accept an arbitrary client-supplied login as proof.

The App installation controls machine capability. The customer controls the authority to request work for that repository. Selecting a repository or successfully listing it does not merge those principals.

Read the current GitHub App and collaborator-permission API documentation. Follow the project's existing admission boundary and credential-handling rules.

## Check App capability

Verify the selected installation can access the exact repository and has the required grants for the intended operation, such as contents and pull requests. Obtain credentials through the existing secure path.

Do not treat installation-token repository metadata or a push-like flag as the customer's role. Do not broaden installation permissions or switch to another identity to make admission pass.

Keep read discovery and write admission distinct. A successful repository read may be expected even when a write objective must be rejected.

## Check the actual customer authority

Read the current collaborator-permission endpoint for the authenticated actor on the exact repository, using a supported token and sufficient read permissions.

Bind any returned user identity to the expected customer. Require the base permission approved by the existing policy for the write objective; for a write/admin policy, read, triage and none fail. Respect the API's mapping of maintain to write and triage to read rather than guessing from a display role.

Fail closed on unknown or missing permission, identity mismatch, unsupported response, timeout, 403, 404 or other API error. Preserve a clear denial reason without exposing credentials.

Custom role names do not independently prove write permission. Use the documented effective base permission and the application's actual required policy.

## Enforce at the current boundary

Evaluate both App capability and customer authority before objective creation or model execution. Recheck at later consequential boundaries when the existing workflow requires fresh authority.

Keep the OAuth path's established semantics unless the current task explicitly changes them. Do not replace a working admission rule across every credential type while repairing the App path.

## Verify decisions and acceptance layers

Cover write/admin customer with sufficient App grants, read-only customer, missing App grant, wrong selected repository, identity mismatch, missing permission and API failures. Include maintain/triage mappings and unchanged OAuth behaviour where applicable.

Assert rejected admission creates no objective and starts no model work. A focused test suite, merged repair and successful deployment are separate from a fresh customer journey.

Return the App capability result, actor permission result, admission decision and next action. If the current actor is read-only, report the gate accurately; this skill does not grant permissions.

Read [calibration cases and primary references](references/calibration-cases.md) before equating discovery, installation or deployment with admission.
