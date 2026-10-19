#!/usr/bin/env node
// Explicit opt-in live acceptance. Never included in the default test suite or CI.
import { parseArgs } from 'node:util';
import { createDefaultService, configuration } from '../src/bootstrap.mjs';
import { createGoogleSession } from '../src/auth/session.mjs';
import { privateWrite } from '../src/auth/private-store.mjs';
import { publicError } from '../src/errors.mjs';
import { canonicalJson } from '../src/storage/canonical-json.mjs';

const { values } = parseArgs({ options: { site: { type: 'string' }, 'state-dir': { type: 'string' },
  'owner-credentials-dir': { type: 'string' } }, strict: true, allowPositionals: false });
if (!values.site) {
  process.stderr.write('Provide --site with an exact property returned by list_sites.\n');
  process.exitCode = 1;
} else {
  const options = { ...(values['state-dir'] ? { stateDir: values['state-dir'] } : {}),
    ...(values['owner-credentials-dir'] ? { ownerCredentialsDir: values['owner-credentials-dir'] } : {}) };
  const config = configuration(options);
  const service = await createDefaultService(options);
  const records = []; const reports = [];
  async function call(name, args) {
    const result = await service.callTool(name, args);
    const record = { tool: name, status: result.status, snapshotId: result.snapshot?.id || null };
    if (result.data.rows) record.returnedRows = result.data.rows.length;
    records.push(record);
    if (result.snapshot) reports.push(result);
    return result;
  }
  try {
    const account = await call('get_account_info', {});
    const sites = await call('list_sites', {});
    await call('get_filter_options', { siteUrl: values.site });
    const summary = await call('get_site_summary', { siteUrl: values.site });
    const scope = { siteUrl: values.site, startDate: summary.window.startDate, endDate: summary.window.endDate };
    const queries = await call('query_top_queries', { ...scope, limit: 100 });
    const pages = await call('query_top_pages', { ...scope, limit: 100 });
    await call('query_countries', { ...scope, limit: 100 });
    await call('query_devices', scope);
    await call('query_search_analytics', { ...scope, dimensions: ['query', 'page'], rowLimit: 100 });
    if (queries.data.rows?.[0]) await call('get_query_performance', { ...scope, query: queries.data.rows[0].query });
    else records.push({ tool: 'get_query_performance', status: 'not_exercised_no_query_rows', snapshotId: null });
    if (pages.data.rows?.[0]) await call('get_page_performance', { ...scope, pageUrl: pages.data.rows[0].page });
    else records.push({ tool: 'get_page_performance', status: 'not_exercised_no_page_rows', snapshotId: null });
    await call('get_position_distribution', scope);
    await call('get_position_distribution', { ...scope, granularity: 'daily' });

    const direct = createGoogleSession({ directory: config.credentialDir, allowExistingScopes: config.allowExistingScopes });
    const raw = await direct.request('https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(values.site) + '/searchAnalytics/query',
      { method: 'POST', body: { startDate: scope.startDate, endDate: scope.endDate, dimensions: [],
        type: 'web', dataState: 'final', aggregationType: 'byProperty', rowLimit: 2, startRow: 0 } });
    const source = raw.rows?.[0]; const totals = summary.data.current.totals;
    const directTotalsMatch = source && totals ? source.clicks === totals.clicks && source.impressions === totals.impressions &&
      (source.impressions ? Math.abs(source.clicks / source.impressions * 100 - totals.ctr) < 1e-9 &&
        Math.abs(source.position - totals.position) < 1e-9 : totals.ctr === null && totals.position === null) : null;
    const offline = await createDefaultService({ stateDir: config.stateDir });
    const replayChecks = [];
    for (const report of reports) replayChecks.push({ id: report.snapshot.id,
      identical: canonicalJson(await offline.replay(report.snapshot.id)) === canonicalJson(report) });
    const receipt = { schemaVersion: 1, checkedAt: new Date().toISOString(), siteUrl: values.site,
      window: summary.window, identityVerified: account.data.connection === 'verified',
      propertiesListed: sites.data.sites.length, calls: records, currentTotals: totals,
      directTotalsMatch, replayChecks, allReplaysIdentical: replayChecks.every(check => check.identical),
      allAdvertisedToolsExercised: new Set(records.filter(record => ['complete', 'partial'].includes(record.status)).map(record => record.tool)).size === 12,
      providerFailures: reports.flatMap(report => {
        const reasons = Object.values(report.data).filter(section => section?.collection)
          .flatMap(section => section.collection.reasons || [])
          .filter(reason => !['SC_COLLECTION_ROW_LIMIT', 'SC_COLLECTION_BYTE_LIMIT', 'SC_COLLECTION_REQUEST_LIMIT'].includes(reason));
        return reasons.length ? [{ tool: report.tool, reasons }] : [];
      }) };
    const failed = records.some(record => record.status === 'failed') || receipt.providerFailures.length ||
      !receipt.allReplaysIdentical || directTotalsMatch === false;
    receipt.verificationStatus = failed ? 'failed' : !receipt.allAdvertisedToolsExercised || directTotalsMatch === null ? 'limited' : 'passed';
    privateWrite('live-acceptance.json', receipt, config.stateDir);
    process.stdout.write(JSON.stringify(receipt, null, 2) + '\n');
    process.exitCode = receipt.verificationStatus === 'failed' ? 1 : receipt.verificationStatus === 'limited' ? 2 : 0;
  } catch (error) {
    const receipt = { checkedAt: new Date().toISOString(), status: 'failed', completedCalls: records, error: publicError(error) };
    privateWrite('live-acceptance.json', receipt, config.stateDir);
    process.stderr.write(JSON.stringify(receipt) + '\n'); process.exitCode = 1;
  }
}
