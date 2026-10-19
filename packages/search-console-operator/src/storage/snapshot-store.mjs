import { createHash } from 'node:crypto';
import { opendirSync } from 'node:fs';
import path from 'node:path';
import { canonicalJson, MAX_CANONICAL_BYTES } from './canonical-json.mjs';
import { validateSnapshot, validateSnapshotId } from './envelope.mjs';
import { privateDirectory } from './private-directory.mjs';
import { readPrivateFile, publishPrivateFile } from './private-file.mjs';
import { requireSnapshot, snapshotError } from './errors.mjs';

const DEFAULT_MAX_BYTES = 32 * 1024 * 1024;
const MAX_DIRECTORY_ENTRIES = 10_000;

export function createSnapshotStore(directory, { maxBytes = DEFAULT_MAX_BYTES } = {}) {
  requireSnapshot(typeof directory === 'string' && directory.length > 0 && !directory.includes('\0'),
    'SNAPSHOT_INVALID_DIRECTORY');
  requireSnapshot(Number.isSafeInteger(maxBytes) && maxBytes > 1 && maxBytes <= MAX_CANONICAL_BYTES,
    'SNAPSHOT_INVALID_BYTE_LIMIT');
  const root = path.resolve(directory);
  function encoded(snapshot) {
    validateSnapshot(snapshot);
    const json = canonicalJson(snapshot, { maxBytes: maxBytes - 1 });
    return { id: createHash('sha256').update(json).digest('hex'), bytes: Buffer.from(json + '\n') };
  }
  function read(id) {
    validateSnapshotId(id);
    privateDirectory(root);
    const bytes = readPrivateFile(path.join(root, id + '.json'), maxBytes);
    try {
      const snapshot = JSON.parse(bytes.toString('utf8'));
      const expected = encoded(snapshot);
      requireSnapshot(expected.id === id && expected.bytes.equals(bytes), 'SNAPSHOT_CORRUPT');
      return { snapshot, bytes: bytes.length };
    } catch (error) {
      if (error.code === 'SNAPSHOT_SCHEMA_UNSUPPORTED' || error.code === 'SNAPSHOT_ALGORITHM_UNSUPPORTED') throw error;
      throw snapshotError('SNAPSHOT_CORRUPT', error);
    }
  }
  async function save(snapshot) {
    const expected = encoded(snapshot);
    privateDirectory(root, { create: true });
    if (!publishPrivateFile(root, expected.id, expected.bytes)) {
      try { read(expected.id); }
      catch (error) { throw snapshotError('SNAPSHOT_EXISTING_CORRUPT', error); }
    }
    return { id: expected.id, bytes: expected.bytes.length };
  }
  async function load(id) { return read(id).snapshot; }
  async function list({ limit = 20 } = {}) {
    requireSnapshot(Number.isSafeInteger(limit) && limit > 0 && limit <= 100, 'SNAPSHOT_INVALID_LIST_LIMIT');
    try { privateDirectory(root); }
    catch (error) { if (error.code === 'SNAPSHOT_DIRECTORY_NOT_FOUND') return []; throw error; }
    const ids = [];
    let handle;
    try {
      handle = opendirSync(root);
      let entry;
      let scanned = 0;
      while ((entry = handle.readSync()) !== null) {
        requireSnapshot(++scanned <= MAX_DIRECTORY_ENTRIES, 'SNAPSHOT_LIST_LIMIT_EXCEEDED');
        if (!/^[a-f0-9]{64}\.json$/.test(entry.name)) continue;
        requireSnapshot(entry.isFile() && !entry.isSymbolicLink(), 'SNAPSHOT_FILE_UNSAFE');
        ids.push(entry.name.slice(0, -5));
      }
    } catch (error) {
      if (error?.code?.startsWith('SNAPSHOT_')) throw error;
      throw snapshotError('SNAPSHOT_LIST_FAILED', error);
    } finally { if (handle) handle.closeSync(); }
    return ids.sort().slice(0, limit).map(id => {
      const { snapshot, bytes } = read(id);
      const { schemaVersion, kind, algorithmVersion, capturedAt, tool } = snapshot;
      return { id, bytes, schemaVersion, kind, algorithmVersion, capturedAt, tool };
    });
  }
  return Object.freeze({ save, load, list });
}
