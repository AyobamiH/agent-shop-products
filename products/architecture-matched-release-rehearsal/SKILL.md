---
name: architecture-matched-release-rehearsal
description: Use for retiring CI runner images and changes affecting native, architecture-specific release binaries, especially when upstream workflow execution is unavailable.
---

# Architecture-matched release rehearsal

A workflow YAML edit proves the matrix changed, not that a target release binary can be built and executed.

## Freeze the release claim
1. Locate each required job and its image, target architecture, packaging script and smoke-test definition.
2. Find the actual provider deprecation or failure evidence. Distinguish impending disruption from a job already observed cancelled.
3. Pin the exact candidate commit and original build commands. Avoid silently testing a different source.

## Rehearse the real target
1. Execute on genuine target architecture and OS with the expected toolchain, not a generic host labelled compatible.
2. Build each required artefact separately. Record native arch, image/version, process status, build size and SHA-256.
3. Run the project's existing upstream smoke scripts. Record expected unavailable external-service responses without converting them to binary failure or end-to-end success.
4. Save CI job links, logs and digest readbacks at the exact source SHA.

## Preserve the contribution and release boundary
If a maintainer lands the same correction through another PR, attribute the observation accurately and mark the original contribution superseded. Merge, upstream release-run admission, production binary publication and customer adoption are distinct outcomes.

## Acceptance
All required architecture-sensitive artefacts have independently inspectable native build/smoke receipts. Any unexecuted upstream jobs stay explicitly open.

**Evidence boundary:** AMD GAIA contribution PR #6172 supplied genuine macOS 15 Apple Silicon freeze/smoke evidence for both required darwin-arm64 sidecars and was closed as superseded. The matching upstream matrix correction merged through #6182. The original contribution's separate CircleCI evidence is not AMD's own production release run.
