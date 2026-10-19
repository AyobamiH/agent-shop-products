import { positionBands } from '../core/metrics.mjs';
import { collectSection, totalsArgs, aggregateSection, combinedStatus, changes, rowCoverage, percentMetrics } from './sections.mjs';

export async function summaryReport(provider, base, window, options) {
  const [currentRaw, previousRaw, daily] = await Promise.all([
    collectSection(provider, totalsArgs(base), options),
    collectSection(provider, totalsArgs({ ...base, ...window.previous }), options),
    collectSection(provider, { ...base, dimensions: ['date'], rowLimit: 1000, startRow: 0 }, options),
  ]);
  const current = aggregateSection(currentRaw); const previous = aggregateSection(previousRaw);
  return { status: combinedStatus([current, previous, daily]),
    data: { current, previous, changes: changes(current.totals, previous.totals), daily },
    evidence: { totalsSource: 'separate_aggregate_queries', missingDays: 'absent_rows_are_not_filled_with_zero' } };
}

export async function rowsReport(provider, base, options) {
  const [rows, aggregateRaw] = await Promise.all([
    collectSection(provider, base, options), collectSection(provider, totalsArgs(base), options),
  ]);
  const aggregate = aggregateSection(aggregateRaw);
  const { rows: values, ...rowSection } = rows;
  return { status: combinedStatus([rows, aggregate]), data: { rows: values, rowSection, aggregate },
    evidence: { coverage: rowCoverage(rows, aggregate), missingDays: 'absent_rows_are_not_filled_with_zero' } };
}

function bands(rows) {
  const result = positionBands(rows.map(row => ({ ...row, ctr: row.ctr === null ? null : row.ctr / 100 })));
  return { ...result, buckets: result.buckets.map(percentMetrics), totals: percentMetrics(result.totals),
    unclassified: percentMetrics(result.unclassified) };
}

export async function distributionReport(provider, base, granularity, options) {
  const report = await rowsReport(provider, base, options);
  const rows = report.data.rows;
  let distribution = null;
  if (rows && !report.data.rowSection.collection.reasons.includes('SC_PROVIDER_DUPLICATE_KEYS')) {
    if (granularity === 'daily') {
      const grouped = new Map();
      for (const row of rows) {
        if (!grouped.has(row.date)) grouped.set(row.date, []);
        grouped.get(row.date).push(row);
      }
      distribution = [...grouped.keys()].sort().map(date => ({ date, ...bands(grouped.get(date)) }));
    } else distribution = bands(rows);
  }
  return { ...report, data: { ...report.data, distribution },
    evidence: { ...report.evidence, bandsClassify: 'reported_average_position_without_rounding',
      distributionPopulation: 'returned_rows_only', granularity } };
}
