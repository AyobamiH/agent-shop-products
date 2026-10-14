import { createServer } from 'node:http';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { AUTH_ENDPOINT, TOKEN_ENDPOINT, IDENTITY_ENDPOINT, SCOPES, requireScopes } from './constants.mjs';
import { privateRead, privateWrite, acquireLock } from './private-store.mjs';
import { googleJson, safeError } from './http.mjs';

export function desktopClient(filename) {
  const data = privateRead(filename); const client = data.installed;
  if (!client || data.web || !/^[a-zA-Z0-9-]+\.apps\.googleusercontent\.com$/.test(client.client_id || '') ||
      typeof client.client_secret !== 'string' || !client.client_secret ||
      !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(client.project_id || '') ||
      client.token_uri !== TOKEN_ENDPOINT || !['https://accounts.google.com/o/oauth2/auth', AUTH_ENDPOINT].includes(client.auth_uri)) {
    throw Error('OWNER_DESKTOP_OAUTH_CLIENT_REQUIRED');
  }
  return { clientId: client.client_id, clientSecret: client.client_secret, projectId: client.project_id };
}
export function authorization(client, redirectUri, expectedEmail) {
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const url = new URL(AUTH_ENDPOINT);
  url.search = new URLSearchParams({ client_id: client.clientId, redirect_uri: redirectUri,
    response_type: 'code', scope: SCOPES.join(' '), state, code_challenge: challenge,
    code_challenge_method: 'S256', access_type: 'offline', prompt: 'consent',
    include_granted_scopes: 'false', login_hint: expectedEmail }).toString();
  return { state, verifier, url: url.href };
}
export function callbackCode(url, expectedState) {
  const params = url.searchParams;
  if (params.getAll('state').length !== 1) throw Error('OAUTH_STATE_INVALID');
  const value = Buffer.from(params.get('state') || ''); const expected = Buffer.from(expectedState);
  if (value.length !== expected.length || !timingSafeEqual(value, expected)) throw Error('OAUTH_STATE_INVALID');
  if (params.has('error')) throw Error('GOOGLE_CONSENT_DECLINED');
  if (params.getAll('code').length !== 1 || !params.get('code') || params.get('code').length > 4096) {
    throw Error('OAUTH_CODE_INVALID');
  }
  return params.get('code');
}
export async function exchangeGrant({ client, code, verifier, redirectUri, expectedEmail }, fetcher = fetch) {
  const token = await googleJson(TOKEN_ENDPOINT, { method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: client.clientId,
      client_secret: client.clientSecret, code, code_verifier: verifier, redirect_uri: redirectUri }) }, fetcher);
  const scopes = requireScopes(token.scope);
  if (token.token_type?.toLowerCase() !== 'bearer' || !token.access_token || !token.refresh_token) {
    throw Error('GOOGLE_OFFLINE_GRANT_MISSING');
  }
  const identity = await googleJson(IDENTITY_ENDPOINT,
    { headers: { Authorization: 'Bearer ' + token.access_token } }, fetcher);
  if (!identity.sub || identity.email_verified !== true || identity.email?.toLowerCase() !== expectedEmail.toLowerCase()) {
    throw Error('GOOGLE_OWNER_IDENTITY_MISMATCH');
  }
  return { schemaVersion: 1, type: 'authorized_user', client_id: client.clientId,
    client_secret: client.clientSecret, refresh_token: token.refresh_token, scopes,
    project_id: client.projectId, subject: identity.sub, email: identity.email,
    grantedAt: new Date().toISOString() };
}

export async function serveAuthorization({ clientFile, expectedEmail, port = 8774, directory,
  durationMs = 30 * 60 * 1000, onConnected = async () => {} }) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(expectedEmail || '') ||
      !Number.isInteger(port) || port < 1024 || port > 65535) throw Error('OAUTH_LOCAL_CONFIGURATION_INVALID');
  const client = desktopClient(clientFile);
  const unlock = acquireLock('authorization', directory);
  const host = '127.0.0.1:' + port; const base = 'http://' + host;
  const redirectUri = base + '/oauth2/callback';
  const grant = authorization(client, redirectUri, expectedEmail);
  const connectPath = '/connect/' + randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + durationMs).toISOString();
  let used = false, finished = false, timer;
  let complete;
  const done = new Promise(resolve => { complete = resolve; });
  const reply = (res, status, message) => {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'", 'X-Content-Type-Options': 'nosniff' });
    res.end(message);
  };
  const finish = async (status, error = null) => {
    if (finished) return; finished = true;
    clearTimeout(timer);
    privateWrite('authorization-status.json', { status, expiresAt, error, checkedAt: new Date().toISOString() }, directory);
    server.close(); server.closeIdleConnections(); unlock(); complete({ status, error });
  };
  const server = createServer({ maxHeaderSize: 8192 }, async (req, res) => {
    if (req.method !== 'GET' || req.headers.host !== host || (req.headers.origin && req.headers.origin !== base) ||
        !req.url || req.url.length > 8192) return reply(res, 400, 'Invalid local request.');
    const url = new URL(req.url, base);
    if (url.pathname === connectPath && !used && !finished) {
      res.writeHead(302, { Location: grant.url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); res.end(); return;
    }
    if (url.pathname !== '/oauth2/callback') return reply(res, 404, 'This local listener accepts only the current Google connection.');
    if (used || finished) return reply(res, 409, 'This authorisation has already been handled.');
    let code;
    try { code = callbackCode(url, grant.state); }
    catch (error) {
      reply(res, 400, 'Google authorisation was not accepted. Return to the owner console.');
      if (safeError(error) === 'GOOGLE_CONSENT_DECLINED') await finish('declined', safeError(error));
      return;
    }
    used = true;
    try {
      const credential = await exchangeGrant({ client, code, verifier: grant.verifier, redirectUri, expectedEmail });
      if (finished) throw Error('GOOGLE_AUTHORIZATION_EXPIRED');
      privateWrite('credential.json', credential, directory);
      reply(res, 200, 'Google access granted to your private Agent Shop operator. You can close this page. No website tracking, checkout or publishing credentials were changed.');
      await finish('connected');
      try { await onConnected(); } catch (error) { console.log(JSON.stringify({ status: 'connected_inventory_blocked', error: safeError(error) })); }
    } catch (error) { reply(res, 400, 'Connection was not saved. Return to the owner console for the bounded error.'); await finish('failed', safeError(error)); }
  });
  server.requestTimeout = 10000; server.headersTimeout = 10000; server.keepAliveTimeout = 1000;
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
    privateWrite('authorization-status.json', { status: 'awaiting_google_consent', expiresAt,
      connectUrl: base + connectPath, cloudProject: client.projectId, requestedScopes: SCOPES }, directory);
  } catch (error) { server.close(); unlock(); throw Error('GOOGLE_LOCAL_LISTENER_UNAVAILABLE'); }
  timer = setTimeout(() => { void finish('expired', 'GOOGLE_AUTHORIZATION_EXPIRED'); }, durationMs);
  return { connectUrl: base + connectPath, expiresAt, cloudProject: client.projectId, requestedScopes: SCOPES, done,
    close: () => finish('cancelled', 'GOOGLE_AUTHORIZATION_CANCELLED') };
}
