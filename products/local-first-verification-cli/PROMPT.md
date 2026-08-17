# Local-first verification CLI

A production prompt for building a stack-aware, read-only command-line tool that separates verified facts from warnings, failures, skipped checks and unverified production claims before developers trust AI-generated changes.

This prompt is based on the working `opstruth` CLI. It resolves a safe project boundary, detects the repository stack, selects relevant probes, gathers evidence without mutating the project or external systems, and produces both human-readable and machine-readable proof reports.

## Requirements

- Node.js 20 or newer, or an equivalent cross-platform CLI runtime.
- A repository containing source code, configuration or deployment metadata.
- A test runner.
- A safe subprocess execution layer.
- Optional explicit inputs for production routes, local runtime, hosted CI or already-collected provider evidence.
- A dedicated evidence-output path when reports should be written.

The CLI must not claim that a repository is production-ready merely because static checks pass.

## Prompt: build a local-first verification CLI

Paste everything below the line into an AI coding assistant. Replace bracketed package names, supported stacks and command names where required, but preserve the proof categories, safety model, probe contracts and completion standard.

---

Build a production-grade local-first verification CLI named `[CLI NAME]`.

The product exists to answer:

```text
What changed?
What is configured?
What looks risky?
What was verified?
What was not verified?
What should happen next?
```

Use this flow:

```text
RESOLVE PROJECT BOUNDARY
  → DETECT STACK
  → LOAD SAFE CONFIG
  → SELECT RELEVANT PROBES
  → EXECUTE READ-ONLY CHECKS
  → COLLECT EVIDENCE
  → CLASSIFY RESULTS
  → EXPOSE PROOF GAPS
  → WRITE EVIDENCE PACK
  → RECOMMEND NEXT SAFE STEP
```

## Objective

The CLI must prove:

1. which directory was inspected;
2. why that directory is the project boundary;
3. which stack and platforms were detected;
4. which probes were eligible;
5. which probes actually ran;
6. which checks passed;
7. which warnings or failures were observed;
8. which probes were skipped and why;
9. which claims remain unverified;
10. what each probe proves and does not prove;
11. whether any state-changing command was executed;
12. which next safe input or action would improve confidence.

The CLI must not convert missing evidence into confidence.

## Core principles

Use these rules throughout the implementation:

```text
Skipped is not failed.
Unverified is not safe.
Configured is not running.
A successful command is not production proof.
CI is not production.
A repository scan is not a security audit.
Secret references are not automatically leaked secrets.
An unavailable metric is not zero.
Read-only by design must be enforced, not advertised only in documentation.
```

## Safety model

The default CLI must not:

- deploy;
- publish;
- mutate a database;
- trigger jobs or queues;
- restart services;
- kill processes;
- install packages;
- call external AI APIs;
- modify Git history;
- write source or configuration files;
- print raw secrets;
- open `.env` values by default;
- refresh OAuth tokens;
- perform provider writes.

Allowed writes are limited to:

- an explicitly selected evidence report;
- an explicitly requested starter configuration;
- disposable fixture output during the CLI's own tests.

Document every write surface.

## Package shape

Use a structure equivalent to:

```text
cli/
  bin/
    verification-cli.js
  src/
    cli.js
    orchestrator.js
    commands/
      repo.js
      quality.js
      secrets.js
      routes.js
      local.js
      github-ci.js
      database-static.js
      database-live.js
      deployment.js
      evidence.js
      probes.js
    lib/
      boundary.js
      detect.js
      config.js
      command-policy.js
      subprocess.js
      probe-catalogue.js
      result.js
      redaction.js
      report.js
      schema.js
  schemas/
    config.schema.json
    result.schema.json
    evidence.schema.json
  test/
    fixtures/
    unit/
    integration/
docs/
  probe-quality-model.md
  safety-model.md
  configuration.md
  completion-gate.md
scripts/
  run-fixture-matrix.sh
  verification-cli-completion-gate.sh
```

Prefer dependency-light implementation and deterministic output.

## Project boundary

Resolve the project boundary in this order:

1. explicit `--project-root`;
2. detected Git root;
3. current working directory with safety ignores.

Return:

```ts
interface ProjectBoundary {
  root: string;
  method: "explicit" | "git_root" | "current_directory";
  gitDetected: boolean;
  warning: string | null;
  ignoredPatterns: string[];
}
```

