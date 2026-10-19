import { fail } from './errors.mjs';
import { isoDate } from './dates.mjs';

export const MAX_RESPONSE_BYTES = 2_000_000;
export const MAX_COLLECTION_BYTES = 32_000_000;

export function responseBytes(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('SC_RESPONSE_INVALID');
  let serialised;
  try { serialised = JSON.stringify(data); } catch { fail('SC_RESPONSE_INVALID'); }
  const bytes = Buffer.byteLength(serialised, 'utf8');
  if (bytes > MAX_RESPONSE_BYTES) fail('SC_RESPONSE_TOO_LARGE');
  return bytes;
}

function number(value, nullable = false) {
  if (nullable && (value === null || value === undefined)) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail('SC_RESPONSE_INVALID');
  return value;
}

export function parseQueryResponse(data, args, pageLimit) {
  const bytes = responseBytes(data);
  if (data.rows !== undefined && !Array.isArray(data.rows)) fail('SC_RESPONSE_INVALID');
  if ((data.rows?.length ?? 0) > pageLimit) fail('SC_RESPONSE_ROW_LIMIT_VIOLATION');
  const dateIndex = args.dimensions.indexOf('date');
  const limitations = new Set();
  const rows = (data.rows ?? []).map(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) fail('SC_RESPONSE_INVALID');
    const keys = row.keys === undefined && args.dimensions.length === 0 ? [] : row.keys;
    if (!Array.isArray(keys) || keys.length !== args.dimensions.length
        || keys.some(key => typeof key !== 'string')) fail('SC_RESPONSE_INVALID');
    if (dateIndex >= 0) {
      try { isoDate(keys[dateIndex]); } catch { fail('SC_RESPONSE_INVALID'); }
      if (keys[dateIndex] < args.startDate || keys[dateIndex] > args.endDate) fail('SC_RESPONSE_INVALID');
    }
    const result = { keys: [...keys], clicks: number(row.clicks), impressions: number(row.impressions),
      ctr: number(row.ctr, true), position: number(row.position, true) };
    if (result.ctr !== null && result.ctr > 1) limitations.add('Provider CTR exceeds one and is preserved without clipping.');
    if (result.ctr === null) limitations.add('The provider omitted CTR; raw rows preserve this as null.');
    if (result.clicks > result.impressions) limitations.add('Provider clicks exceed impressions and are preserved without clipping.');
    return result;
  });
  const responseAggregationType = data.responseAggregationType ?? null;
  if (responseAggregationType !== null && (typeof responseAggregationType !== 'string'
      || !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(responseAggregationType))) fail('SC_RESPONSE_INVALID');
  const metadata = data.metadata ?? null;
  if (metadata !== null) {
    if (typeof metadata !== 'object' || Array.isArray(metadata)) fail('SC_RESPONSE_INVALID');
    if (metadata.first_incomplete_date !== undefined) {
      try { isoDate(metadata.first_incomplete_date); } catch { fail('SC_RESPONSE_INVALID'); }
    }
  }
  return { bytes, rows, responseAggregationType, metadata, limitations: [...limitations] };
}

export function mergeMetadata(current, incoming) {
  if (incoming === null) return current;
  if (current === null) return { ...incoming };
  const merged = { ...current, ...incoming };
  if (current.first_incomplete_date && incoming.first_incomplete_date) {
    merged.first_incomplete_date = [current.first_incomplete_date, incoming.first_incomplete_date].sort()[0];
  }
  return merged;
}
