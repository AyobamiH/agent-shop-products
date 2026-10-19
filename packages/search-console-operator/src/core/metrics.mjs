import { fail } from './errors.mjs';

function count(value) {
  if (!Number.isFinite(value) || value < 0) fail('SC_METRIC_INVALID');
  return value;
}

function rowsArray(rows) {
  if (!Array.isArray(rows)) fail('SC_ROWS_INVALID');
}

/** Rates use ratio-of-sums; positions use impression weights at the supplied grain. */
export function sumMetrics(rows) {
  rowsArray(rows);
  let clicks = 0, impressions = 0, positionWeight = 0, positionUnknown = false;
  for (const row of rows) {
    if (!row || typeof row !== 'object') fail('SC_ROW_INVALID');
    const weight = count(row.impressions);
    if (row.position !== null && row.position !== undefined) count(row.position);
    clicks += count(row.clicks); impressions += weight;
    if (weight > 0) {
      if (row.position === null || row.position === undefined || row.position === 0) positionUnknown = true;
      else positionWeight += count(row.position) * weight;
    }
  }
  if (![clicks, impressions, positionWeight].every(Number.isFinite)) fail('SC_METRIC_OVERFLOW');
  return { clicks, impressions, ctr: impressions > 0 ? clicks / impressions : null,
    position: impressions > 0 && !positionUnknown ? positionWeight / impressions : null };
}

export function metricChange(current, previous) {
  if (current !== null && current !== undefined) count(current);
  if (previous !== null && previous !== undefined) count(previous);
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return { current: current ?? null, previous: previous ?? null, absolute: null, percent: null, state: 'no_data' };
  }
  const absolute = current - previous;
  const percent = previous === 0 ? null : absolute / previous * 100;
  if (percent !== null && !Number.isFinite(percent)) fail('SC_METRIC_OVERFLOW');
  return { current, previous, absolute, percent, state: previous === 0 ? 'zero_baseline' : 'defined' };
}

const BANDS = [
  { key: 'top3', label: '1–3', bandOrder: 1, ceiling: 3 },
  { key: 'first', label: '>3–10', bandOrder: 2, ceiling: 10 },
  { key: 'second', label: '>10–20', bandOrder: 3, ceiling: 20 },
  { key: 'deep', label: '>20', bandOrder: 4, ceiling: Infinity },
];

export function positionBands(rows) {
  rowsArray(rows);
  const totals = { ...sumMetrics(rows), rows: rows.length };
  const members = BANDS.map(() => []), unclassified = [];
  for (const row of rows) {
    if (!Number.isFinite(row.position) || row.position < 1 || row.impressions === 0) {
      unclassified.push(row); continue;
    }
    const index = BANDS.findIndex(band => row.position <= band.ceiling);
    members[index].push(row);
  }
  const buckets = BANDS.map(({ key, label, bandOrder }, index) => {
    const metrics = sumMetrics(members[index]);
    return { key, label, bandOrder, rows: members[index].length, ...metrics,
      clickShare: totals.clicks > 0 ? metrics.clicks / totals.clicks : null,
      impressionShare: totals.impressions > 0 ? metrics.impressions / totals.impressions : null };
  });
  return { buckets, totals, unclassifiedRows: unclassified.length,
    unclassified: { ...sumMetrics(unclassified), rows: unclassified.length } };
}
