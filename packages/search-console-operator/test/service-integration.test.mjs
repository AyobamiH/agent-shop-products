import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createSearchConsoleProvider } from '../src/core/provider.mjs';
import { createSnapshotStore } from '../src/storage/snapshot-store.mjs';
import { createSearchConsoleService } from '../src/service.mjs';
import { canonicalJson } from '../src/storage/canonical-json.mjs';
import { tools } from '../src/contracts.mjs';

// Synthetic provider data tests the real provider -> service -> durable snapshot path.
const siteUrl = 'sc-domain:example.test';
const args = { siteUrl, startDate: '2026-10-01', endDate: '2026-10-07' };
const now = () => new Date('2026-10-19T12:00:00.000Z');
const row = (keys, clicks, impressions, position) => ({ keys, clicks, impressions,
  ctr: impressions ? clicks / impressions : 0, position });

function setup(t, behaviour = {}) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'sc-service-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const calls = [];
  const session = { async request(endpoint, options = {}) {
    calls.push({ endpoint, ...options });
    if (options.method === 'GET') return { siteEntry: [{ siteUrl, permissionLevel: behaviour.permission || 'siteOwner' }] };
    const body = options.body;
    if (behaviour.fail?.(body)) throw Object.assign(new Error('PRIVATE_PROVIDER_MARKER'), { code: 'GOOGLE_RATE_LIMITED' });
    let rows;
    if (body.dimensions.length === 0) rows = behaviour.empty ? [] : [row([], body.startDate < args.startDate ? 50 : 100, 1000, 8)];
    else if (body.dimensions.includes('date')) rows = body.dimensions.length === 1 ?
      [row([body.startDate], 0, 0, 0), row([body.endDate], 100, 1000, 8)] :
      [row([body.startDate, 'alpha'], 50, 500, 3), row([body.endDate, 'unknown'], 10, 100, null)];
    else if (body.dimensions[0] === 'page') rows = [row(['https://example.test/a'], 60, 900, 3), row(['https://example.test/b'], 40, 600, 20)];
    else rows = [row(['alpha'], 50, 500, 3), row(['beta'], 20, 200, 20)];
    if (behaviour.duplicate && body.dimensions.length) rows = [rows[0], rows[0]];
    const responseAggregationType = body.dimensions.includes('page') || body.dimensionFilterGroups?.[0].filters.some(f => f.dimension === 'page') ? 'byPage' : 'byProperty';
    return { rows: rows.slice(body.startRow, body.startRow + body.rowLimit),
      ...(behaviour.aggregationMissing ? {} : { responseAggregationType }),
      metadata: { first_incomplete_date: '2026-10-17' } };
  } };
  const provider = createSearchConsoleProvider({ session, now });
  const store = createSnapshotStore(path.join(directory, 'snapshots'));
  const service = createSearchConsoleService({ provider, store, now,
    account: async () => ({ connection: 'verified_test_fixture', email: 'test@example.test' }) });
  return { directory, calls, provider, store, service };
}

test('all twelve advertised tools execute through real core, with nine durable reports and three metadata reads', async t => {
  const { service, store } = setup(t);
  const inputs = { get_account_info: {}, list_sites: {}, get_filter_options: { siteUrl },
    get_query_performance: { ...args, query: 'alpha' }, get_page_performance: { ...args, pageUrl: 'https://example.test/a' } };
  for (const tool of tools) {
    const result = await service.callTool(tool.name, inputs[tool.name] || args);
    assert.equal(result.tool, tool.name); assert.equal(result.status, 'complete', tool.name);
  }
  assert.equal((await store.list()).length, 9);
});

test('summary uses separate totals, honest prior-period changes and null ratios for zero-impression days', async t => {
  const { service, calls } = setup(t);
  const result = await service.callTool('get_site_summary', args);
  assert.deepEqual(result.data.current.totals, { clicks: 100, impressions: 1000, ctr: 10, position: 8 });
  assert.equal(result.data.previous.totals.clicks, 50);
  assert.equal(result.data.changes.clicks.percent, 100);
  assert.equal(result.data.daily.rows.length, 2); // Five absent days stay absent.
  assert.equal(result.data.daily.rows[0].ctr, null);
  assert.equal(result.data.daily.rows[0].position, null);
  assert.equal(result.window.previous.startDate, '2026-09-24');
  const queries = calls.filter(call => call.method === 'POST');
  assert.equal(queries.length, 3);
  assert.equal(queries.filter(call => call.body.dimensions.length === 0).length, 2);
  assert.equal(result.data.current.source.metadata.first_incomplete_date, '2026-10-17');
});

test('observed query share is qualified and page aggregation cannot masquerade as property coverage', async t => {
  const { service } = setup(t);
  const query = await service.callTool('query_top_queries', args);
  assert.equal(query.data.rows[0].ctr, 10);
  assert.equal(query.evidence.coverage.hiddenClickShareEstimate, 0.3);
  assert.equal(query.evidence.coverage.underlyingDataComplete, false);
  const page = await service.callTool('query_top_pages', args);
  assert.equal(page.data.rowSection.observedMetrics.impressions, 1500);
  assert.equal(page.data.aggregate.totals.impressions, 1000);
  assert.equal(page.evidence.coverage.aggregationCompatible, false);
  assert.equal(page.evidence.coverage.hiddenClickShareEstimate, null);
});

