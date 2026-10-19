import * as z from 'zod/v4';
import { operationError } from './errors.mjs';

function calendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(calendarDate, 'Use a real calendar date in YYYY-MM-DD format.')
  .describe('Inclusive Search Console reporting date in YYYY-MM-DD format. Omit dates for the default settled reporting window.');
const boundedString = (max) => z.string().min(1).max(max);
const property = boundedString(2048).describe('Exact Search Console property identity returned by list_sites.');
const window = { siteUrl: property, startDate: date.optional(), endDate: date.optional() };
const scope = {
  brand: z.enum(['branded', 'non_branded']).optional(),
  contentGroupId: boundedString(200).optional(),
  topicClusterId: boundedString(200).optional(),
};
const searchType = z.enum(['web', 'image', 'video', 'news']);
const dimension = z.enum(['date', 'query', 'page', 'country', 'device', 'searchAppearance']);
const page = { limit: z.int().min(1).max(1000).optional(), offset: z.int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional() };
const filters = z.array(z.strictObject({
  dimension: z.enum(['query', 'page', 'country', 'device']),
  expression: boundedString(4096),
  operator: z.enum(['contains', 'equals', 'notContains', 'notEquals', 'includingRegex', 'excludingRegex']).optional(),
})).max(25).optional();

function args(fields) {
  return z.strictObject(fields).refine(
    value => !value.startDate || !value.endDate || value.startDate <= value.endDate,
    { message: 'startDate must not be after endDate.', path: ['startDate'] },
  );
}

const discoveryNames = new Set(['get_account_info', 'get_filter_options', 'list_sites']);
function define(name, title, description, inputSchema) {
  const discovery = discoveryNames.has(name);
  return Object.freeze({ name, title,
    description: description + (discovery ? '' : ' Google access is read-only; this call writes a new local report snapshot.'),
    inputSchema,
    annotations: Object.freeze({ readOnlyHint: discovery, destructiveHint: false, idempotentHint: discovery, openWorldHint: true }),
  });
}

export const tools = Object.freeze([
  define('get_account_info', 'Connection information',
    'Verify the connected Google account and read its connection information. It does not report a vendor subscription or prove that every property is readable.', args({})),
  define('get_filter_options', 'Available report filters',
    'Read supported report filters for an accessible property. Unimplemented brand, content-group and topic-cluster selectors are refused explicitly.', args({ siteUrl: property })),
  define('get_page_performance', 'Daily page performance',
    'Read daily clicks, impressions, CTR percent and average position for one exact page URL. Missing days are not fabricated as zero.', args({ ...window, pageUrl: boundedString(4096) })),
  define('get_position_distribution', 'Ranking position bands',
    'Group observed queries or pages into average-position bands 1–3, >3–10, >10–20 and >20. Daily mode uses queries. Coverage describes provider omissions and scan limits.', args({
      ...window, dimension: z.enum(['query', 'page']).optional(), granularity: z.enum(['period', 'daily']).optional(),
      scanLimit: z.int().min(1).max(25000).optional(), searchType: searchType.optional(),
    })),
  define('get_query_performance', 'Daily query performance',
    'Read daily performance for one exact query, optionally on one exact page. CTR is a percentage; absent rows are not zero traffic.', args({
      ...window, query: boundedString(4096), pageUrl: boundedString(4096).optional(),
    })),
  define('get_site_summary', 'Property summary and comparison',
    'Read independent aggregate totals, daily performance and an equal-length prior period. CTR is a percentage; average position is weighted by impressions.', args({
      ...window, ...scope, days: z.int().min(1).max(180).optional(),
    })),
  define('list_sites', 'Accessible properties',
    'List the connected Google account\'s actual Search Console properties and permissions. Use the returned exact siteUrl in reporting tools.', args({})),
  define('query_countries', 'Performance by country',
    'Read country-level Search Console performance. Country values are provider alpha-3 codes. Use independent coverage totals for property totals.', args({ ...window, ...scope, ...page })),
  define('query_devices', 'Performance by device',
    'Read desktop, mobile and tablet Search Console performance. CTR is a percentage. Use independent coverage totals for property totals.', args({ ...window, ...scope })),
  define('query_search_analytics', 'Search Analytics query',
    'Read Google Search Analytics rows with dimensions and AND filters. Regex syntax is Google RE2. Paginate explicitly; observed query rows do not contain every query. CTR is a percentage.', args({
      ...window,
      dimensions: z.array(dimension).max(6).refine(values => new Set(values).size === values.length, 'Dimensions must be unique.')
        .meta({ uniqueItems: true }).optional(),
      filters, rowLimit: z.int().min(1).max(25000).optional(), startRow: z.int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
      searchType: z.enum(['web', 'image', 'video', 'news', 'discover', 'googleNews']).optional(),
    })),
  define('query_top_pages', 'Top landing pages',
    'Read landing pages ordered by clicks. CTR is a percentage. Report property totals from independent coverage, not by summing a partial page of rows.', args({
      ...window, ...scope, ...page, searchType: z.enum(['web', 'image', 'video', 'news', 'discover']).optional(),
    })),
  define('query_top_queries', 'Top search queries',
    'Read named queries ordered by clicks. CTR is a percentage; hidden-click share is a fraction. Query omissions and pagination are explicit.', args({
      ...window, ...scope, ...page, searchType: searchType.optional(),
    })),
]);

const byName = new Map(tools.map(tool => [tool.name, tool]));

export function parseToolArgs(name, input) {
  const tool = byName.get(name);
  if (!tool) throw operationError('UNKNOWN_TOOL');
  const parsed = tool.inputSchema.safeParse(input);
  if (!parsed.success) throw operationError('INVALID_ARGUMENT');
  return parsed.data;
}

export function describeTools() {
  return tools.map(({ inputSchema, ...tool }) => ({ ...tool, inputSchema: z.toJSONSchema(inputSchema, { io: 'input' }) }));
}
