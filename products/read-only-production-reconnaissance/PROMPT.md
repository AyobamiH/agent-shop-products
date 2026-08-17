# Read-only production system reconnaissance

A production prompt for mapping a live software system without changing its source, services, schedules, databases, credentials, external providers, or runtime state.

This prompt is based on a real OpenClaw production reconnaissance covering processes, sockets, services, schedulers, repositories, plugins, skills, databases, runtime health, protected state, source authority, and contradictory documentation. It is designed for systems where a confident but incorrect inventory can be more dangerous than an incomplete one.

## Requirements

- Read access to the host or runtime.
- Read access to the relevant repositories and configuration.
- A shell capable of running bounded inspection commands.
- A way to query service managers, process tables, sockets, containers, and databases without mutation.
- A secure destination for the final report.
- Explicitly defined secret and private-data boundaries.
- An operator who can clarify which systems are in scope.

This prompt assumes Linux or a compatible environment, but the evidence model applies to other platforms.

## Prompt: perform read-only production reconnaissance

Paste everything below the line into an AI coding assistant or operations agent. Replace bracketed paths, service names, ports, and platform commands where required, but preserve the evidence hierarchy, zero-write rules, contradiction handling, and completion standard.

---

Perform a complete read-only reconnaissance of this production system.

Do not repair, restart, reload, install, update, migrate, compact, clean, delete, publish, rotate, reconfigure, or reconcile anything.

The mission is to establish what is actually present and active, distinguish it from what documentation claims, identify operational and portability risks, and produce an evidence-backed system map suitable for a later approved repair or migration task.

Use this flow:

```text
SCOPE
  → DEFINE ZERO-WRITE BOUNDARY
  → CAPTURE BASELINE
  → DISCOVER HOST
  → DISCOVER PROCESSES AND SOCKETS
  → DISCOVER SERVICES
  → DISCOVER CONTAINERS
  → DISCOVER SCHEDULERS
  → DISCOVER REPOSITORIES
  → DISCOVER CONFIGURATION SHAPE
  → DISCOVER PLUGINS, SKILLS, AND AGENTS
  → DISCOVER DATA STORES
  → TEST READ-ONLY HEALTH
  → RECONCILE CONTRADICTIONS
  → VERIFY NO INTENDED MUTATION
  → REPORT
```

## Objective

The final report must prove, as far as available evidence permits:

1. which host and runtime are being observed;
2. which processes are active;
3. which sockets and ports are listening;
4. which service managers own those processes;
5. which schedulers can trigger work;
6. which repositories and source trees are authoritative;
7. which repositories are dirty, detached, ahead, behind, inaccessible, or local-only;
8. which plugins, skills, agents, workers, and adapters are loaded;
9. which databases, queues, and protected state stores are active;
10. which configuration and secret categories exist without exposing values;
11. which documented claims agree or conflict with runtime truth;
12. which components are portable, generated, protected, local-only, or obsolete;
13. which health checks passed, failed, or were not verified;
14. which risks require a later approved action;
15. what evidence supports every important conclusion.

The report must never claim that an unavailable or unverified component is healthy.

## Source authority order

Use this authority order:

```text
1. live provider or runtime readback
2. live process, socket, service, scheduler, and database state
3. executable source and active configuration
4. versioned portable documentation
5. host-operations documentation
6. historical reports and narrative summaries
7. inference
```

When sources disagree:

- preserve the disagreement;
- identify the stronger source;
- explain why it outranks the weaker source;
- do not rewrite files to remove the contradiction;
- do not silently choose the more convenient claim.

Example:

```text
Documentation claims MongoDB is authoritative.
The running service opens SQLite and Redis, while the legacy Mongo endpoint is
unavailable.

Classification:
- SQLite and Redis: observed runtime truth
- MongoDB authority: stale documentation or degraded legacy path
- required next action: separate architecture/documentation reconciliation
```

## Truth classes

Classify every important statement as one of:

```text
observed
configured
claimed
publicly_proven
inferred
unknown
contradicted
```

Definitions:

### `observed`

Directly seen in live runtime, provider readback, process state, database query, or socket state.

### `configured`

Present in active configuration, service units, manifests, or scheduler definitions.

Configuration does not prove execution.

### `claimed`

Written in documentation, comments, reports, dashboards, or status messages.

Claims require corroboration.

### `publicly_proven`