test('missing aggregation metadata never establishes compatible coverage', async t => {
  const { service } = setup(t, { aggregationMissing: true });
  const result = await service.callTool('query_top_queries', args);
  assert.equal(result.evidence.coverage.aggregationCompatible, false);
  assert.equal(result.evidence.coverage.hiddenClickShareEstimate, null);
});

test('an empty aggregate response means no reported data, distinct from a returned zero-valued row', async t => {
  const { service } = setup(t, { empty: true });
  const result = await service.callTool('get_site_summary', args);
  assert.equal(result.data.current.status, 'complete');
  assert.equal(result.data.current.availability, 'no_reported_data');
  assert.equal(result.data.current.totals, null);
  assert.equal(result.data.changes.clicks.state, 'no_data');
});

test('failed comparison data stays unknown and is safely retained; total failure is explicit', async t => {
  const partial = setup(t, { fail: body => body.startDate < args.startDate });
  const result = await partial.service.callTool('get_site_summary', args);
  assert.equal(result.status, 'partial'); assert.equal(result.data.previous.totals, null);
  assert.equal(result.data.changes.clicks.state, 'no_data');
  assert.doesNotMatch(JSON.stringify(await partial.store.load(result.snapshot.id)), /PRIVATE_PROVIDER_MARKER/);
  const failed = setup(t, { fail: () => true });
  const report = await failed.service.callTool('query_top_queries', args);
  assert.equal(report.status, 'failed'); assert.equal(report.data.rows, null);
  assert.equal(report.data.aggregate.totals, null);
  assert.equal((await failed.store.list()).length, 1);
  assert.equal(report.evidence.coverage.aggregationCompatible, false);
});

test('strict scope, future-date and unsupported-selector checks prevent analytics calls and snapshot writes', async t => {
  const { service, calls, directory } = setup(t);
  await assert.rejects(service.callTool('query_top_queries', { ...args, brand: 'branded' }), { code: 'FEATURE_NOT_IMPLEMENTED' });
  await assert.rejects(service.callTool('query_search_analytics', { ...args, unknown: true }), { code: 'INVALID_ARGUMENT' });
  await assert.rejects(service.callTool('query_top_pages', { ...args, endDate: '2027-01-01' }));
  assert.equal(calls.length, 0);
  await assert.rejects(service.callTool('get_site_summary', { ...args, siteUrl: 'sc-domain:unlisted.test' }), { code: 'PROPERTY_ACCESS_DENIED' });
  assert.equal(calls.filter(call => call.method === 'POST').length, 0);
  assert.deepEqual(readdirSync(directory), []);
});

test('query/page matching and omitted generic operators are exact at Google boundary', async t => {
  const { service, calls } = setup(t);
  await service.callTool('get_query_performance', { ...args, query: 'alpha', pageUrl: 'https://example.test/a' });
  const request = calls.find(call => call.method === 'POST').body;
  assert.deepEqual(request.dimensionFilterGroups[0].filters, [
    { dimension: 'page', operator: 'equals', expression: 'https://example.test/a' },
    { dimension: 'query', operator: 'equals', expression: 'alpha' },
  ]);
  calls.length = 0;
  await service.callTool('query_search_analytics', { ...args, filters: [{ dimension: 'query', expression: 'alpha' }] });
  assert.equal(calls.find(call => call.method === 'POST').body.dimensionFilterGroups[0].filters[0].operator, 'equals');
});

test('daily bands retain unclassified rows and convert every outward CTR exactly once', async t => {
  const { service } = setup(t);
  const result = await service.callTool('get_position_distribution', { ...args, granularity: 'daily' });
  assert.equal(result.data.distribution[0].buckets[0].ctr, 10);
  assert.equal(result.data.distribution[1].unclassified.ctr, 10);
  assert.equal(result.data.distribution[1].unclassifiedRows, 1);
  assert.equal(result.data.distribution[1].unclassified.position, null);
});

test('duplicate provider rows remain evidence but do not produce a misleading distribution or sum', async t => {
  const { service } = setup(t, { duplicate: true });
  const result = await service.callTool('get_position_distribution', args);
  assert.equal(result.status, 'partial'); assert.equal(result.data.rows.length, 2);
  assert.equal(result.data.distribution, null); assert.equal(result.data.rowSection.observedMetrics, null);
});

test('saved report replays identically after restart without any provider or account access', async t => {
  const { service, store } = setup(t);
  const original = await service.callTool('get_site_summary', args);
  let networkCalls = 0;
  const restarted = createSearchConsoleService({ store, provider: {
    async query() { networkCalls++; throw Error('No network in replay'); },
    async listSites() { networkCalls++; throw Error('No network in replay'); },
  }, account: async () => { throw Error('No credentials in replay'); } });
  assert.equal(canonicalJson(await restarted.replay(original.snapshot.id)), canonicalJson(original));
  assert.equal(networkCalls, 0);
});
