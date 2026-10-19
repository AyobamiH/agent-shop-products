// Bounded transport adapted from scripts/google/http.mjs, with cancellation and narrower endpoints.
import { TOKEN_ENDPOINT, IDENTITY_ENDPOINT, authError } from './constants.mjs';

export function readOnlyEndpoint(value, method = 'GET') {
  let url;
  try { url = new URL(value); } catch { throw authError('GOOGLE_ENDPOINT_NOT_PERMITTED'); }
  const clean = url.protocol === 'https:' && !url.port && !url.username && !url.password && !url.hash && !url.search;
  const googleHost = ['www.googleapis.com', 'searchconsole.googleapis.com'].includes(url.hostname);
  const list = method === 'GET' && url.pathname === '/webmasters/v3/sites';
  const query = method === 'POST' && /^\/webmasters\/v3\/sites\/[^/]+\/searchAnalytics\/query$/.test(url.pathname);
  if (!clean || !googleHost || (!list && !query)) throw authError('GOOGLE_ENDPOINT_NOT_PERMITTED');
  return url;
}

export async function googleJson(value, options = {}, fetcher = fetch) {
  if (![TOKEN_ENDPOINT, IDENTITY_ENDPOINT].includes(value)) readOnlyEndpoint(value, options.method || 'GET');
  const timeout = AbortSignal.timeout(20000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  let response;
  try { response = await fetcher(value, { ...options, redirect: 'error', signal }); }
  catch { throw authError(options.signal?.aborted ? 'OPERATION_CANCELLED' : 'GOOGLE_TRANSPORT_UNAVAILABLE'); }
  if (!response.body) throw authError('GOOGLE_RESPONSE_EMPTY');
  const chunks = []; let bytes = 0;
  const reader = response.body.getReader();
  try {
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 2_000_000) { await reader.cancel(); throw authError('GOOGLE_RESPONSE_TOO_LARGE'); }
      chunks.push(Buffer.from(part.value));
    }
  } catch (error) {
    if (error.code === 'GOOGLE_RESPONSE_TOO_LARGE') throw error;
    throw authError(options.signal?.aborted ? 'OPERATION_CANCELLED' : 'GOOGLE_TRANSPORT_UNAVAILABLE');
  } finally { reader.releaseLock(); }
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw authError('GOOGLE_RESPONSE_NOT_JSON'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw authError('GOOGLE_RESPONSE_NOT_JSON');
  if (!response.ok) {
    if (data.error === 'invalid_grant') throw authError('GOOGLE_GRANT_EXPIRED_OR_REVOKED');
    if (data.error?.details?.some(detail => detail.reason === 'SERVICE_DISABLED')) throw authError('GOOGLE_API_DISABLED');
    if (response.status === 401) throw authError('GOOGLE_AUTHENTICATION_FAILED');
    if (response.status === 403) throw authError('GOOGLE_ACCESS_DENIED');
    if (response.status === 429) throw authError('GOOGLE_RATE_LIMITED');
    if (response.status >= 500) throw authError('GOOGLE_TEMPORARILY_UNAVAILABLE');
    throw authError('GOOGLE_REQUEST_REJECTED');
  }
  return data;
}