Verifiable through an external public surface such as a published package, public repository, provider object, or public health endpoint.

### `inferred`

A reasoned conclusion supported by evidence but not directly observed.

State the inference explicitly.

### `unknown`

Evidence is unavailable, inaccessible, ambiguous, or outside scope.

### `contradicted`

Two credible sources disagree.

Do not collapse `configured` into `observed`.

## Zero-write contract

Before running any command, write a reconnaissance authority record:

```ts
interface ReconnaissanceAuthority {
  missionId: string;
  mode: "read_only";
  allowedHosts: string[];
  allowedRepositoryRoots: string[];
  allowedServiceManagers: string[];
  allowedDatabasePaths: string[];
  allowedHttpOrigins: string[];
  prohibitedActions: string[];
  privateDataPolicy: string;
  startedAt: string;
}
```

Prohibited actions must include:

```text
file creation outside an approved evidence directory
source edits
configuration edits
package installation
dependency resolution
builds that create artifacts
test commands that write fixtures or caches
service restart, reload, enable, disable, or daemon-reload
container start, stop, restart, pull, build, or exec with mutation
scheduler create, edit, enable, disable, run, or delete
database migration, vacuum, checkpoint, repair, backup, restore, or write
Redis mutation
provider write APIs
Git commit, checkout, reset, clean, stash, pull, fetch, merge, tag, or push
credential access beyond safe reference names
browser interaction
deletion or cleanup
```

Do not use a command merely because it is commonly called diagnostic.

Some doctor, test, build, package, framework, and CLI commands create caches, logs, lockfiles, state rows, or temporary artifacts.

Inspect command behaviour first.

## Evidence directory

When evidence files are permitted, create one dedicated evidence directory before the mission or have the operator provide it.

Example:

```text
/recon-evidence/<mission-id>/
```

Only the evidence writer may write there.

The inspection commands themselves must not write elsewhere.

When no writes at all are permitted:

- keep bounded outputs in memory;
- produce the final report through the calling system;
- do not redirect output;
- do not use `tee`;
- do not create temporary files;
- do not run tools that require caches or state.

Be honest about whether the evidence mode is:

```text
strict_zero_write
bounded_evidence_write
```

## Command ledger

Record every command before execution:

```ts
interface ReconCommand {
  commandId: string;
  purpose: string;
  command: string;
  target: string;
  expectedReadSurfaces: string[];
  possibleSideEffects: string[];
  approved: boolean;
  startedAt: string | null;
  completedAt: string | null;
  exitCode: number | null;
  stdoutDigest: string | null;
  stderrDigest: string | null;
  classification:
    | "executed"
    | "refused"
    | "skipped"
    | "failed";
}
```

Refuse commands with unexplained side effects.

Sanitise:

- tokens;
- passwords;
- credentials;
- cookies;
- private keys;
- full environment values;
- private message content;
- personally identifying data;
- provider access URLs containing secrets.

## Baseline

Capture the smallest practical before-state that can later demonstrate no intended mutation.

Include, where applicable:

```text
current time and timezone
hostname and kernel
current user and groups
mounted filesystem summary
repository branch/HEAD/status
service active/enabled/restart counters
container identities and states
scheduler definitions and latest run identifiers
database file size and selected row counts
external provider object counts only through official read APIs
```

Do not hash or recursively scan private data without approval.

Do not use timestamps alone as proof of mutation because reads can update access times on some filesystems.

Prefer stable state:

- Git tree and status;
- service properties;
- scheduler definitions;
- database integrity and row counts;
- process identities;
- socket ownership;
- provider object IDs.

## Host discovery

Collect:

```text
operating system and release
kernel
virtualisation or container layer
architecture
timezone
uptime
memory summary
disk and mount summary
runtime versions
package-manager versions
Git version
container runtime version
SQLite client version
```

Example read-only commands:

```bash
uname -a
cat /etc/os-release
systemd-detect-virt
date --iso-8601=seconds
uptime
free -h
df -hT
mount
node --version
npm --version
git --version
docker --version
sqlite3 --version
```

Do not install a missing command.

Record it as unavailable.

## Process discovery

Inspect processes without signalling them.

Examples:

```bash
ps -eo pid,ppid,user,lstart,etime,stat,comm,args --sort=pid
pgrep -a -f '<bounded-pattern>'
cat /proc/<pid>/status
readlink /proc/<pid>/exe
tr '\0' ' ' < /proc/<pid>/cmdline
```

