import { requireSnapshot } from './errors.mjs';

const FIELDS = ['algorithmVersion', 'args', 'capturedAt', 'kind', 'result', 'schemaVersion', 'tool'];
export const SNAPSHOT_SCHEMA_VERSION = 1;
export const SNAPSHOT_ALGORITHM_VERSION = '1.0.0';

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
}

function isoTimestamp(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d{1,3})?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  if (match[2] !== 'Z' && (Number(match[3]) > 23 || Number(match[4]) > 59)) return false;
  const local = new Date(match[1] + 'Z');
  return Number.isFinite(local.getTime()) && local.toISOString().slice(0, 19) === match[1];
}

export function validateSnapshot(snapshot) {
  requireSnapshot(plainObject(snapshot), 'SNAPSHOT_INVALID_ENVELOPE');
  requireSnapshot(Object.keys(snapshot).sort().join(',') === FIELDS.join(','), 'SNAPSHOT_INVALID_ENVELOPE');
  for (const key of FIELDS) {
    const descriptor = Object.getOwnPropertyDescriptor(snapshot, key);
    requireSnapshot(descriptor?.enumerable && Object.hasOwn(descriptor, 'value'), 'SNAPSHOT_INVALID_ENVELOPE');
  }
  requireSnapshot(snapshot.schemaVersion === SNAPSHOT_SCHEMA_VERSION, 'SNAPSHOT_SCHEMA_UNSUPPORTED');
  requireSnapshot(snapshot.algorithmVersion === SNAPSHOT_ALGORITHM_VERSION, 'SNAPSHOT_ALGORITHM_UNSUPPORTED');
  requireSnapshot(snapshot.kind === 'search-console-report', 'SNAPSHOT_INVALID_ENVELOPE');
  requireSnapshot(isoTimestamp(snapshot.capturedAt), 'SNAPSHOT_INVALID_CAPTURE_TIME');
  requireSnapshot(typeof snapshot.tool === 'string' && /^[a-z][a-z0-9_]{0,99}$/.test(snapshot.tool),
    'SNAPSHOT_INVALID_TOOL');
  requireSnapshot(plainObject(snapshot.args) && plainObject(snapshot.result), 'SNAPSHOT_INVALID_ENVELOPE');
  return snapshot;
}

export function validateSnapshotId(id) {
  requireSnapshot(typeof id === 'string' && /^[a-f0-9]{64}$/.test(id), 'SNAPSHOT_INVALID_ID');
  return id;
}
