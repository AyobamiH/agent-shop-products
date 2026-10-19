import { canonicalJson, snapshotId } from './canonical-json.mjs';
import { validateSnapshot, validateSnapshotId } from './envelope.mjs';
import { requireSnapshot } from './errors.mjs';

export function replaySnapshot(snapshot, { id } = {}) {
  validateSnapshot(snapshot);
  const computed = snapshotId(snapshot);
  if (id !== undefined) {
    validateSnapshotId(id);
    requireSnapshot(id === computed, 'SNAPSHOT_ID_MISMATCH');
  }
  return {
    snapshotId: computed,
    algorithmVersion: snapshot.algorithmVersion,
    capturedAt: snapshot.capturedAt,
    result: JSON.parse(canonicalJson(snapshot.result)),
  };
}