Avoid reading full process environments.

Environment blocks can contain secrets.

When environment shape is necessary:

- inspect service templates;
- inspect variable names only;
- use an approved redaction method;
- never print values.

Map each important process to:

```ts
interface ProcessObservation {
  pid: number;
  parentPid: number | null;
  user: string;
  executable: string;
  commandSummary: string;
  startedAt: string | null;
  elapsed: string | null;
  serviceOwner: string | null;
  containerId: string | null;
  listeningSockets: string[];
  sourceCandidate: string | null;
  confidence: "high" | "medium" | "low";
  evidence: string[];
}
```

## Socket and port discovery

Inspect listeners and established connections without probing arbitrary external hosts.

Examples:

```bash
ss -ltnp
ss -lunp
ss -lxnp
```

Use `lsof` only when already installed and the scope is bounded.

Map:

- address;
- port or socket path;
- protocol;
- owning PID;
- service;
- expected exposure;
- whether loopback, private, or public;
- documentation match.

Flag:

- undocumented listeners;
- public listeners expected to be loopback-only;
- multiple processes competing for one port;
- configured ports with no listener;
- stale Unix sockets.

A listening socket proves a process is bound. It does not prove application health.

## Service discovery

Inspect all relevant service managers.

For systemd:

```bash
systemctl list-units --type=service --all
systemctl list-unit-files --type=service
systemctl show <service> \
  --property=Id,LoadState,ActiveState,SubState,UnitFileState,MainPID,ExecMainStartTimestamp,NRestarts,FragmentPath,DropInPaths
systemctl status <service> --no-pager
systemctl --user list-units --type=service --all
systemctl --user list-unit-files --type=service
systemctl --user show <service> \
  --property=Id,LoadState,ActiveState,SubState,UnitFileState,MainPID,ExecMainStartTimestamp,NRestarts,FragmentPath,DropInPaths
```

Do not run:

```text
start
stop
restart
reload
enable
disable
daemon-reload
reset-failed
```

Inspect unit files and drop-ins safely.

Record:

```ts
interface ServiceObservation {
  manager: "system" | "user" | "container" | "other";
  serviceId: string;
  loaded: boolean;
  activeState: string;
  subState: string;
  enabledState: string;
  mainPid: number | null;
  restartCount: number | null;
  unitPath: string | null;
  dropIns: string[];
  executable: string | null;
  workingDirectory: string | null;
  health: "healthy" | "degraded" | "failed" | "unknown";
  healthEvidence: string[];
}
```

A service may be active but degraded.

## Journal and log inspection

Read only bounded windows.

Examples:

```bash
journalctl -u <service> --since '<time>' --no-pager -n <limit>
journalctl --user -u <service> --since '<time>' --no-pager -n <limit>
```

Do not dump unlimited logs.

Redact credentials and private content.

Classify:

- current failure;
- historical failure;
- recovered incident;
- expected warning;
- unresolved repeated warning;
- stale log unrelated to current runtime.

Do not treat one old error as current failure without corroboration.

## Container discovery

For Docker-compatible runtimes:

```bash
docker ps --no-trunc
docker inspect <container>
docker network ls
docker volume ls
```

Do not run:

```text
docker exec
docker start
docker stop
docker restart
docker pull
docker build
docker compose up
docker system prune
```

Inspect container mounts, networks, ports, image identity, restart policy, health, and command.

Do not print secret-bearing environment values.

Map volumes by category:

```text
source-controlled
generated
protected_runtime_state
secret_material
cache
unknown
```

## Scheduler discovery

Inventory every scheduler that can trigger work:

```text
systemd timers
user systemd timers
cron
application schedulers
queue-based delayed jobs
provider schedules
workflow-engine schedules
GitHub Actions or CI schedules
cloud platform schedules
```

Read-only examples:

```bash
systemctl list-timers --all
systemctl --user list-timers --all
crontab -l
```

Do not edit, enable, disable, or force-run a schedule.

Record:

```ts
interface ScheduleObservation {
  schedulerType: string;
  scheduleId: string;
  expression: string;
  timezone: string | null;
  enabled: boolean | null;
  owner: string | null;
  commandSummary: string | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastOutcome: string | null;
  externalWritePotential: boolean;
  evidence: string[];
}
```

