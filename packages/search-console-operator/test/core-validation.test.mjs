import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProperty, validateQuery } from '../src/core/validation.mjs';

const now = new Date('2026-10-19T12:00:00Z');
const query = { siteUrl: 'sc-domain:example.invalid', startDate: '2026-09-01', endDate: '2026-09-28' };

test('property validation preserves exact domain and URL-prefix identity', () => {
  for (const property of ['sc-domain:example.invalid', 'https://example.invalid/blog/', 'http://example.invalid/']) {
    assert.equal(validateProperty(property), property);
  }
  for (const property of ['sc-domain:', 'sc-domain:foo..invalid', 'sc-domain:-foo.invalid',
    'https://user:pass@example.invalid/', 'https://example.invalid/?token=private',
    'ftp://example.invalid/', 'https://example.invalid/#fragment', 'https://example.invalid/\\other']) {
    assert.throws(() => validateProperty(property), { code: 'SC_PROPERTY_INVALID' });
  }
});

test('canonical query preserves ordered dimensions and exact AND filters', () => {
  const input = { ...query, dimensions: ['query', 'date'], filters: [
    { dimension: 'query', expression: 'Exact Case' },
    { dimension: 'page', operator: 'includingRegex', expression: '^https://example\\.invalid/blog/' },
  ] };
  const result = validateQuery(input, now);
  assert.deepEqual(result.dimensions, ['query', 'date']);
  assert.equal(result.filters[0].operator, 'equals');
  assert.equal(result.filters[0].expression, 'Exact Case');
  assert.equal(result.rowLimit, 100); assert.equal(result.startRow, 0);
  assert.equal(result.dataState, 'final'); assert.equal(result.aggregationType, 'auto');
  input.dimensions.push('page'); input.filters[0].expression = 'changed';
  assert.deepEqual(result.dimensions, ['query', 'date']);
  assert.equal(result.filters[0].expression, 'Exact Case');
});

test('illegal combinations and accidental unsupported scopes are refused at the boundary', () => {
  for (const extra of [
    { dimensions: ['query', 'query'] }, { dimensions: ['unknown'] }, { dimensions: null },
    { filters: null }, { filters: [{ dimension: 'query', expression: 'x', operator: 'OR' }] },
    { rowLimit: 0 }, { rowLimit: 50001 }, { rowLimit: 1.5 }, { startRow: -1 },
    { startRow: Number.MAX_SAFE_INTEGER }, { brand: 'branded' }, { dataState: null },
    { searchType: 'anything' }, { aggregationType: 'byProperty', dimensions: ['page'] },
    { aggregationType: 'byProperty', filters: [{ dimension: 'page', expression: 'x' }] },
    { aggregationType: 'byProperty', searchType: 'discover' },
  ]) assert.throws(() => validateQuery({ ...query, ...extra }, now), error => Boolean(error.code));
  assert.equal(validateQuery({ ...query, rowLimit: 50000 }, now).rowLimit, 50000);
});
