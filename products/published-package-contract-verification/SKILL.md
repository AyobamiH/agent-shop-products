# Published Package Contract Verification

## Purpose

Use this skill when a library or CLI works inside its source repository but consumers fail after installing the published package.

The skill treats the shipped package as a separate product boundary. It verifies JavaScript/runtime files, package metadata, exports, declaration files, and consumer compilation from the perspective of an installed user rather than trusting source-only checks.

## Use this skill when

- a package publishes `.d.ts`, `.d.mts`, or `.d.cts` files;
- consumers report `TS2307`, `TS4023`, missing declarations, or unresolved package imports;
- `skipLibCheck: true` hides a failure;
- a monorepo build passes while the npm artifact fails;
- public declarations reference workspace-only or dev-only packages;
- runtime bundling and declaration bundling use different dependency rules;
- a package export works from source but not through the built package entry.

## Core principle

Source correctness is not package correctness.

Verify this chain independently:

```text
source
  -> build configuration
  -> generated runtime artifact
  -> generated declaration artifact
  -> package.json files/exports/dependencies
  -> packed or installed consumer view
  -> consumer compiler/runtime
```

A passing source typecheck does not prove the published declaration graph is installable.

## Evidence hierarchy

Prefer evidence in this order:

1. consumer compilation against the built or packed package;
2. inspection of the generated declaration entrypoint;
3. package `exports`, `types`, `files`, dependencies and peers;
4. build-tool configuration that produced the artifact;
5. source-level typechecking.

Do not reverse this order when deciding whether the package contract is healthy.

## Workflow

### 1. Establish the package boundary

Record:

- package name;
- current source revision;
- package version;
- runtime entrypoints;
- declaration entrypoints;
- public exports;
- files included in the package;
- dependencies;
- peer dependencies;
- optional dependencies;
- dev dependencies.

Classify every external module referenced by the shipped artifact as one of:

```text
shipped in package
runtime dependency
peer dependency
optional dependency
bundled private dependency
invalid leak
```

A dev dependency is not available to consumers merely because it exists in the monorepo.

### 2. Reproduce as a consumer

Create the smallest consumer program that imports the affected public symbol through the public package name.

Example:

```ts
import type { PublicType } from "package-name";

export const value: PublicType = {};
```

Use a consumer-oriented TypeScript configuration with:

```json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": false,
    "noEmit": true
  }
}
```

Resolve through the package's real `package.json` exports. Do not import source files directly.

### 3. Preserve the red state

Before changing the implementation, record:

- exact base commit;
- exact reproduction commit;
- command;
- exit code;
- compiler diagnostics;
- generated declaration path;
- whether `skipLibCheck: true` changes the result.

A useful regression test must fail for the intended reason before the fix.

When CI is used for proof, keep the pre-fix SHA immutable. Do not rely on a workflow run that was cancelled after a branch update.

### 4. Find the declaration-generation layer

Inspect the tool that creates the published declarations separately from the runtime bundle.

Common examples:

- tsup / rollup-plugin-dts;
- tsdown;
- TypeScript declaration emit;
- API Extractor;
- custom declaration rollup scripts.

Ask:

```text
Which dependencies does the runtime bundler inline?
Which dependencies does the declaration bundler inline?
Which dependencies are intentionally external for consumers?
Are those two boundaries consistent?
```

Fix the generator or bundler. Never edit generated `.d.ts` output directly.

### 5. Repair the dependency boundary

Preserve legitimate externals:

- declared runtime dependencies;
- declared peer dependencies;
- platform/native packages intentionally resolved at runtime.

Bundle or otherwise eliminate references to private build-only dependencies from public declarations.

Prefer an explicit bounded list when only a known set of private packages belongs in the declaration rollup. Match package subpaths when required.

Do not solve a declaration leak by automatically promoting private workspace packages to runtime dependencies. That changes installation and supply-chain surface and may violate the package's bundling policy.

### 6. Install a consumer regression

The permanent regression should:

- run after the package build;
- import from the package name or public export;
- resolve the built artifact rather than source;
- use `skipLibCheck: false`;
- fail on unresolved declaration imports;
- avoid duplicating the implementation's private dependency list.

One public import is often enough because TypeScript loads the declaration entrypoint and its transitive graph.

### 7. Prefer an installed-consumer fixture over a workspace-only harness

When the repository already has a fixture that installs or links the built package through the same package-manager path used by consumers, extend that fixture before creating a new source-level harness.

A strong fixture should:

- depend on the package through its package boundary rather than importing source;
- run after the package build;
- compile code that already imports a real public export;
- set `skipLibCheck: false`;
- exercise the declarations that will actually be packed or installed.

This is stronger than adding a workspace-only test beside the package because monorepo resolution can accidentally make private packages available and hide the defect.

