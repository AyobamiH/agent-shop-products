import test from 'node:test';
import assert from 'node:assert/strict';
import { sumMetrics, metricChange, positionBands } from '../src/core/metrics.mjs';

test('CTR uses total clicks divided by total impressions rather than the mean of row rates', () => {
  const metrics = sumMetrics([
    { clicks: 1, impressions: 10, ctr: 0.1, position: 2 },
    { clicks: 9, impressions: 990, ctr: 9 / 990, position: 10 },
  ]);
  assert.equal(metrics.ctr, 0.01);
  assert.equal(metrics.clicks, 10); assert.equal(metrics.impressions, 1000);
  assert.equal(sumMetrics([{ clicks: 0, impressions: 100, position: 2 },
    { clicks: 0, impressions: 900, position: 10 }]).position, 9.2);
});

test('undefined ratios and unknown ranked positions stay explicit', () => {
  assert.deepEqual(sumMetrics([]), { clicks: 0, impressions: 0, ctr: null, position: null });
  assert.equal(sumMetrics([{ clicks: 0, impressions: 5, position: null }]).position, null);
  assert.equal(sumMetrics([{ clicks: 0, impressions: 5, position: 3 },
    { clicks: 0, impressions: 5, position: null }]).position, null);
  assert.equal(sumMetrics([{ clicks: 2, impressions: 1, position: 1 }]).ctr, 2);
  assert.throws(() => sumMetrics([{ clicks: -1, impressions: 1, position: 1 }]), { code: 'SC_METRIC_INVALID' });
});

test('zero baseline is distinguishable from no data and ordinary percentage change', () => {
  assert.deepEqual(metricChange(5, 0), { current: 5, previous: 0, absolute: 5, percent: null, state: 'zero_baseline' });
  assert.deepEqual(metricChange(0, 0), { current: 0, previous: 0, absolute: 0, percent: null, state: 'zero_baseline' });
  assert.equal(metricChange(12, 8).percent, 50);
  assert.equal(metricChange(5, null).state, 'no_data');
  assert.throws(() => metricChange(Infinity, null), { code: 'SC_METRIC_INVALID' });
});

test('position buckets use disclosed fractional boundaries and retain unclassified rows', () => {
  const rows = [1, 3, 3.01, 10, 10.01, 20, 20.01, null].map(position => ({
    clicks: 1, impressions: 10, position,
  }));
  const result = positionBands(rows);
  assert.deepEqual(result.buckets.map(bucket => bucket.rows), [2, 2, 2, 1]);
  assert.deepEqual(result.buckets.map(bucket => bucket.bandOrder), [1, 2, 3, 4]);
  assert.equal(result.unclassifiedRows, 1); assert.equal(result.totals.rows, 8);
  assert.equal(result.buckets[0].clickShare, 0.25);
  assert.equal(result.buckets[0].ctr, 0.1);
  assert.equal(result.unclassified.impressions, 10);
});
