import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotId, canonicalJson } from '../src/storage/canonical-json.mjs';
import { replaySnapshot } from '../src/storage/replay.mjs';

const makeSnapshot = () => ({
  schemaVersion: 1, kind: 'search-console-report', algorithmVersion: '1.0.0',
  capturedAt: '2026-10-19T12:00:00.000Z', tool: 'get_site_summary',
  args: { siteUrl: 'sc-domain:example.test', startDate: '2026-10-01', endDate: '2026-10-03' },
  result: {
    request: { timeZone: 'America/Los_Angeles' },
    totals: { clicks: 0, impressions: 0, ctr: null, position: null },
    sections: {
      totals: { collectionStatus: 'complete', sourceCoverage: 'provider_limited', rows: [] },
      pages: { collectionStatus: 'failed', sourceCoverage: 'unknown', rows: null, error: 'RATE_LIMITED' },
    },
  },
});

test('replay is deterministic and preserves measured zeros separately from unavailable results', () => {
  const snapshot = makeSnapshot();
  const id = snapshotId(snapshot);
  const first = replaySnapshot(snapshot, { id });
  const originalDate = globalThis.Date;
  globalThis.Date = class extends originalDate { static now() { throw Error('clock read forbidden'); } };
  try {
    assert.equal(canonicalJson(replaySnapshot(snapshot, { id })), canonicalJson(first));
  } finally { globalThis.Date = originalDate; }
  assert.equal(first.snapshotId, id);
  assert.equal(first.capturedAt, snapshot.capturedAt);
  assert.equal(first.result.totals.clicks, 0);
  assert.equal(first.result.totals.ctr, null);
  assert.equal(first.result.sections.pages.rows, null);
  assert.equal(first.result.sections.totals.sourceCoverage, 'provider_limited');
  first.result.totals.clicks = 999;
  assert.equal(snapshot.result.totals.clicks, 0, 'caller cannot mutate the stored source through replay');
});

test('replay refuses mismatched identity, unsupported versions and invalid envelopes', () => {
  assert.throws(() => replaySnapshot(makeSnapshot(), { id: 'a'.repeat(64) }), { code: 'SNAPSHOT_ID_MISMATCH' });
  assert.throws(() => replaySnapshot(makeSnapshot(), { id: '../escape' }), { code: 'SNAPSHOT_INVALID_ID' });
  assert.throws(() => replaySnapshot({ ...makeSnapshot(), schemaVersion: 2 }), { code: 'SNAPSHOT_SCHEMA_UNSUPPORTED' });
  assert.throws(() => replaySnapshot({ ...makeSnapshot(), algorithmVersion: '2.0.0' }),
    { code: 'SNAPSHOT_ALGORITHM_UNSUPPORTED' });
  for (const change of [{ tool: '../invalid' }, { capturedAt: '2026-02-30T12:00:00Z' },
    { capturedAt: 'today' }, { args: [] }, { result: null }, { kind: 'anything-else' }, { token: 'not-allowed' }]) {
    assert.throws(() => replaySnapshot({ ...makeSnapshot(), ...change }), error => error.code.startsWith('SNAPSHOT_'));
  }
  assert.doesNotThrow(() => replaySnapshot({ ...makeSnapshot(), capturedAt: '2026-10-19T13:00:00+01:00' }));
});
