import { SHOP_HOST, SHOP_ORIGIN, GSC_PROPERTY, numericResource } from './constants.mjs';
import { ADMIN, DATA } from './inventory.mjs';
export const BUSINESS_EVENTS = ['page_view', 'select_capability', 'quote_click'];
export const DIAGNOSTIC_EVENT = 'agent_shop_diagnostic';
export function dateWindow(start, end) {
  for (const date of [start, end]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date) throw Error('REPORT_DATE_INVALID');
  }
  const days = (Date.parse(end) - Date.parse(start)) / 86400000;
  if (days < 0 || days > 92 || Date.parse(end) > Date.now()) throw Error('REPORT_WINDOW_INVALID');
  return { startDate: start, endDate: end };
}
export function searchQuery(start, end) {
  return { ...dateWindow(start, end), dimensions: ['page', 'query'], type: 'web', dataState: 'final',
    dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'includingRegex',
      expression: '^https://agents\\.proofandstate\\.com/' }] }], rowLimit: 25000, startRow: 0 };
}
export async function searchReport(session, start, end) {
  const body = searchQuery(start, end);
  const report = await session.request('https://www.googleapis.com/webmasters/v3/sites/' +
    encodeURIComponent(GSC_PROPERTY) + '/searchAnalytics/query', { method: 'POST', body });
  return { schemaVersion: 1, observedAt: new Date().toISOString(), source: 'google_search_console_direct',
    scope: { property: GSC_PROPERTY, hostname: SHOP_HOST, ...dateWindow(start, end), dataState: 'final' },
    coverage: 'Top rows returned by Google; not guaranteed to include every row or anonymised query.',
    rows: report.rows || [], responseAggregationType: report.responseAggregationType || null,
    businessOutcome: 'Search impressions and clicks only; not sessions, enquiries or sales.' };
}
export async function boundStream(session, property, streamId) {
  numericResource(property, 'properties');
  if (!/^\d+$/.test(streamId || '')) throw Error('STREAM_ID_INVALID');
  const stream = await session.request(ADMIN + property + '/dataStreams/' + streamId);
  let uri; try { uri = new URL(stream.webStreamData?.defaultUri); } catch { throw Error('SHOP_STREAM_ORIGIN_MISMATCH'); }
  if (stream.type !== 'WEB_DATA_STREAM' || uri.origin !== SHOP_ORIGIN || uri.username || uri.password ||
      stream.name !== property + '/dataStreams/' + streamId) throw Error('SHOP_STREAM_ORIGIN_MISMATCH');
  return stream;
}
export async function analyticsReport(session, property, streamId, start, end) {
  await boundStream(session, property, streamId);
  const body = { dateRanges: [dateWindow(start, end)],
    dimensions: [{ name: 'hostName' }, { name: 'pagePath' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }, { name: 'sessions' }],
    dimensionFilter: { andGroup: { expressions: [
      { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: SHOP_HOST } } },
      { filter: { fieldName: 'eventName', inListFilter: { values: BUSINESS_EVENTS } } },
      { filter: { fieldName: 'streamId', stringFilter: { matchType: 'EXACT', value: streamId } } },
    ] } }, limit: 10000, returnPropertyQuota: true };
  const report = await session.request(DATA + property + ':runReport', { method: 'POST', body });
  return { observedAt: new Date().toISOString(), source: 'google_analytics_data_direct', property, streamId,
    hostname: SHOP_HOST, window: dateWindow(start, end), report,
    caveat: 'Consented measured activity only. Page/event rows overlap; do not sum row sessions as unique sessions or leads.' };
}
export async function realtimeReport(session, property, streamId, { diagnostic = false } = {}) {
  await boundStream(session, property, streamId);
  const report = await session.request(DATA + property + ':runRealtimeReport', { method: 'POST', body: {
    dimensions: [{ name: 'streamId' }, { name: 'eventName' }], metrics: [{ name: 'eventCount' }],
    dimensionFilter: { andGroup: { expressions: [
      { filter: { fieldName: 'streamId', stringFilter: { matchType: 'EXACT', value: streamId } } },
      { filter: { fieldName: 'eventName', inListFilter: { values: diagnostic ? [DIAGNOSTIC_EVENT] : BUSINESS_EVENTS } } },
    ] } }, limit: 1000,
  } });
  return { observedAt: new Date().toISOString(), source: 'google_analytics_realtime_direct', property, streamId,
    verifiedStreamOrigin: SHOP_ORIGIN, diagnosticOnly: diagnostic, report, caveat: 'Realtime diagnostic activity is not independently qualified demand.' };
}
export async function inspectUrl(session, value) {
  let url; try { url = new URL(value); } catch { throw Error('INSPECTION_URL_INVALID'); }
  if (url.origin !== SHOP_ORIGIN || url.search || url.hash || url.username || url.password ||
      url.pathname.startsWith('/api/') || url.pathname.startsWith('/private-kits/complete')) {
    throw Error('INSPECTION_URL_OUTSIDE_PUBLIC_SHOP');
  }
  const report = await session.request('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST', body: { inspectionUrl: url.href, siteUrl: GSC_PROPERTY, languageCode: 'en-GB' },
  });
  return { observedAt: new Date().toISOString(), source: 'google_url_inspection_direct', url: url.href, report,
    caveat: 'Google indexed-version observation, not an indexing request, visitor or customer result.' };
}
export async function sitemapReport(session) {
  const report = await session.request('https://www.googleapis.com/webmasters/v3/sites/' +
    encodeURIComponent(GSC_PROPERTY) + '/sitemaps');
  return { observedAt: new Date().toISOString(), source: 'google_sitemaps_direct', property: GSC_PROPERTY,
    sitemaps: (report.sitemap || []).filter(s => {
      try { return new URL(s.path).origin === SHOP_ORIGIN; } catch { return false; }
    }), caveat: 'Sitemap download is not evidence of page indexing or demand.' };
}
