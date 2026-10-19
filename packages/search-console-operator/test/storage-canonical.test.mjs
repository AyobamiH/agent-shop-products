import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJson, snapshotId } from '../src/storage/canonical-json.mjs';

test('canonical JSON hashes reordered properties identically and preserves JSON values', () => {
  const first = { z: null, a: { '\u00e9': 'query | text\nnext', count: 0, missing: null }, rows: [false, 1.25] };
  const second = { rows: [false, 1.25], a: { missing: null, count: 0, '\u00e9': 'query | text\nnext' }, z: null };
  assert.equal(canonicalJson(first), canonicalJson(second));
  assert.equal(snapshotId(first), snapshotId(second));
  assert.deepEqual(JSON.parse(canonicalJson(first)), first);
  assert.notEqual(snapshotId({ value: 0 }), snapshotId({ value: null }));
  assert.equal(canonicalJson({ 2: 'two', 10: 'ten' }), '{"10":"ten","2":"two"}');
});

test('canonical JSON refuses data that JSON would silently drop or change', () => {
  const cyclic = {}; cyclic.self = cyclic;
  const sparse = []; sparse.length = 1;
  const extra = [1]; extra.label = 'hidden';
  const symbol = { value: 1, [Symbol('hidden')]: true };
  const hidden = {}; Object.defineProperty(hidden, 'secret', { value: 'hidden' });
  const invalid = [undefined, Infinity, NaN, 2n, () => 1, new Date(), sparse, extra, symbol, hidden];
  for (const value of invalid) assert.throws(() => canonicalJson(value), { code: 'SNAPSHOT_NON_JSON_VALUE' });
  assert.throws(() => canonicalJson(cyclic), { code: 'SNAPSHOT_JSON_CYCLE' });
  let invoked = false;
  const accessor = { get unsafe() { invoked = true; return 'value'; } };
  assert.throws(() => canonicalJson(accessor), { code: 'SNAPSHOT_NON_JSON_VALUE' });
  assert.equal(invoked, false);
});

test('canonical byte and nesting limits apply before an object can be persisted', () => {
  assert.throws(() => canonicalJson({ value: '\u00e9'.repeat(100) }, { maxBytes: 100 }),
    { code: 'SNAPSHOT_TOO_LARGE' });
  for (const maxBytes of [0, -1, NaN, Infinity, 1.5, 129 * 1024 * 1024]) {
    assert.throws(() => canonicalJson({}, { maxBytes }), { code: 'SNAPSHOT_INVALID_BYTE_LIMIT' });
  }
  let deep = {};
  for (let depth = 0; depth < 66; depth++) deep = { next: deep };
  assert.throws(() => canonicalJson(deep), { code: 'SNAPSHOT_JSON_TOO_DEEP' });
  const shared = { clicks: 1 };
  assert.equal(canonicalJson([shared, shared]), '[{"clicks":1},{"clicks":1}]');
});
