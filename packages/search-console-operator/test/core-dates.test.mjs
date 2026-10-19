import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveWindow, pacificDate, shiftDate } from '../src/core/dates.mjs';

// All dates are deterministic synthetic examples; no account data is involved.
const now = new Date('2026-10-19T01:30:00.000Z');

test('default report uses Pacific calendar date and labels the three-day cutoff heuristic', () => {
  assert.equal(pacificDate(now), '2026-10-18');
  assert.deepEqual(resolveWindow({}, now), {
    startDate: '2026-09-18', endDate: '2026-10-15', days: 28,
    previous: { startDate: '2026-08-21', endDate: '2026-09-17' },
    timeZone: 'America/Los_Angeles',
    settlement: { requested: 'final', cutoff: 'heuristic', lagDays: 3 },
  });
});

test('explicit edges win; one edge resolves the other using the declared length', () => {
  const both = resolveWindow({ startDate: '2026-09-01', endDate: '2026-09-02', days: 90 }, now);
  assert.equal(both.days, 2);
  assert.deepEqual(both.settlement, { requested: 'final', cutoff: 'explicit_request', lagDays: null });
  assert.deepEqual(both.previous, { startDate: '2026-08-30', endDate: '2026-08-31' });
  assert.equal(resolveWindow({ startDate: '2026-09-01', days: 7 }, now).endDate, '2026-09-07');
  assert.equal(resolveWindow({ endDate: '2026-09-07', days: 7 }, now).startDate, '2026-09-01');
});

test('inclusive comparisons remain the same length across leap days and DST', () => {
  assert.equal(resolveWindow({ startDate: '2024-02-28', endDate: '2024-03-02' }, now).days, 4);
  const spring = resolveWindow({ startDate: '2026-03-07', endDate: '2026-03-10' }, now);
  assert.equal(spring.days, 4);
  assert.deepEqual(spring.previous, { startDate: '2026-03-03', endDate: '2026-03-06' });
  assert.equal(shiftDate('2024-03-01', -1), '2024-02-29');
});

test('impossible, reversed, excessive and Pacific-future ranges are rejected', () => {
  for (const input of [
    { startDate: '2026-02-30', endDate: '2026-03-01' },
    { startDate: '2026-09-02', endDate: '2026-09-01' },
    { startDate: '2026-01-01', endDate: '2026-10-01' },
    { startDate: '2026-10-19', endDate: '2026-10-19' },
    { endDate: null }, { days: 0 }, { days: 181 }, { days: '28' },
  ]) assert.throws(() => resolveWindow(input, now), error => typeof error.code === 'string');
  assert.throws(() => resolveWindow({}, new Date('invalid')), { code: 'SC_CLOCK_INVALID' });
});
