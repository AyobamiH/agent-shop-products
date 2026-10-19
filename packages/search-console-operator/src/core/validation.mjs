import { fail } from './errors.mjs';
import { validateDateRange } from './dates.mjs';

const DIMENSIONS = new Set(['date', 'query', 'page', 'country', 'device', 'searchAppearance']);
const FILTER_DIMENSIONS = new Set(['query', 'page', 'country', 'device', 'searchAppearance']);
const OPERATORS = new Set(['contains', 'equals', 'notContains', 'notEquals', 'includingRegex', 'excludingRegex']);
const SEARCH_TYPES = new Set(['web', 'image', 'video', 'news', 'discover', 'googleNews']);
const QUERY_FIELDS = new Set(['siteUrl', 'startDate', 'endDate', 'dimensions', 'filters',
  'searchType', 'dataState', 'aggregationType', 'rowLimit', 'startRow']);

export function validateProperty(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 2048
      || /[\u0000-\u0020\u007f]/.test(value)) fail('SC_PROPERTY_INVALID');
  if (value.startsWith('sc-domain:')) {
    const domain = value.slice(10);
    if (domain.length > 253 || !domain.split('.').every(label =>
      label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label))) {
      fail('SC_PROPERTY_INVALID');
    }
    return value;
  }
  let url;
  try { url = new URL(value); } catch { fail('SC_PROPERTY_INVALID'); }
  if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username
      || url.password || url.search || url.hash || value.includes('\\')) fail('SC_PROPERTY_INVALID');
  return value;
}

function enumeration(value, fallback, allowed, code) {
  const result = value === undefined ? fallback : value;
  if (!allowed.has(result)) fail(code);
  return result;
}

function boundedInteger(value, fallback, min, max, code) {
  const result = value === undefined ? fallback : value;
  if (!Number.isSafeInteger(result) || result < min || result > max) fail(code);
  return result;
}

export function validateQuery(args, now = new Date()) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) fail('SC_QUERY_INVALID');
  if (Object.keys(args).some(key => !QUERY_FIELDS.has(key))) fail('SC_QUERY_FIELD_UNSUPPORTED');
  const siteUrl = validateProperty(args.siteUrl);
  const { startDate, endDate } = validateDateRange(args.startDate, args.endDate, now);
  const dimensions = args.dimensions === undefined ? [] : args.dimensions;
  if (!Array.isArray(dimensions) || dimensions.length > DIMENSIONS.size
      || dimensions.some(d => !DIMENSIONS.has(d)) || new Set(dimensions).size !== dimensions.length) {
    fail('SC_DIMENSIONS_INVALID');
  }
  const filters = args.filters === undefined ? [] : args.filters;
  if (!Array.isArray(filters) || filters.length > 100) fail('SC_FILTERS_INVALID');
  const normalisedFilters = filters.map(filter => {
    if (!filter || typeof filter !== 'object' || Array.isArray(filter)
        || Object.keys(filter).some(k => !['dimension', 'operator', 'expression'].includes(k))
        || !FILTER_DIMENSIONS.has(filter.dimension) || typeof filter.expression !== 'string'
        || filter.expression.length > 4096 || filter.expression.includes('\0')) fail('SC_FILTER_INVALID');
    return {
      dimension: filter.dimension,
      operator: enumeration(filter.operator, 'equals', OPERATORS, 'SC_FILTER_OPERATOR_INVALID'),
      expression: filter.expression,
    };
  });
  const searchType = enumeration(args.searchType, 'web', SEARCH_TYPES, 'SC_SEARCH_TYPE_INVALID');
  const dataState = enumeration(args.dataState, 'final', new Set(['final', 'all']), 'SC_DATA_STATE_INVALID');
  const aggregationType = enumeration(args.aggregationType, 'auto',
    new Set(['auto', 'byPage', 'byProperty']), 'SC_AGGREGATION_INVALID');
  if (aggregationType === 'byProperty' && (dimensions.includes('page')
      || normalisedFilters.some(f => f.dimension === 'page')
      || ['discover', 'googleNews'].includes(searchType))) fail('SC_AGGREGATION_INVALID');
  const rowLimit = boundedInteger(args.rowLimit, 100, 1, 50_000, 'SC_ROW_LIMIT_INVALID');
  const startRow = boundedInteger(args.startRow, 0, 0, Number.MAX_SAFE_INTEGER - 50_000, 'SC_START_ROW_INVALID');
  return { siteUrl, startDate, endDate, dimensions: [...dimensions], filters: normalisedFilters,
    searchType, dataState, aggregationType, rowLimit, startRow };
}