When no Git repository exists, report:

```text
No Git repository was detected. The CLI is scanning only the current directory
with safety ignores. Run inside a project repository for stronger boundaries.
```

Never walk into parent directories beyond the resolved root.

Reject:

- filesystem root;
- a home directory without explicit approval;
- symlink escapes;
- device files;
- mounted secret directories;
- paths outside the project boundary.

## Stack detection

Detect stack from evidence such as:

- package manifests;
- lockfiles;
- source extensions;
- framework configuration;
- infrastructure files;
- database directories;
- CI workflows;
- deployment manifests.

Represent:

```ts
interface StackDetection {
  languages: string[];
  frameworks: string[];
  runtimes: string[];
  packageManagers: string[];
  testFrameworks: string[];
  deploymentPlatforms: string[];
  databasePlatforms: string[];
  confidence: "high" | "medium" | "low";
  evidence: string[];
}
```

Support evidence for stacks such as:

```text
TypeScript
JavaScript
React
Vite
Next.js
Node ESM
Vitest
Playwright
Supabase
Cloudflare Workers
Docker
GitHub Actions
Vercel
Netlify
```

Do not declare a platform active merely because a dependency exists.

Use:

```text
Supabase structure detected.
Cloudflare configuration detected.
GitHub Actions workflow present.
```

Not:

```text
Supabase production is healthy.
Cloudflare deployment is live.
CI passes.
```

## Probe contract

Every probe must expose:

```ts
interface ProbeDefinition {
  id: string;
  name: string;
  area: string;
  mode: "automatic" | "optional" | "manual_only";
  safetyLevel:
    | "safe_readonly"
    | "approval_required"
    | "dangerous_disabled";
  mutability: "none" | "evidence_only" | "state_changing";
  description: string;
  supportedStacks: string[];
  inputsRequired: string[];
  evidenceCollected: string[];
  proves: string[];
  doesNotProve: string[];
  passCondition: string;
  warningCondition: string;
  failCondition: string;
  skippedCondition: string;
  falsePositiveRisk: string;
  falseNegativeRisk: string;
  proofLimitation: string;
  skipReason: string;
  nextSafeStep: string;
  notVerified: string[];
}
```

A probe is an evidence contract, not merely a shell command.

Every probe must explain:

- what it checks;
- why it matters;
- what evidence it returns;
- what a pass means;
- what a pass does not mean;
- why it may skip;
- which input would improve confidence.

## Probe selection

Select probes from:

- stack detection;
- project configuration;
- explicit CLI flags;
- safe default policy;
- `--skip` and `--only` filters.

Support:

```bash
[cli]
[cli] --only repo
[cli] --only secrets
[cli] --skip routes
[cli] --base-url https://example.com
[cli] --port 3000 --health /health
```

Automatic selection must include only probes that are:

```text
safe_readonly
mutability none
relevant to the detected stack or explicit input
```

Manual-only probes must never run from the default command.

## Result contract

Use one result shape for every command and aggregate run:

```ts
type ProofStatus =
  | "pass"
  | "warn"
  | "fail"
  | "skipped"
  | "blocked"
  | "error";

interface CheckEvidence {
  checkId: string;
  status: ProofStatus;
  summary: string;
  evidence: string[];
  limitations: string[];
}

interface ProofResult {
  command: string;
  status: ProofStatus;
  summary: string;
  verified: string[];
  warnings: string[];
  failures: string[];
  findings: Array<{
    id: string;
    area: string;
    severity: "info" | "low" | "medium" | "high" | "critical";
    title: string;
    evidence: string[];
    limitation: string | null;
    nextSafeStep: string;
  }>;
  skipped: string[];
  notVerified: string[];
  checks: CheckEvidence[];
  data: Record<string, unknown>;
  nextSafeStep: string;
}
```

Do not use one undifferentiated `issues` array.

## Status aggregation

Use this severity order:

```text
error
fail
blocked
warn
skipped
pass
```

Apply these rules:

- a nominal pass with skipped or unverified areas becomes `warn`;
- in strict mode, a nominal pass with selected skipped or unverified areas becomes `fail`;
- optional network unavailability may remain a warning;
- a required timeout is a failure;
- malformed configuration is a warning or failure according to impact;
- an internal exception is `error`.