Identify duplicate ownership:

- two schedules invoking the same job;
- a legacy scheduler plus graph scheduler;
- application scheduler plus host cron;
- manual recovery job still enabled;
- disabled schedule still described as active.

## Repository discovery

For every source candidate:

```bash
git -C <repo> rev-parse --show-toplevel
git -C <repo> branch --show-current
git -C <repo> rev-parse HEAD
git -C <repo> status --short --branch
git -C <repo> remote -v
git -C <repo> log -1 --format='%H%n%aI%n%s'
```

Do not run networked Git commands unless separately approved.

That means no:

```text
fetch
pull
push
ls-remote
submodule update
```

Use existing tracking references only and label their freshness as unknown when no fetch is permitted.

Record:

```ts
interface RepositoryObservation {
  root: string;
  branch: string | null;
  head: string;
  detached: boolean;
  trackedChanges: number;
  untrackedPaths: number;
  ahead: number | null;
  behind: number | null;
  remotes: string[];
  runtimeUse: string;
  authoritativeStatus:
    | "authoritative"
    | "candidate"
    | "generated_copy"
    | "historical"
    | "local_only"
    | "unknown";
  portability:
    | "source_controlled"
    | "dirty"
    | "remote_inaccessible"
    | "unpinned"
    | "blocked";
  evidence: string[];
}
```

Never call a dirty repository clean.

Do not count ignored files as untracked unless the mission requires it.

## Source relationship map

Build a graph:

```text
service
  → executable
  → working directory
  → repository
  → commit
  → configuration
  → data store
  → scheduler
  → external provider
```

A repository being present does not prove the running service uses it.

Use:

- `/proc/<pid>/exe`;
- command line;
- service `ExecStart`;
- working directory;
- loaded package path;
- build metadata;
- process-open files when safely available;
- application version endpoints.

State confidence.

## Configuration shape

Inspect safe configuration structure, not secret values.

Collect:

- config file locations;
- schema versions;
- enabled plugin names;
- model identifiers;
- state paths;
- service base URLs;
- declared ports;
- scheduler ownership;
- feature flags;
- secret reference names;
- account aliases;
- environment variable names only.

Classify each field:

```text
non_secret
secret_reference
secret_value_not_read
private_data_reference
runtime_path
generated
unknown
```

Do not open `.env` files by default.

When historical path inspection shows secret-like files were committed:

- report the path-name risk;
- do not open values;
- do not rewrite history;
- recommend a separate credential-remediation task.

## Plugin, skill, agent, and worker discovery

Inventory:

```text
installed packages
loaded plugins
eligible skills
declared agents
worker manifests
task bindings
tool bindings
plugin versions
capability restrictions
runtime health
source location
```

Distinguish:

```text
installed
configured
loaded
healthy
eligible
used_recently
source_controlled
local_only
```

An installed plugin is not necessarily loaded.

A skill folder is not necessarily eligible.

A Markdown file is not necessarily a complete executable skill.

For each capability record:

```ts
interface CapabilityObservation {
  capabilityId: string;
  type: "plugin" | "skill" | "agent" | "worker" | "tool";
  version: string | null;
  installed: boolean;
  configured: boolean;
  loaded: boolean | null;
  healthy: boolean | null;
  sourcePath: string | null;
  repository: string | null;
  authority: string[];
  evidenceContract: string[];
  portabilityRisk: string[];
  evidence: string[];
}
```

## Database discovery

Inventory database processes, files, connections, and application references.

Examples:

```text
SQLite
PostgreSQL
MySQL
MongoDB
Redis
embedded key-value stores
queue databases
browser/profile databases
provider-side state
```

For SQLite, open explicitly in read-only mode where supported:

```bash
sqlite3 'file:/path/to/database.sqlite?mode=ro' \
  'PRAGMA query_only=ON; PRAGMA integrity_check;'
```

Use only bounded `SELECT`, `PRAGMA`, and schema queries.

Do not run:

```text
VACUUM
REINDEX
ANALYZE
CHECKPOINT
.backup
.restore
.import
.write
```

Be aware that some SQLite clients may create journal or shared-memory files when opened incorrectly.

Require read-only URI mode and verify no side files appear.

For Redis, use read-only commands only:

```text
PING
INFO
DBSIZE
SCAN with bounded count
TYPE
TTL
```

