import { publicError } from '../errors.mjs';

/** Errors contain bounded codes, never provider messages or request data. */
export class OperatorError extends Error {
  constructor(code) {
    super(code);
    this.name = 'OperatorError';
    this.code = code;
  }
}

export function fail(code) { throw new OperatorError(code); }

export function safeErrorCode(error, fallback = 'SC_PROVIDER_REQUEST_FAILED') {
  const safe = publicError(error);
  return safe.code === 'INTERNAL_ERROR' ? fallback : safe.code;
}

export function abortError() { return new OperatorError('SC_ABORTED'); }

export function requireSignal(signal) {
  if (signal !== undefined && (typeof signal?.aborted !== 'boolean'
      || typeof signal?.addEventListener !== 'function'
      || typeof signal?.removeEventListener !== 'function')) fail('SC_SIGNAL_INVALID');
  if (signal?.aborted) throw abortError();
}

/** Stop waiting on abort even when an injected adapter does not observe it. */
export async function requestWithSignal(session, endpoint, options) {
  const { signal } = options;
  requireSignal(signal);
  if (!signal) return session.request(endpoint, options);
  let listener;
  const aborted = new Promise((_, reject) => {
    listener = () => reject(abortError());
    signal.addEventListener('abort', listener, { once: true });
  });
  try {
    if (signal.aborted) throw abortError();
    return await Promise.race([session.request(endpoint, options), aborted]);
  } finally { signal.removeEventListener('abort', listener); }
}
