import { fail } from './errors.mjs';

export const SEARCH_CONSOLE_TIME_ZONE = 'America/Los_Angeles';
const DAY_MS = 86_400_000;
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SEARCH_CONSOLE_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});

export function isoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)
      || !Number.isFinite(Date.parse(value))
      || new Date(value).toISOString().slice(0, 10) !== value) fail('SC_DATE_INVALID');
  return value;
}

export function pacificDate(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) fail('SC_CLOCK_INVALID');
  const parts = Object.fromEntries(formatter.formatToParts(now).map(p => [p.type, p.value]));
  return isoDate(`${parts.year}-${parts.month}-${parts.day}`);
}

export function shiftDate(value, days) {
  isoDate(value);
  if (!Number.isSafeInteger(days)) fail('SC_DATE_SHIFT_INVALID');
  const shifted = new Date(Date.parse(value) + days * DAY_MS);
  if (!Number.isFinite(shifted.getTime())) fail('SC_DATE_INVALID');
  return isoDate(shifted.toISOString().slice(0, 10));
}

export function validateDateRange(startDate, endDate, now = new Date()) {
  isoDate(startDate); isoDate(endDate);
  const days = (Date.parse(endDate) - Date.parse(startDate)) / DAY_MS + 1;
  if (days < 1 || days > 180) fail('SC_WINDOW_INVALID');
  if (endDate > pacificDate(now)) fail('SC_WINDOW_IN_FUTURE');
  return { startDate, endDate, days };
}

/** Inclusive calendar dates: DST does not add or remove reporting days. */
export function resolveWindow(options = {}, now = new Date()) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('SC_WINDOW_INVALID');
  let { startDate, endDate } = options;
  const defaultDates = startDate === undefined && endDate === undefined;
  const requestedDays = options.days === undefined ? 28 : options.days;
  if (startDate !== undefined) isoDate(startDate);
  if (endDate !== undefined) isoDate(endDate);
  if (startDate === undefined || endDate === undefined) {
    if (!Number.isSafeInteger(requestedDays) || requestedDays < 1 || requestedDays > 180) {
      fail('SC_WINDOW_DAYS_INVALID');
    }
    if (startDate !== undefined) endDate = shiftDate(startDate, requestedDays - 1);
    else {
      endDate ??= shiftDate(pacificDate(now), -3);
      startDate = shiftDate(endDate, 1 - requestedDays);
    }
  }
  const range = validateDateRange(startDate, endDate, now);
  return {
    ...range,
    previous: { startDate: shiftDate(startDate, -range.days), endDate: shiftDate(startDate, -1) },
    timeZone: SEARCH_CONSOLE_TIME_ZONE,
    settlement: { requested: 'final', cutoff: defaultDates ? 'heuristic' : 'explicit_request',
      lagDays: defaultDates ? 3 : null },
  };
}
