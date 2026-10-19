import { createHash } from 'node:crypto';
import { requireSnapshot, snapshotError } from './errors.mjs';

export const MAX_CANONICAL_BYTES = 128 * 1024 * 1024;

export function canonicalJson(value, { maxBytes = MAX_CANONICAL_BYTES } = {}) {
  requireSnapshot(Number.isSafeInteger(maxBytes) && maxBytes > 0 &&
    maxBytes <= MAX_CANONICAL_BYTES, 'SNAPSHOT_INVALID_BYTE_LIMIT');
  const parts = [];
  const ancestors = new Set();
  let bytes = 0;
  function append(text) {
    bytes += Buffer.byteLength(text, 'utf8');
    requireSnapshot(bytes <= maxBytes, 'SNAPSHOT_TOO_LARGE');
    parts.push(text);
  }
  function encode(item, depth) {
    requireSnapshot(depth <= 64, 'SNAPSHOT_JSON_TOO_DEEP');
    if (item === null) return append('null');
    if (typeof item === 'string' || typeof item === 'boolean') return append(JSON.stringify(item));
    if (typeof item === 'number') {
      requireSnapshot(Number.isFinite(item), 'SNAPSHOT_NON_JSON_VALUE');
      return append(JSON.stringify(item));
    }
    requireSnapshot(typeof item === 'object', 'SNAPSHOT_NON_JSON_VALUE');
    requireSnapshot(!ancestors.has(item), 'SNAPSHOT_JSON_CYCLE');
    requireSnapshot(Object.getOwnPropertySymbols(item).length === 0, 'SNAPSHOT_NON_JSON_VALUE');
    const array = Array.isArray(item);
    requireSnapshot(array || Object.getPrototypeOf(item) === Object.prototype ||
      Object.getPrototypeOf(item) === null, 'SNAPSHOT_NON_JSON_VALUE');
    const keys = Object.getOwnPropertyNames(item).filter(key => !array || key !== 'length');
    if (array) {
      requireSnapshot(keys.length === item.length && keys.every((key, index) =>
        key === String(index)), 'SNAPSHOT_NON_JSON_VALUE');
    } else keys.sort();
    ancestors.add(item);
    append(array ? '[' : '{');
    keys.forEach((key, index) => {
      const descriptor = Object.getOwnPropertyDescriptor(item, key);
      requireSnapshot(descriptor.enumerable && Object.hasOwn(descriptor, 'value'), 'SNAPSHOT_NON_JSON_VALUE');
      if (index) append(',');
      if (!array) append(JSON.stringify(key) + ':');
      encode(descriptor.value, depth + 1);
    });
    append(array ? ']' : '}');
    ancestors.delete(item);
  }
  try { encode(value, 0); }
  catch (error) {
    if (error?.code?.startsWith('SNAPSHOT_')) throw error;
    throw snapshotError('SNAPSHOT_NON_JSON_VALUE', error);
  }
  return parts.join('');
}

export function snapshotId(value, options) {
  return createHash('sha256').update(canonicalJson(value, options), 'utf8').digest('hex');
}
