// Adapted from scripts/google/oauth.mjs; the independent package requests only its three read scopes.
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { AUTH_ENDPOINT, TOKEN_ENDPOINT, IDENTITY_ENDPOINT, SCOPES, requireScopes, authError } from './constants.mjs';
import { privateRead } from './private-store.mjs';
import { googleJson } from './http.mjs';

export function desktopClient(filename) {
  const data = privateRead(filename); const client = data.installed;
  if (!client || data.web || !/^[a-zA-Z0-9-]+\.apps\.googleusercontent\.com$/.test(client.client_id || '') ||
      typeof client.client_secret !== 'string' || !client.client_secret ||
      typeof client.project_id !== 'string' || !client.project_id || client.token_uri !== TOKEN_ENDPOINT ||
      !['https://accounts.google.com/o/oauth2/auth', AUTH_ENDPOINT].includes(client.auth_uri)) {
    throw authError('DESKTOP_OAUTH_CLIENT_REQUIRED');
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
  if (params.getAll('state').length !== 1) throw authError('OAUTH_STATE_INVALID');
  const value = Buffer.from(params.get('state') || ''); const expected = Buffer.from(expectedState);
  if (value.length !== expected.length || !timingSafeEqual(value, expected)) throw authError('OAUTH_STATE_INVALID');
  if (params.has('error')) throw authError('GOOGLE_CONSENT_DECLINED');
  if (params.getAll('code').length !== 1 || !params.get('code') || params.get('code').length > 4096) {
    throw authError('OAUTH_CODE_INVALID');
  }
  return params.get('code');
}

export async function exchangeGrant({ client, code, verifier, redirectUri, expectedEmail }, fetcher = fetch) {
  const token = await googleJson(TOKEN_ENDPOINT, { method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: client.clientId,
      client_secret: client.clientSecret, code, code_verifier: verifier, redirect_uri: redirectUri }) }, fetcher);
  const scopes = requireScopes(token.scope);
  if (token.token_type?.toLowerCase() !== 'bearer' || typeof token.access_token !== 'string' || !token.access_token ||
      typeof token.refresh_token !== 'string' || !token.refresh_token) throw authError('GOOGLE_OFFLINE_GRANT_MISSING');
  const identity = await googleJson(IDENTITY_ENDPOINT,
    { headers: { Authorization: 'Bearer ' + token.access_token } }, fetcher);
  if (typeof identity.sub !== 'string' || !identity.sub || identity.email_verified !== true ||
      typeof identity.email !== 'string' || identity.email.toLowerCase() !== expectedEmail.toLowerCase()) {
    throw authError('GOOGLE_OWNER_IDENTITY_MISMATCH');
  }
  return { schemaVersion: 1, type: 'authorized_user', client_id: client.clientId,
    client_secret: client.clientSecret, refresh_token: token.refresh_token, scopes,
    project_id: client.projectId, subject: identity.sub, email: identity.email,
    grantedAt: new Date().toISOString() };
}
