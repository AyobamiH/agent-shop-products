import test from 'node:test';
import assert from 'node:assert/strict';
import { createSearchConsoleProvider } from '../src/core/provider.mjs';

// Synthetic provider responses only. These tests never use Google credentials or network access.
const now = () => new Date('2026-10-19T12:00:00Z');
const base = { siteUrl: 'sc-domain:example.invalid', startDate: '2026-09-01',
  endDate: '2026-09-28', dimensions: ['query'] };
const row = (key, overrides = {}) => ({ keys: [String(key)], clicks: 1, impressions: 10,
  ctr: 0.1, position: 2, ...overrides });
const page = (start, length) => ({ rows: Array.from({ length }, (_, i) => row(start + i)),
  responseAggregationType: 'byProperty' });
function provider(request) { return createSearchConsoleProvider({ session: { request }, now }); }

test('site listing preserves source permissions and exact identity with deterministic ordering', async () => {
  const p = provider(async (url, options) => {
    assert.equal(url, 'https://www.googleapis.com/webmasters/v3/sites');
    assert.equal(options.method, 'GET');
    return { siteEntry: [
      { siteUrl: 'sc-domain:z.invalid', permissionLevel: 'siteUnverifiedUser' },
      { siteUrl: 'https://a.invalid/blog/', permissionLevel: 'siteRestrictedUser' },
    ] };
  });
  const result = await p.listSites();
  assert.equal(result.sites[0].siteUrl, 'https://a.invalid/blog/');
  assert.equal(result.sites[1].permissionLevel, 'siteUnverifiedUser');
  assert.equal(result.fetchedAt, now().toISOString());
});

test('query validates before network access and maps ordered dimensions and exact filters', async () => {
  let calls = 0;
  const p = provider(async (url, options) => {
    calls++;
    assert.ok(url.endsWith('/sc-domain%3Aexample.invalid/searchAnalytics/query'));
    assert.equal(options.method, 'POST');
    assert.deepEqual(options.body.dimensions, ['query']);
    assert.deepEqual(options.body.dimensionFilterGroups, [{ groupType: 'and', filters: [
      { dimension: 'query', operator: 'equals', expression: 'Exact Case' },
    ] }]);
    assert.equal(options.body.type, 'web'); assert.equal(options.body.dataState, 'final');
    return { rows: [row('Exact Case')], responseAggregationType: 'byProperty' };
  });
  await assert.rejects(p.query({ ...base, dimensions: ['query', 'query'] }), { code: 'SC_DIMENSIONS_INVALID' });
  assert.equal(calls, 0);
  const result = await p.query({ ...base, filters: [{ dimension: 'query', expression: 'Exact Case' }] });
  assert.equal(result.rows[0].ctr, 0.1);
  assert.equal(result.source.responseAggregationType, 'byProperty');
  assert.equal(result.collection.state, 'complete'); assert.equal(result.collection.exhausted, true);
});

test('internal pages never exceed 1,000 rows and an observed short page proves exhaustion', async () => {
  const requests = [];
  const result = await provider(async (_, { body }) => {
    requests.push(body);
    return page(body.startRow, body.startRow === 0 ? 1000 : 11);
  }).query({ ...base, rowLimit: 50000 });
  assert.deepEqual(requests.map(body => [body.startRow, body.rowLimit]), [[0, 1000], [1000, 1000]]);
  assert.equal(result.collection.state, 'complete'); assert.equal(result.collection.returnedRows, 1011);
  assert.equal(result.collection.exhausted, true); assert.equal(result.collection.continuationStartRow, null);
  assert.ok(result.source.limitations.some(text => text.includes('does not guarantee every underlying row')));
});

test('exact cap hit is partial and carries an honest continuation rather than an invented row total', async () => {
  const result = await provider(async (_, { body }) => page(body.startRow, body.rowLimit))
    .query({ ...base, rowLimit: 1500, startRow: 2000 });
  assert.equal(result.collection.requests, 2); assert.equal(result.collection.returnedRows, 1500);
  assert.equal(result.collection.state, 'partial'); assert.equal(result.collection.exhausted, false);
  assert.equal(result.collection.rowLimitReached, true);
  assert.equal(result.collection.continuationStartRow, 3500);
  assert.deepEqual(result.collection.reasons, ['SC_COLLECTION_ROW_LIMIT']);
});

test('empty terminal result is successful and differs from an initial provider failure', async () => {
  const empty = await provider(async () => ({})).query({ ...base, startRow: 5000 });
  assert.equal(empty.collection.state, 'complete'); assert.equal(empty.collection.exhausted, true);
  assert.deepEqual(empty.rows, []); assert.equal(empty.collection.continuationStartRow, null);
  await assert.rejects(provider(async () => { throw Error('private provider message'); }).query(base),
    { code: 'SC_PROVIDER_REQUEST_FAILED' });
});

test('failure after a valid page retains useful rows with a bounded reason and exact resume offset', async () => {
  const result = await provider(async (_, { body }) => {
    if (body.startRow) throw Error('private request body or token must never be printed');
    return page(0, 1000);
  }).query({ ...base, rowLimit: 5000 });
  assert.equal(result.collection.state, 'partial'); assert.equal(result.collection.requests, 2);
  assert.equal(result.collection.continuationStartRow, 1000);
  assert.deepEqual(result.collection.reasons, ['SC_PROVIDER_REQUEST_FAILED']);
  assert.ok(!JSON.stringify(result).includes('private request'));
});