If an existing fixture already imports the public package, changing only its compiler strictness can be enough to turn it into a declaration-contract regression without duplicating test code.

### 8. Verify package self-resolution deliberately

Inside a package repository, a self-name import such as:

```ts
import type { PublicType } from "package-name";
```

is useful only when the test resolves through the built package export or an installed fixture. Confirm the resolution path.

Do not assume that seeing the package name in source means the compiler is reading the published declaration entry. Use one or more of:

- an installed-package fixture;
- `tsc --traceResolution`;
- package-manager isolation;
- inspection of the resolved `.d.ts` path;
- a build-order dependency that guarantees the artifact exists first.

The acceptance boundary is the consumer-visible declaration file, not the spelling of the import.

### 9. Prefer repository-native artifact invariants before network fixtures

Before adding a consumer test that runs a fresh package-manager install, inspect the repository for an existing artifact or dependency validator that already owns the invariant.

Prefer a deterministic built-artifact check when the defect can be expressed as:

```text
published declaration import
  -> package name
  -> declared runtime/peer dependency OR bundled private dependency
```

This keeps fast type/check lanes independent of registry availability and avoids duplicating package-policy logic.

Use a packed or installed consumer test when the failure depends on package-manager behaviour, export resolution, file inclusion, or transitive installation semantics that a static artifact invariant cannot prove.

### 10. Verify the exact pinned build-tool semantics

When the fix depends on a bundler option, read the implementation for the exact pinned tool version rather than reasoning from a current documentation page or from another major version.

Establish:

- which dependency classes the tool marks external before resolution;
- whether subpath imports are matched;
- whether a boolean resolve mode differs from an explicit allowlist;
- how peer and production dependencies are treated;
- whether the option affects runtime output, declaration output, or both.

Record those semantics before choosing a broad option such as "resolve all remaining declarations".

### 11. Separate independent declaration failures

One consumer compile can fail through several installed packages at once.

Partition diagnostics by package and ownership layer before claiming completion. If a top-level package and one of its dependencies both publish broken declarations, repairing one does not prove the full consumer compile is clean.

Use scoped language such as:

```text
addresses the Wrangler declaration leaks reported in #123
dependency-side declaration errors remain tracked in #456
```

Do not use "Fixes #123" when the issue will still reproduce for an independent reason outside the patch's ownership boundary.

### 12. Verify the green state

Require:

```text
consumer typecheck exit 0
generated declaration inspected
package metadata still consistent
targeted package typecheck passes
relevant unit/integration tests pass
lint/format checks pass
changeset/release metadata correct when user-visible
working tree/diff contains only intended changes
```

If CI is used, record the exact fixed SHA and compare it with the red SHA.

## Important distinction: runtime bundle vs declaration bundle

A package can correctly bundle runtime JavaScript while publishing declarations that still import private packages.

Treat these as independent graphs:

```text
runtime dependency graph
type declaration dependency graph
```

Both must satisfy the public package boundary.

## Monorepo rule

Workspace availability is not consumer availability.

A declaration is broken when it references a workspace package that:

- is not shipped in the package;
- is not bundled into declarations;
- is not declared as a consumer dependency or peer.

Local TypeScript resolution can hide this because every workspace package exists during development.

## skipLibCheck rule

Never use `skipLibCheck: true` as the fix for a package's own broken declarations.

It is a diagnostic comparison only:

```text
false fails + true passes
  -> strong signal that the published declaration graph is defective
```

The package should remain consumable by projects that choose full declaration checking.

## Review checklist

Before proposing the change:

- [ ] Issue still reproduces on current main or current package artifact.
- [ ] No competing PR already owns the fix.
- [ ] Repository contribution and package-specific instructions were read.
- [ ] Regression imports the public package entry.
- [ ] Regression fails before the fix for the expected reason.
- [ ] Generated files are not hand-edited.
- [ ] Runtime dependencies were not expanded without necessity.
- [ ] Legitimate public externals remain external.
- [ ] Fixed declaration artifact contains no unresolved private imports.
- [ ] Exact red and green revisions are recorded.
- [ ] Required changeset/release note is present.
- [ ] PR description explains user impact and the package-boundary repair.

## Anti-patterns

Do not:

- trust only `tsc` against source;
- test private source paths instead of package exports;
- hide errors with `skipLibCheck`;
- add every missing import as a production dependency;
- patch generated declaration files;
- claim a package is fixed without inspecting the built artifact;
- use a green test that never failed before the implementation;
- let a branch update erase the only red CI evidence.

## Output

Finish with:

```text
Package:
Base revision:
Public entry:
Declaration entry:
Consumer reproduction:
Red revision:
Red result:
Root cause:
Declaration-build layer:
Private dependencies resolved/bundled:
Legitimate externals preserved:
Green revision:
Green result:
Artifact inspection:
Package metadata check:
Changeset:
Remaining limitations:
```