Do not run:

```text
SET
DEL
FLUSHDB
FLUSHALL
CONFIG SET
SAVE
BGSAVE
MIGRATE
```

Avoid reading values containing private data.

For remote databases, use least-privilege read credentials and bounded queries.

Record:

```ts
interface DataStoreObservation {
  storeId: string;
  type: string;
  location: string;
  ownerService: string | null;
  active: boolean | null;
  integrity: "ok" | "failed" | "not_checked" | "unknown";
  schemaVersion: string | null;
  boundedCounts: Record<string, number | null>;
  protectedData: boolean;
  backupClaim: string | null;
  restoreClaim: string | null;
  portabilityCategory:
    | "source_controlled"
    | "generated"
    | "protected_export"
    | "recreate"
    | "exclude"
    | "unknown";
  evidence: string[];
}
```

Database availability and application use are separate claims.

## Protected state classification

Classify every local component:

### A. Commit to source control

Examples:

- source;
- migrations;
- safe service templates;
- schemas;
- tests;
- documentation;
- patch artifacts;
- safe configuration examples.

### B. Generate during bootstrap

Examples:

- dependencies;
- compiled output;
- caches;
- generated indexes;
- UI bundles;
- sockets;
- PID files.

### C. Export separately as protected runtime data

Examples:

- selected SQLite databases;
- scheduler definitions;
- approved memory;
- queue history;
- evidence ledgers;
- provider reconciliation state;
- encrypted credential records without keys.

### D. Recreate through a secret manager or interactive login

Examples:

- provider tokens;
- OAuth refresh tokens;
- webhook secrets;
- private keys;
- browser cookies;
- recovery codes;
- encryption keys.

### E. Exclude permanently

Examples:

- obsolete logs;
- crash dumps;
- stale caches;
- old temporary files;
- redundant backups;
- orphaned session files.

Reconnaissance must not delete Category E.

## Health verification

Use layered health:

```text
process health
socket health
service-manager health
application health
dependency health
data-store health
scheduler health
provider readback
public proof
```

A component is `healthy` only when the required layers pass.

Example:

```text
service active
+ expected PID
+ expected loopback socket
+ HTTP health 200
+ required Redis PING
+ database integrity ok
= healthy for the tested scope
```

When a layer is unavailable, use `unknown` or `degraded`, not healthy.

Use bounded GET or HEAD requests only:

```bash
curl --fail --silent --show-error --max-time 5 \
  http://127.0.0.1:<port>/health
```

Do not call endpoints that enqueue work, refresh state, rotate tokens, compact data, or trigger providers.

Review route semantics before calling.

## External provider verification

When official read APIs are available and approved:

- read account identity;
- read object status;
- read recent provider objects by known IDs;
- read connection readiness;
- read quotas where safe.

Do not:

- publish;
- create containers;
- send messages;
- mark items read;
- acknowledge queues;
- delete;
- rotate tokens;
- refresh OAuth unless explicitly approved.

If token refresh is automatic, determine whether the read call may write credential state.

When uncertain, skip and report `not_verified`.

## Contradiction register

Create:

```ts
interface Contradiction {
  contradictionId: string;
  subject: string;
  strongerEvidence: string[];
  weakerEvidence: string[];
  strongerClaim: string;
  weakerClaim: string;
  authorityReason: string;
  operationalImpact: string;
  recommendedNextAction: string;
  status: "open" | "explained" | "historical" | "false_positive";
}
```

Examples:

- docs say one database; runtime uses another;
- service template points to one path; process runs another;
- schedule described as disabled; scheduler reports enabled;
- package installed version differs from source tag;
- repository clean base exists while active service uses a dirty copy;
- provider post exists while local state says absent;
- plugin configured but not loaded.

Do not fix contradictions during recon.

## Risk register

Classify risks:

```text
availability
integrity
confidentiality
portability
recoverability
ownership
version_drift
scheduler_collision
source_drift
secret_history
observability
unsupported_dependency
```

Score:

```ts
interface ReconRisk {
  riskId: string;
  category: string;
  title: string;
  evidence: string[];
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  confidence: "high" | "medium" | "low";
  currentMitigation: string | null;
  recommendedNextAction: string;
  approvalRequired: boolean;
}
```

Do not inflate risk from speculation.

## No-mutation verification

At the end, repeat the stable baseline observations:

