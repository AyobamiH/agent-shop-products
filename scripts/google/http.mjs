const HOSTS = new Set(['oauth2.googleapis.com', 'openidconnect.googleapis.com',
  'analyticsadmin.googleapis.com', 'analyticsdata.googleapis.com', 'www.googleapis.com', 'searchconsole.googleapis.com']);
export function approvedGoogleUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash || !HOSTS.has(url.hostname)) {
    throw Error('UNAPPROVED_GOOGLE_ENDPOINT');
  }
  return url;
}
export async function googleJson(value, options = {}, fetcher = fetch) {
  const url = approvedGoogleUrl(value);
  let response;
  try { response = await fetcher(url.href, { ...options, redirect: 'error', signal: AbortSignal.timeout(20000) }); }
  catch { throw Error('GOOGLE_TRANSPORT_UNAVAILABLE'); }
  const chunks = []; let bytes = 0;
  if (!response.body) throw Error('GOOGLE_RESPONSE_EMPTY');
  const reader = response.body.getReader();
  try {
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 2_000_000) { await reader.cancel(); throw Error('GOOGLE_RESPONSE_TOO_LARGE'); }
      chunks.push(Buffer.from(part.value));
    }
  } finally { reader.releaseLock(); }
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Error('GOOGLE_RESPONSE_NOT_JSON'); }
  if (!response.ok) {
    const disabled = data?.error?.details?.some(d => d.reason === 'SERVICE_DISABLED');
    if (disabled) throw Error('GOOGLE_API_DISABLED_' + url.hostname.replaceAll('.', '_').toUpperCase());
    if (data?.error === 'invalid_grant') throw Error('GOOGLE_GRANT_EXPIRED_OR_REVOKED');
    throw Error('GOOGLE_HTTP_' + response.status + '_' + url.hostname.replaceAll('.', '_').toUpperCase());
  }
  return data;
}
export function safeError(error) {
  const message = error instanceof Error ? error.message : '';
  return /^[A-Z][A-Z0-9_]{3,120}$/.test(message) ? message : 'GOOGLE_OPERATION_FAILED';
}
