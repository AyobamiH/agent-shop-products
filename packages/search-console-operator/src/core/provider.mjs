import { OperatorError, fail, safeErrorCode, requireSignal, requestWithSignal } from './errors.mjs';
import { validateProperty, validateQuery } from './validation.mjs';
import { responseBytes, parseQueryResponse, mergeMetadata, MAX_COLLECTION_BYTES } from './provider-response.mjs';

const SITES_ENDPOINT = 'https://www.googleapis.com/webmasters/v3/sites';
const PAGE_SIZE = 1000;
const MAX_REQUESTS = 60;
const PERMISSIONS = new Set(['siteOwner', 'siteFullUser', 'siteRestrictedUser', 'siteUnverifiedUser']);
const LIMITATIONS = [
  'Search Console returns top rows and does not guarantee every underlying row.',
  'Queries withheld by Google are not recoverable through pagination.',
  'Google may reorder rows with tied click counts between requests.',
];

function requestBody(args, startRow, rowLimit) {
  return { startDate: args.startDate, endDate: args.endDate, dimensions: args.dimensions,
    type: args.searchType, dataState: args.dataState, aggregationType: args.aggregationType,
    rowLimit, startRow,
    ...(args.filters.length ? { dimensionFilterGroups: [{ groupType: 'and', filters: args.filters }] } : {}) };
}

function reasonFor(error, signal) {
  return signal?.aborted || error?.name === 'AbortError' ? 'SC_ABORTED' : safeErrorCode(error);
}

export function createSearchConsoleProvider({ session, now = () => new Date() } = {}) {
  if (!session || typeof session.request !== 'function') fail('SC_SESSION_INVALID');
  if (typeof now !== 'function') fail('SC_CLOCK_INVALID');
  const clock = () => {
    const date = now();
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) fail('SC_CLOCK_INVALID');
    return date;
  };

  async function listSites({ signal } = {}) {
    try {
      const data = await requestWithSignal(session, SITES_ENDPOINT, { method: 'GET', signal });
      requireSignal(signal); responseBytes(data);
      if (data.siteEntry !== undefined && !Array.isArray(data.siteEntry)) fail('SC_SITE_LIST_INVALID');
      if ((data.siteEntry?.length ?? 0) > 10_000) fail('SC_SITE_LIST_INVALID');
      const seen = new Set();
      const sites = (data.siteEntry ?? []).map(site => {
        if (!site || typeof site !== 'object' || !PERMISSIONS.has(site.permissionLevel)) fail('SC_SITE_LIST_INVALID');
        const siteUrl = validateProperty(site.siteUrl);
        if (seen.has(siteUrl)) fail('SC_SITE_LIST_DUPLICATE');
        seen.add(siteUrl);
        return { siteUrl, permissionLevel: site.permissionLevel };
      }).sort((a, b) => a.siteUrl < b.siteUrl ? -1 : a.siteUrl > b.siteUrl ? 1 : 0);
      return { sites, fetchedAt: clock().toISOString() };
    } catch (error) { throw new OperatorError(reasonFor(error, signal)); }
  }

  async function query(input, { signal } = {}) {
    requireSignal(signal);
    const args = validateQuery(input, clock());
    const endpoint = `${SITES_ENDPOINT}/${encodeURIComponent(args.siteUrl)}/searchAnalytics/query`;
    const rows = [], seen = new Set(), reasons = new Set(), limitations = new Set(LIMITATIONS);
    const metadataPages = [];
    let requests = 0, bytes = 0, exhausted = false, responseAggregationType = null, metadata = null;
    while (rows.length < args.rowLimit) {
      if (requests >= MAX_REQUESTS) { reasons.add('SC_COLLECTION_REQUEST_LIMIT'); break; }
      const pageLimit = Math.min(PAGE_SIZE, args.rowLimit - rows.length);
      const startRow = args.startRow + rows.length;
      try {
        requireSignal(signal);
        requests++;
        const data = await requestWithSignal(session, endpoint, {
          method: 'POST', body: requestBody(args, startRow, pageLimit), signal,
        });
        requireSignal(signal);
        const page = parseQueryResponse(data, args, pageLimit);
        if (bytes + page.bytes > MAX_COLLECTION_BYTES) fail('SC_COLLECTION_BYTE_LIMIT');
        if (requests > 1 && page.responseAggregationType !== responseAggregationType) {
          fail('SC_PROVIDER_AGGREGATION_CHANGED');
        }
        responseAggregationType = page.responseAggregationType;
        bytes += page.bytes;
        if (page.metadata !== null) {
          metadataPages.push({ startRow, metadata: page.metadata });
          if (metadata !== null && JSON.stringify(metadata) !== JSON.stringify(page.metadata)) {
            limitations.add('Provider maturity metadata changed between pages; the earliest incomplete date is retained.');
          }
          metadata = mergeMetadata(metadata, page.metadata);
        }
        page.limitations.forEach(value => limitations.add(value));
        for (const row of page.rows) {
          const key = JSON.stringify(row.keys);
          if (seen.has(key)) reasons.add('SC_PROVIDER_DUPLICATE_KEYS');
          seen.add(key);
        }
        // Preserve duplicate rows as evidence. Partial state prevents silent completeness claims.
        rows.push(...page.rows);
        exhausted = page.rows.length < pageLimit;
        if (exhausted || reasons.size > 0) break;
      } catch (error) {
        const reason = reasonFor(error, signal);
        if (rows.length === 0) throw new OperatorError(reason);
        reasons.add(reason); break;
      }
    }
    const rowLimitReached = rows.length >= args.rowLimit;
    if (rowLimitReached && !exhausted) reasons.add('SC_COLLECTION_ROW_LIMIT');
    return {
      rows,
      collection: { state: reasons.size > 0 ? 'partial' : 'complete', requests,
        requestedRowLimit: args.rowLimit, requestedStartRow: args.startRow, returnedRows: rows.length,
        exhausted, rowLimitReached, continuationStartRow: exhausted ? null : args.startRow + rows.length,
        reasons: [...reasons] },
      source: { responseAggregationType, metadata, metadataPages, limitations: [...limitations] },
      fetchedAt: clock().toISOString(), request: args,
    };
  }

  return { listSites, query };
}