Do not let a later passing check erase an earlier failure.

## Strict mode

Support:

```bash
[cli] --strict
```

Strict mode should fail when:

- a required check fails;
- a required check times out;
- selected proof remains skipped;
- selected proof remains unverified;
- evidence output is malformed;
- JSON output does not validate;
- a prohibited mutating probe is selected;
- a secret value would be printed.

Strict mode must not automatically enable more invasive checks.

## Command surface

Implement a command surface equivalent to:

```bash
[cli]
[cli] welcome
[cli] init
[cli] repo
[cli] quality
[cli] github-ci
[cli] routes
[cli] secrets
[cli] database-static
[cli] database-live
[cli] deployment
[cli] local
[cli] evidence
[cli] probes
```

Adapt names to the supported stacks.

The default command orchestrates safe relevant checks.

## Repository probe

Inspect read-only Git evidence:

```text
repository root
branch
HEAD
working-tree status
tracked modifications
untracked paths
diff check
diff statistics
recent commit context
conflict markers
remote names without credentials
```

Do not run:

```text
fetch
pull
push
checkout
reset
clean
stash
commit
tag
merge
```

Classify:

- clean;
- dirty;
- detached;
- conflicted;
- not a Git repository;
- remote metadata unavailable.

A clean repository does not prove correct code.

## Quality probe

Treat quality signals separately:

```text
lint
typecheck
unit tests
integration tests
browser tests
build
hosted CI
```

Do not combine them into one `tests passed` statement.

For each command, record:

```ts
interface QualitySignal {
  id: string;
  configured: boolean;
  attempted: boolean;
  status: "passed" | "failed" | "skipped" | "timed_out";
  command: string | null;
  exitCode: number | null;
  durationMs: number | null;
  evidence: string[];
  proves: string[];
  doesNotProve: string[];
}
```

Before automatically running a package script, inspect its command.

Reject scripts containing unapproved:

- deploy;
- publish;
- migrate;
- seed;
- install;
- service start or stop;
- destructive Git;
- provider writes.

Build commands may create artifacts. Treat them as optional completion-gate operations rather than default zero-write probes unless isolated output is approved.

## Hosted CI proof

Hosted CI must be explicit and opt-in.

Accept:

```bash
[cli] github-ci --workflow CI
[cli] --github-ci
```

Prove:

- workflow identity;
- run identity;
- commit SHA;
- conclusion;
- event;
- branch;
- timestamp.

CI proof must match the exact local commit or report the mismatch.

Return one of:

```text
CI passed for exact commit
CI passed for another commit
CI failed
CI unavailable
CI not requested
```

CI is not deployment or production proof.

## Secret-reference probe

Scan without printing values.

Classify findings:

```text
actionable_source
documentation_reference
placeholder_or_example
local_only_file
generated_or_dependency
ignored_binary
unknown_review_item
```

Return:

```ts
interface SecretFinding {
  findingId: string;
  path: string;
  line: number | null;
  category: string;
  detector: string;
  redactedPreview: string;
  confidence: "high" | "medium" | "low";
  tracked: boolean | null;
  ignored: boolean | null;
  nextSafeStep: string;
}
```

Never output:

- complete tokens;
- passwords;
- private keys;
- authorization headers;
- `.env` values;
- OAuth refresh tokens.

Distinguish:

```text
secret-like reference
confirmed secret exposure
placeholder
documentation
unknown
```

A variable name such as `API_KEY` is not itself a leaked key.

## Route probe

Route proof requires explicit input:

```bash
[cli] routes --base-url https://example.com
```

Accept a bounded allowlist of route paths.

Use:

- GET or HEAD only;
- a short timeout;
- a controlled redirect policy;
- no authentication mutation;
- no form submission;
- no queue-trigger endpoints.

Record:

```ts
interface RouteEvidence {
  path: string;
  method: "GET" | "HEAD";
  statusCode: number | null;
  finalUrl: string | null;
  latencyMs: number | null;
  expectedStatus: number[];
  contentChecks: string[];
  result: "verified" | "warning" | "failed" | "not_verified";
}
```

A route returning HTTP 200 proves only the checked response at that time.

It does not prove:

- complete application health;
- correct authentication;
- database correctness;
- background-worker health;
- a business outcome.

## Local runtime probe

Require explicit safe inputs:

```bash
[cli] local --port 3000 --health /health
[cli] local --process node
[cli] local --service app.service
```

Check separately:

```text
process observed
port listening
health endpoint passed
service active
readiness unknown
```

Do not start the runtime.

Do not install dependencies.

Do not kill processes.

A listening port is not full readiness.

## Static database-platform probe

For platforms such as Supabase, inspect repository structure:

- migration directories;
- client configuration references;
- generated types;
- policy files;
- server-only versus browser references;
- public-key versus service-role reference names.

Do not:

- connect to production automatically;
- apply migrations;
- query private data;
- print credentials;
- use service-role keys.

Static structure proves configuration shape, not live policy enforcement.

## Live database evidence

Live proof must be explicit and preferably local-file driven.

Accept already-collected redacted evidence:

```bash
[cli] database-live --evidence-file ./redacted-evidence.json
[cli] database-live --telemetry-file /tmp/redacted-telemetry.json
```

Validate:

- schema;
- provenance;
- capture time;
- environment;
- query or telemetry identity;
- redaction state;
- result;
- limitations.

Do not make provider calls from this command unless a separate read-only connector is explicitly designed and authorised.

Do not treat user-authored JSON as independent truth without provenance.

## Deployment-platform probe

Detect safe static metadata for:

- Cloudflare Wrangler;
- Docker;
- Vercel;
- Netlify;
- GitHub Actions deploy workflows;
- package deployment scripts.

Report:

```text
configured
not configured
ambiguous
not verified live
```

Do not deploy or execute provider CLIs in the default run.

A configuration file proves only repository configuration.

## Evidence pack

Support:

```bash
[cli] --out evidence/report.md
[cli] --json
```

Human report:

```markdown
# Verification Report

## Status

## What Matters Most

## Verified

## Warnings

## Failures

## Findings

## Skipped Or Not Configured

## Not Verified

## Stack

## Probe Selection

## Safety Boundary

## Overall Confidence

## Next Safe Step
```

Machine output must:

- be ANSI-free;
- be valid JSON;
- use stable keys;
- include package and schema versions;
- include project boundary;
- include probe metadata;
- include selected and skipped probes;
- include every child result;
- include safety flags;
- include the next safe step.

## Human output

Use calm status language.

Prefer:

```text
STATUS: Partial pass
No failures
2 warnings
Production route availability was not checked
```

Avoid:

```text
Everything looks great!
Your app is safe!
Production ready!
```

Colour must be optional:

```bash
[cli] --color
[cli] --no-color
NO_COLOR=1 [cli]
```

JSON output must never contain ANSI codes.

## Configuration

Support a project-local configuration such as:

```json
{
  "schemaVersion": "1.0.0",
  "routes": {
    "baseUrl": null,
    "paths": []
  },
  "local": {
    "ports": [],
    "healthPaths": []
  },
  "github": {
    "ci": {
      "enabled": false,
      "workflow": null
    }
  },
  "secrets": {
    "allowlist": [],
    "ignoredPaths": []
  }
}
```

Generate it only on explicit request:

```bash
[cli] init --yes
```

Validate configuration.

Config must not contain secret values.

## Probe catalogue command

Implement:

```bash
[cli] probes
[cli] probes --json
```

Expose:

- the full catalogue;
- eligible probes;
- skipped probes;
- skip reasons;
- required inputs;
- proof limitations;
- next safe steps;
- supported stacks;
- safety levels;
- mutability.

This makes automatic selection inspectable.

## Default orchestrator

The default command should:

1. resolve the boundary;
2. detect the stack;
3. load validated configuration;
4. select safe probes;
5. run repository proof;
6. run secret-reference proof;
7. run safe configured quality proof;
8. conditionally run static platform probes;
9. run CI only when opted in;
10. run routes only when a base URL exists;
11. run local runtime only when explicit input exists;
12. aggregate status;
13. write evidence unless disabled;
14. recommend the highest-value next safe step.

Example pseudocode:

```ts
async function runVerification(options: Options): Promise<ProofResult> {
  const boundary = await resolveProjectBoundary(options.cwd);
  const stack = await detectStack(boundary.root);
  const selection = await selectProbes({ boundary, stack, options });
  const results: ProofResult[] = [];

  results.push(await runRepo(options));
  results.push(await runSecrets(options));
  results.push(await runQuality(options));

  if (stack.databasePlatforms.includes("Supabase")) {
    results.push(await runSupabaseStatic(options));
  } else {
    results.push(skipped(
      "supabase",
      "No Supabase structure detected.",
      "Supabase exposure was not verified."
    ));
  }

  if (options.githubCi) {
    results.push(await runGitHubCi(options));
  }

  if (options.baseUrl) {
    results.push(await runRoutes(options));
  } else {
    results.push(skipped(
      "routes",
      "No base URL was provided.",
      "Public route availability was not verified."
    ));
  }

  if (options.port || options.process || options.service) {
    results.push(await runLocal(options));
  } else {
    results.push(skipped(
      "local",
      "No local runtime input was provided.",
      "Local runtime liveness was not verified."
    ));
  }

  return aggregate(results, selection, options);
}
```

## Next safe step

Choose one recommendation using this priority:

1. fix a failure;
2. investigate a high-severity warning;
3. supply a safe missing input for an important proof gap;
4. review unknown secret-like findings;
5. attach the evidence pack to the change;
6. no further action for the requested scope.

Do not recommend deployment merely because static checks pass.

## Exit codes

Define stable exit semantics:

```text
0 = handled result with no strict failure
1 = proof failure or strict proof gap
2 = usage error
3 = safety refusal
4 = missing required input
5 = internal error
```

A warning may return zero in normal mode and non-zero in strict mode.

## Command safety layer

Wrap subprocess execution:

```ts
interface CommandPolicyDecision {
  allowed: boolean;
  reason: string;
  classification:
    | "safe_readonly"
    | "evidence_write"
    | "approval_required"
    | "dangerous_disabled";
}
```

Inspect:

- executable;
- arguments;
- working directory;
- environment keys;
- timeout;
- output limit.

Block command classes for:

```text
deploy
publish
migrate
seed
database writes
service restart
process kill
destructive Git
package installation
provider mutation
secret printing
```

Do not rely on regular expressions alone.

Prefer explicit allowlisted command builders.

## Timeouts and output bounds

Every subprocess needs:

- a named step;
- timeout;
- maximum stdout;
- maximum stderr;
- killed-state reporting;
- exit code;
- duration.

A timeout is not a pass.

Report:

```text
step
timeout
required or optional
suggested rerun or investigation
```

## Error handling

Expected operational states must not crash the whole CLI.

Examples:

- Git unavailable;
- an optional platform absent;
- malformed config;
- route timeout;
- service manager unavailable;
- hosted CI unreachable.

Represent them as structured results.

Internal programming defects should return `error` and exit code 5.

## Privacy

Avoid collecting unnecessary data.

Do not include:

- full file contents;
- unrelated source code;
- environment values;
- private user data;
- Git URLs containing credentials;
- complete provider responses;
- unbounded logs.

Evidence must be sufficient and bounded.

## Testing

### Boundary tests

Test:

- Git root;
- no Git root;
- nested directory;
- explicit root;
- symlink escape;
- home-directory refusal;
- filesystem-root refusal.

### Stack tests

Create fixtures for:

- Vite React;
- Next.js;
- Node API;
- Supabase;
- Cloudflare;
- Docker;
- GitHub Actions;
- a mixed monorepo;
- an unknown stack.

### Probe-selection tests

Test:

- relevant automatic probes;
- irrelevant probes skipped;
- an optional probe enabled by input;
- a manual probe never automatic;
- `--only`;
- `--skip`;
- a prohibited probe refused.

### Status tests

Test:

- all pass;
- pass plus skipped becomes warn;
- strict pass plus skipped becomes fail;
- warning;
- failure;
- timeout;
- internal error.

### Secret tests

Test:

- a realistic token is redacted;
- variable reference;
- documentation example;
- placeholder;
- ignored dependency;
- binary;
- local untracked file;
- no raw secret in text or JSON.

### Quality tests

Test:

- safe lint script;
- unsafe deploy script refused;
- missing script;
- failed test;
- timeout;
- build classified separately;
- CI exact commit match;
- CI commit mismatch.

### Runtime tests

Test:

