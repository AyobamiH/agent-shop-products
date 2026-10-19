import { sumMetrics, metricChange } from '../core/metrics.mjs';
import { publicError } from '../errors.mjs';
import { authError } from '../auth/constants.mjs';

export const UNITS = Object.freeze({ clicks: 'count', impressions: 'count', ctr: 'percent',
  position: 'impression_weighted_average', changePercent: 'percent', coverageShare: 'fraction_0_to_1' });

export function percentMetrics(value) {
  return { ...value, ctr: value.ctr === null ? null : value.ctr * 100 };
}

export function publicRows(rows, dimensions) {
  return rows.map(row => ({ keys: row.keys, ...Object.fromEntries(dimensions.map((name, index) => [name, row.keys[index]])),
    ...percentMetrics({ clicks: row.clicks, impressions: row.impressions,
      ctr: row.impressions ? row.ctr : null, position: row.impressions ? row.position : null }) }));
}

export async function collectSection(provider, args, options = {}) {
  try {
    const result = await provider.query(args, options);
    if (options.signal?.aborted) throw authError('OPERATION_CANCELLED');
    const reliableRows = !result.collection.reasons.includes('SC_PROVIDER_DUPLICATE_KEYS');
    return { status: result.collection.state, rows: publicRows(result.rows, result.request.dimensions),
      collection: result.collection, source: result.source, fetchedAt: result.fetchedAt,
      request: result.request, observedMetrics: reliableRows ? percentMetrics(sumMetrics(result.rows)) : null };
  } catch (error) {
    if (options.signal?.aborted || ['OPERATION_CANCELLED', 'REQUEST_ABORTED'].includes(error.code)) throw error;
    return { status: 'failed', rows: null, observedMetrics: null, request: args,
      collection: { state: 'failed', reasons: [publicError(error).code] },
      source: { coverage: 'unknown' }, fetchedAt: null, error: publicError(error) };
  }
}

export function totalsArgs(base) {
  const pageFiltered = base.filters.some(filter => filter.dimension === 'page');
  const aggregationType = ['discover', 'googleNews'].includes(base.searchType) ? 'auto' : pageFiltered ? 'byPage' : 'byProperty';
  return { ...base, dimensions: [], rowLimit: 2, startRow: 0, aggregationType };
}

export function aggregateSection(section) {
  const returnedAggregate = section.status === 'complete' && section.rows.length > 0;
  return { ...section, totals: returnedAggregate ? section.observedMetrics : null,
    availability: returnedAggregate ? 'returned_aggregate' : section.status === 'complete' ? 'no_reported_data' : 'not_available',
    totalsMeaning: section.request.aggregationType === 'byProperty' ? 'independent_property_aggregate' :
      section.request.aggregationType === 'byPage' ? 'independent_page_filtered_aggregate' : 'independent_provider_aggregate' };
}

export function combinedStatus(sections) {
  if (sections.every(section => section.status === 'failed')) return 'failed';
  return sections.every(section => section.status === 'complete') ? 'complete' : 'partial';
}

export function changes(current, previous) {
  return Object.fromEntries(['clicks', 'impressions', 'ctr', 'position'].map(metric =>
    [metric, metricChange(current?.[metric] ?? null, previous?.[metric] ?? null)]));
}

export function rowCoverage(rows, aggregate) {
  const type = rows.source?.responseAggregationType;
  const compatible = ['byProperty', 'byPage'].includes(type) && type === aggregate.source?.responseAggregationType;
  const queryOnly = rows.request.dimensions.length === 1 && rows.request.dimensions[0] === 'query';
  const scanned = rows.status === 'complete' && rows.collection.exhausted && rows.request.startRow === 0;
  const total = aggregate.totals?.clicks;
  const observed = rows.observedMetrics?.clicks;
  const estimable = compatible && queryOnly && scanned && Number.isFinite(total) && total > 0 && observed <= total;
  return { independentTotals: aggregate.totals, totalsMeaning: aggregate.totalsMeaning,
    aggregationCompatible: compatible, providerScanExhausted: Boolean(rows.collection.exhausted),
    underlyingDataComplete: false, hiddenClickShareEstimate: estimable ? (total - observed) / total : null,
    hiddenClickShareMeaning: estimable ? 'aggregate_minus_returned_named_queries_not_a_recovery_of_hidden_rows' : 'not_estimable',
    limitations: ['Search Console exposes top rows and may omit anonymised queries.',
      'A terminal page establishes response exhaustion, not complete underlying search data.',
      'Page aggregation and property aggregation can count impressions differently.'] };
}