test('duplicate dimension keys are retained and flagged, with no silent deduplication', async () => {
  const result = await provider(async () => ({ rows: [row('same'), row('same')] })).query(base);
  assert.equal(result.rows.length, 2); assert.equal(result.collection.state, 'partial');
  assert.deepEqual(result.collection.reasons, ['SC_PROVIDER_DUPLICATE_KEYS']);
});

test('unknown uppercase exception messages and codes cannot enter retained partial-report reasons', async () => {
  for (const error of [Error('PRIVATE_SECRET_MARKER'), Object.assign(Error('private'), { code: 'PRIVATE_SECRET_MARKER' })]) {
    const result = await provider(async (_, { body }) => {
      if (body.startRow) throw error;
      return page(0, 1000);
    }).query({ ...base, rowLimit: 2000 });
    assert.deepEqual(result.collection.reasons, ['SC_PROVIDER_REQUEST_FAILED']);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_SECRET_MARKER/);
  }
});

test('all ordered dimensions define identity; different dates for the same query are distinct', async () => {
  const result = await provider(async () => ({ rows: [
    row('x', { keys: ['x', '2026-09-01'] }), row('x', { keys: ['x', '2026-09-02'] }),
  ], metadata: { first_incomplete_date: '2026-09-28' } }))
    .query({ ...base, dimensions: ['query', 'date'], dataState: 'all' });
  assert.equal(result.collection.state, 'complete');
  assert.equal(result.source.metadata.first_incomplete_date, '2026-09-28');
  assert.equal(result.source.metadataPages.length, 1);
});

test('aggregation changes between pages stop collection before mixing incompatible rows', async () => {
  const result = await provider(async (_, { body }) => ({ ...page(body.startRow, 1000),
    responseAggregationType: body.startRow ? 'byPage' : 'byProperty' })).query({ ...base, rowLimit: 5000 });
  assert.equal(result.rows.length, 1000); assert.equal(result.source.responseAggregationType, 'byProperty');
  assert.deepEqual(result.collection.reasons, ['SC_PROVIDER_AGGREGATION_CHANGED']);
});

test('malformed and oversized responses are rejected rather than coerced into zero activity', async () => {
  for (const response of [null, [], { rows: null }, { rows: [row('x', { clicks: '1' })] },
    { rows: [row('x', { keys: ['x', 'extra'] })] }, { metadata: { first_incomplete_date: '2026-02-30' } }]) {
    await assert.rejects(provider(async () => response).query(base), { code: 'SC_RESPONSE_INVALID' });
  }
  await assert.rejects(provider(async () => ({ rows: [row('x'.repeat(2_000_001))] })).query(base),
    { code: 'SC_RESPONSE_TOO_LARGE' });
});

test('an aborted query makes no request; cancellation also interrupts an adapter that ignores the signal', async () => {
  const aborted = new AbortController(); aborted.abort(); let calls = 0;
  const p = provider(async () => { calls++; return {}; });
  await assert.rejects(p.query(base, { signal: aborted.signal }), { code: 'SC_ABORTED' });
  assert.equal(calls, 0);
  const controller = new AbortController();
  const pending = provider(async (_, { signal }) => {
    assert.equal(signal, controller.signal);
    setTimeout(() => controller.abort(), 5);
    return new Promise(() => {});
  }).query(base, { signal: controller.signal });
  await assert.rejects(pending, { code: 'SC_ABORTED' });
});

test('late abort preserves partial rows for diagnostics without pretending collection completed', async () => {
  const controller = new AbortController();
  const result = await provider(async (_, { body }) => {
    if (!body.startRow) return page(0, 1000);
    controller.abort(); return new Promise(() => {});
  }).query({ ...base, rowLimit: 5000 }, { signal: controller.signal });
  assert.equal(result.rows.length, 1000);
  assert.equal(result.collection.state, 'partial');
  assert.deepEqual(result.collection.reasons, ['SC_ABORTED']);
});

test('maximum supported scan remains bounded in row count, page size and request count', async () => {
  let calls = 0;
  const result = await provider(async (_, { body }) => {
    calls++; assert.ok(body.rowLimit <= 1000);
    return page(body.startRow, body.rowLimit);
  }).query({ ...base, rowLimit: 50000 });
  assert.equal(result.rows.length, 50000); assert.equal(calls, 50);
  assert.equal(result.collection.state, 'partial');
  assert.equal(result.collection.continuationStartRow, 50000);
});

test('a repeated provider page stops promptly and preserves the collision evidence', async () => {
  const result = await provider(async () => page(0, 1000)).query({ ...base, rowLimit: 5000 });
  assert.equal(result.rows.length, 2000); assert.equal(result.collection.requests, 2);
  assert.equal(result.rows[0].keys[0], result.rows[1000].keys[0]);
  assert.deepEqual(result.collection.reasons, ['SC_PROVIDER_DUPLICATE_KEYS']);
});

test('the collection byte budget stops many individually valid pages without discarding earlier rows', async () => {
  const longKey = 'x'.repeat(1800);
  const result = await provider(async (_, { body }) => ({ ...page(body.startRow, body.rowLimit),
    rows: Array.from({ length: body.rowLimit }, (_, i) => row(longKey + (body.startRow + i))),
  })).query({ ...base, rowLimit: 50000 });
  assert.equal(result.collection.state, 'partial');
  assert.ok(result.collection.returnedRows > 1000 && result.collection.returnedRows < 50000);
  assert.ok(result.collection.requests < 60);
  assert.deepEqual(result.collection.reasons, ['SC_COLLECTION_BYTE_LIMIT']);
});