- repository status and HEAD;
- service active/enabled/restart counters;
- container identities and states;
- scheduler definitions;
- selected database row counts and integrity;
- provider object IDs when readback was performed;
- external write counters where available.

Classify:

```text
verified_unchanged
expected_read_side_effect_only
changed_outside_mission
unable_to_verify
```

Do not claim byte-for-byte host immutability unless it was actually measured and reads could not alter metadata.

State:

```text
No intended source, configuration, service, scheduler, database, Git, or provider
mutation was performed.
```

only when supported.

## Required tests for a reusable recon harness

Build synthetic tests for:

### Command policy

- allowed read command;
- prohibited service restart;
- prohibited Git fetch;
- prohibited database write;
- diagnostic command with hidden cache write;
- secret-bearing command;
- unbounded log dump.

### Source mapping

- service points to expected repository;
- active process points to generated copy;
- detached source checkout;
- dirty active source;
- several clones with one runtime owner;
- missing remote.

### Service and socket mapping

- active service with no listener;
- listener without service;
- restart loop;
- healthy loopback service;
- public exposure mismatch;
- stale socket.

### Scheduler mapping

- duplicate schedules;
- legacy and replacement ownership;
- disabled schedule described as active;
- natural run history;
- unresolved job.

### Database mapping

- read-only SQLite open;
- accidental WAL or journal creation refusal;
- integrity failure;
- configured but unavailable database;
- active store contradicts docs;
- protected data not printed.

### Secret policy

- `.env` path detected but value not opened;
- process environment refused;
- redacted service argument;
- URL query secret removed;
- private key path classified.

### Contradictions

- code, docs, runtime disagree;
- public proof outranks local success claim;
- historical report correctly marked stale;
- inference clearly labelled.

## Reproducible fixture

Create a disposable fixture containing:

```text
systemd/
  app.service
  worker.service
repositories/
  app/
  worker/
state/
  app.sqlite
schedules/
  cron.txt
docs/
  architecture.md
runtime/
  process-snapshot.json
  socket-snapshot.json
```

Model these conditions:

- `app.service` is active and healthy;
- `worker.service` is active but restart-looping;
- docs claim PostgreSQL;
- runtime uses SQLite;
- a legacy cron and replacement schedule both target the same worker;
- the app repository is clean;
- the worker repository is dirty and detached;
- a plugin is configured but not loaded;
- an `.env.production` path exists but must not be opened;
- one data directory is protected runtime state;
- one cache directory is generated;
- one obsolete log directory is Category E but must not be deleted.

The harness must produce:

- system topology;
- service table;
- port table;
- repository table;
- scheduler collision;
- database contradiction;
- plugin readiness gap;
- protected-state classification;
- zero-write ledger;
- final risks and next actions.

It must perform no fixture mutation outside the designated evidence directory.

## Completion contract

Do not claim reconnaissance complete until:

- scope and zero-write mode are explicit;
- the command ledger is complete;
- host and runtime versions are recorded;
- processes and sockets are mapped;
- system and user services are mapped;
- containers are mapped where present;
- every scheduler class in scope is checked;
- source repositories are mapped to runtime owners;
- dirty, detached, local-only, inaccessible, and unpinned source is visible;
- configuration shape is recorded without secret values;
- plugins, skills, agents, workers, and tools are distinguished by installed, configured, loaded, and healthy states;
- data stores are mapped with safe bounded evidence;
- protected state is classified;
- layered health checks are reported;
- contradictions are preserved;
- risks are evidence-backed;
- stable before/after state is compared;
- no intended mutation is supported by evidence;
- unknowns and skipped checks are explicit;
- every recommended action is deferred to a separately approved task.

Final report:

```text
Mission ID:
Mode:
Scope:
Host:
Runtime versions:
Processes:
Listening sockets:
System services:
User services:
Containers:
Schedulers:
Repositories:
Active source relationships:
Configuration shape:
Secret references:
Plugins:
Skills:
Agents:
Workers:
Data stores:
Protected state:
Health verdicts:
Contradictions:
Risks:
Commands executed:
Commands refused or skipped:
Before/after verification:
Intended mutations:
External writes:
Unknowns:
Highest-priority next actions:
Approval boundaries:
```

Do not report “healthy”, “portable”, “authoritative”, or “fully mapped” when evidence supports only a partial or configured state.
