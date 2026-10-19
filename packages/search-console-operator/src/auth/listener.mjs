import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { SCOPES, authError } from './constants.mjs';
import { privateWrite, acquireLock } from './private-store.mjs';
import { desktopClient, authorization, callbackCode, exchangeGrant } from './oauth.mjs';

export async function serveAuthorization({ clientFile, expectedEmail, port = 8775, directory,
  durationMs = 15 * 60 * 1000, fetcher = fetch }) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(expectedEmail || '') ||
      !Number.isInteger(port) || (port !== 0 && (port < 1024 || port > 65535)) ||
      !Number.isInteger(durationMs) || durationMs < 1 || durationMs > 30 * 60 * 1000) {
    throw authError('OAUTH_LOCAL_CONFIGURATION_INVALID');
  }
  const client = desktopClient(clientFile);
  const unlock = acquireLock('authorization', directory);
  let used = false, finished = false, timer, host, base, redirectUri, grant;
  const connectPath = '/connect/' + randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + durationMs).toISOString();
  let complete;
  const done = new Promise(resolve => { complete = resolve; });
  const reply = (res, status, message) => {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff' });
    res.end(message);
  };
  const finish = async (status, error = null) => {
    if (finished) return; finished = true; clearTimeout(timer);
    let warning;
    try {
      privateWrite('authorization-status.json', { status, expiresAt, error, checkedAt: new Date().toISOString() }, directory);
    } catch { warning = 'GOOGLE_AUTHORIZATION_STATUS_UNAVAILABLE'; }
    for (const cleanup of [() => server.close(), () => server.closeIdleConnections(), unlock]) {
      try { cleanup(); } catch { warning = 'GOOGLE_AUTHORIZATION_STATUS_UNAVAILABLE'; }
    }
    // A receipt or cleanup failure must not turn a saved grant into a second HTTP response.
    complete({ status, error, ...(warning ? { warning } : {}) });
  };
  const server = createServer({ maxHeaderSize: 8192 }, async (req, res) => {
    if (req.method !== 'GET' || req.headers.host !== host || (req.headers.origin && req.headers.origin !== base) ||
        !req.url || req.url.length > 8192 || !req.url.startsWith('/')) return reply(res, 400, 'Invalid local request.');
    let url;
    try { url = new URL(req.url, base); } catch { return reply(res, 400, 'Invalid local request.'); }
    if (url.origin !== base) return reply(res, 400, 'Invalid local request.');
    if (url.pathname === connectPath && !used && !finished) {
      res.writeHead(302, { Location: grant.url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
      res.end(); return;
    }
    if (url.pathname !== '/oauth2/callback') return reply(res, 404, 'This listener accepts the current Google connection only.');
    if (used || finished) return reply(res, 409, 'This authorisation has already been handled.');
    let code;
    try { code = callbackCode(url, grant.state); }
    catch (error) {
      reply(res, 400, 'Google authorisation was not accepted. Return to the operator terminal.');
      if (error.code === 'GOOGLE_CONSENT_DECLINED') await finish('declined', error.code);
      return;
    }
    used = true;
    try {
      const credential = await exchangeGrant({ client, code, verifier: grant.verifier, redirectUri, expectedEmail }, fetcher);
      if (finished) throw authError('GOOGLE_AUTHORIZATION_EXPIRED');
      privateWrite('credential.json', credential, directory);
      reply(res, 200, 'Search Console read access is connected. You can close this page.');
      await finish('connected');
    } catch {
      reply(res, 400, 'The connection could not be saved. Review the connection status in your terminal.');
      await finish('failed', 'GOOGLE_AUTHORIZATION_FAILED');
    }
  });
  server.requestTimeout = 10000; server.headersTimeout = 10000; server.keepAliveTimeout = 1000;
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
    host = '127.0.0.1:' + server.address().port; base = 'http://' + host; redirectUri = base + '/oauth2/callback';
    grant = authorization(client, redirectUri, expectedEmail);
    privateWrite('authorization-status.json', { status: 'awaiting_google_consent', expiresAt,
      requestedScopes: SCOPES }, directory);
  } catch { server.close(); unlock(); throw authError('GOOGLE_LOCAL_LISTENER_UNAVAILABLE'); }
  timer = setTimeout(() => { void finish('expired', 'GOOGLE_AUTHORIZATION_EXPIRED'); }, durationMs);
  return { connectUrl: base + connectPath, expiresAt, requestedScopes: [...SCOPES], done,
    close: () => finish('cancelled', 'GOOGLE_AUTHORIZATION_CANCELLED') };
}
