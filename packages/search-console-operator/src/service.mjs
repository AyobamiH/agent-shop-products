import { parseToolArgs, tools } from './contracts.mjs';
import { operationError } from './errors.mjs';
import { resolveWindow } from './core/dates.mjs';
import { validateProperty, validateQuery } from './core/validation.mjs';
import { UNITS } from './reporting/sections.mjs';
import { summaryReport, rowsReport, distributionReport } from './reporting/reports.mjs';
import { replaySnapshot } from './storage/replay.mjs';

export const ALGORITHM_VERSION = '1.0.0';
const dimensionsByTool = Object.freeze({ query_top_queries: ['query'], query_top_pages: ['page'],
  query_countries: ['country'], query_devices: ['device'], get_page_performance: ['date'], get_query_performance: ['date'] });

function queryArguments(name, args, window) {
  const filters = args.filters ? args.filters.map(filter => ({ ...filter, operator: filter.operator || 'equals' })) : [];
  if (name === 'get_page_performance' || (name === 'get_query_performance' && args.pageUrl)) {
    filters.push({ dimension: 'page', operator: 'equals', expression: args.pageUrl });
  }
  if (name === 'get_query_performance') filters.push({ dimension: 'query', operator: 'equals', expression: args.query });
  let dimensions = dimensionsByTool[name] || args.dimensions || [];
  if (name === 'get_position_distribution') dimensions = args.granularity === 'daily' ? ['date', 'query'] : [args.dimension || 'query'];
  const rowLimit = name === 'get_position_distribution' ? args.scanLimit || 25000 :
    name.endsWith('_performance') || name === 'query_devices' ? 1000 : args.rowLimit || args.limit || 100;
  return { siteUrl: args.siteUrl, startDate: window.startDate, endDate: window.endDate,
    dimensions, filters, searchType: args.searchType || 'web', dataState: 'final', aggregationType: 'auto',
    rowLimit, startRow: args.startRow || args.offset || 0 };
}

function selectorsSupported(args) {
  if (args.brand || args.contentGroupId || args.topicClusterId) throw operationError('FEATURE_NOT_IMPLEMENTED');
}

export function createSearchConsoleService({ provider, store, account = async () => ({ connection: 'not_provided' }), now = () => new Date() }) {
  if (!provider || !store) throw operationError('CONFIGURATION_REQUIRED');
  async function requireSite(siteUrl, options) {
    validateProperty(siteUrl);
    const inventory = await provider.listSites(options);
    const site = inventory.sites.find(item => item.siteUrl === siteUrl);
    if (!site || !['siteOwner', 'siteFullUser', 'siteRestrictedUser'].includes(site.permissionLevel)) {
      throw operationError('PROPERTY_ACCESS_DENIED');
    }
    return { siteUrl, permissionLevel: site.permissionLevel, accessCheckedAt: inventory.fetchedAt };
  }
  return {
    async status() { return account(); },
    async listSnapshots(options = {}) { return store.list(options); },
    async replay(id) {
      const replay = replaySnapshot(await store.load(id), { id });
      return { ...replay.result, snapshot: { id: replay.snapshotId, capturedAt: replay.capturedAt,
        algorithmVersion: replay.algorithmVersion } };
    },
    async callTool(name, input, options = {}) {
      const args = parseToolArgs(name, input);
      selectorsSupported(args);
      if (name === 'get_account_info') return { schemaVersion: 1, tool: name, status: 'complete',
        data: { ...await account(), product: 'search-console-operator', version: '0.1.0',
          supportedTools: tools.map(tool => tool.name), providerAccess: 'read_only', reportStorage: 'local_private_snapshots' } };
      if (name === 'list_sites') return { schemaVersion: 1, tool: name, status: 'complete', data: await provider.listSites(options) };
      const currentTime = now();
      const window = name === 'get_filter_options' ? null : resolveWindow(args, currentTime);
      const base = window ? validateQuery(queryArguments(name, args, window), currentTime) : null;
      const scope = await requireSite(args.siteUrl, options);
      if (name === 'get_filter_options') return { schemaVersion: 1, tool: name, status: 'complete', scope,
        data: { dimensions: ['date', 'query', 'page', 'country', 'device', 'searchAppearance'],
          filterDimensions: ['query', 'page', 'country', 'device'], filterCombination: 'and',
          operators: ['equals', 'contains', 'notEquals', 'notContains', 'includingRegex', 'excludingRegex'],
          regexDialect: 'RE2', brand: { supported: false }, contentGroups: { supported: false, values: [] },
          topicClusters: { supported: false, values: [] }, datePolicy: 'explicit_edges_win_single_edge_uses_days_default_28' } };
      let report;
      if (name === 'get_site_summary') report = await summaryReport(provider, base, window, options);
      else if (name === 'get_position_distribution') report = await distributionReport(provider, base, args.granularity || 'period', options);
      else report = await rowsReport(provider, base, options);
      const capturedAt = now().toISOString();
      const result = { schemaVersion: 1, tool: name, status: report.status,
        scope: { ...scope, filters: base.filters, searchType: base.searchType }, window, units: UNITS,
        data: report.data, evidence: { ...report.evidence, capturedAt,
          algorithmVersion: ALGORITHM_VERSION, provider: 'google_search_console',
          underlyingDataCompleteness: 'not_guaranteed_by_provider', compatibility: 'independent_M1_response_schema' } };
      const saved = await store.save({ schemaVersion: 1, kind: 'search-console-report', algorithmVersion: ALGORITHM_VERSION,
        capturedAt, tool: name, args, result });
      return { ...result, snapshot: { id: saved.id, capturedAt, algorithmVersion: ALGORITHM_VERSION } };
    },
  };
}