- route verified;
- redirect;
- timeout;
- disallowed host;
- local port open;
- process present;
- service active;
- no automatic service start.

### Evidence tests

Test:

- Markdown sections;
- JSON schema;
- ANSI-free JSON;
- stable sorting;
- report path;
- evidence-write refusal outside the allowed output.

### Mutation tests

Take fixture snapshots before and after the default run.

Prove no changes to:

- source files;
- configuration;
- Git index;
- databases;
- services;
- provider state.

Allow only the explicitly selected evidence report.

## Fixture matrix

Create deterministic fixtures:

```text
fixtures/
  vite-react-app/
  next-app/
  node-api/
  supabase-app/
  cloudflare-worker/
  dirty-repo/
  secret-references/
  malformed-config/
  unsafe-scripts/
```

For every fixture, store expected:

- detected stack;
- selected probes;
- status;
- verified facts;
- warnings;
- skipped checks;
- unverified claims;
- next safe step.

Run:

```bash
./scripts/run-fixture-matrix.sh
```

## Completion gate

Build a repository completion gate for the CLI itself:

```bash
./scripts/verification-cli-completion-gate.sh --mode quick
./scripts/verification-cli-completion-gate.sh --mode standard
./scripts/verification-cli-completion-gate.sh --mode extended
```

The gate should check:

- Git status and branch;
- CLI lint;
- tests;
- self-check commands;
- JSON parsing;
- fixture matrix;
- website or documentation build where applicable;
- package metadata;
- optional network proof.

The gate must not:

- deploy;
- publish a package;
- tag;
- create a release;
- mutate databases;
- trigger jobs;
- call external AI;
- restart services;
- print secrets.

A task is not complete merely because files changed.

Failures block completion.

Warnings remain visible.

## Reproducible end-to-end proof

Use a fixture with:

- TypeScript;
- React;
- Vite;
- one safe lint command;
- one passing unit test;
- one secret-reference placeholder;
- no base URL;
- no local port;
- no Supabase;
- no Cloudflare.

Run:

```bash
[cli] --json
```

Expected:

- boundary resolved;
- stack detected;
- safe probes selected;
- repository and quality evidence present;
- secret placeholder classified without exposure;
- routes skipped;
- local runtime skipped;
- overall status `warn` or an equivalent partial pass;
- public-route availability listed under `notVerified`;
- local-runtime liveness listed under `notVerified`;
- the next safe step requests only relevant optional inputs;
- no source mutation.

Then run:

```bash
[cli] --strict --json
```

Expected:

- the same evidence;
- strict failure due to selected proof gaps;
- no additional invasive probes;
- a non-zero documented exit code.

Then provide:

```bash
[cli] --base-url http://fixture.local --port 3000 --health /health
```

against a controlled fixture server.

Expected:

- route and local proof recorded;
- no claim beyond the checked surfaces;
- the report remains explicit about untested production dependencies.

## Completion contract

Do not claim the CLI complete until:

- project-boundary resolution is safe;
- stack detection is evidence-backed;
- every probe has a complete metadata contract;
- only relevant safe probes run automatically;
- skipped checks include reasons;
- unverified claims remain visible;
- status aggregation cannot erase proof gaps;
- strict mode works;
- repository, quality, secrets, routes, runtime, CI and platform-static checks remain separate;
- secret values are never printed;
- hosted CI requires exact-commit matching;
- production routes require explicit input;
- local runtime checks never start services;
- live database proof is explicit and read-only;
- human and JSON reports validate;
- JSON is ANSI-free;
- command safety blocks mutation;
- subprocesses are timed and bounded;
- fixture snapshots prove default no-mutation behaviour;
- the fixture matrix passes;
- the completion gate passes;
- current limitations are documented honestly;
- the package is not described as a security audit or production guarantee.

Final report:

```text
Package:
Version:
Project boundary:
Detected stack:
Probe catalogue size:
Selected probes:
Executed probes:
Verified:
Warnings:
Failures:
Findings:
Skipped:
Not verified:
Strict mode:
Human output:
JSON schema:
Secret redaction:
Command safety:
Mutation check:
Fixture matrix:
Completion gate:
Current limitations:
Next safe step:
```

Do not report `safe`, `production-ready` or `fully verified` when runtime or production proof was not supplied.
