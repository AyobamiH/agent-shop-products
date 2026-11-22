import path from 'node:path';
import { PRIVATE_DIR, TOKEN_ENDPOINT, IDENTITY_ENDPOINT, requireScopes } from './constants.mjs';
import { privateRead, privateWrite, acquireLock } from './private-store.mjs';
import { approvedGoogleUrl, googleJson } from './http.mjs';

export async function googleSession(directory = PRIVATE_DIR, fetcher = fetch) {
  const unlock = acquireLock('refresh', directory);
  let credential, token;
  try {
    credential = privateRead(path.join(directory, 'credential.json'));
    if (credential.schemaVersion !== 1 || credential.type !== 'authorized_user' ||
        !credential.client_id || !credential.client_secret || !credential.refresh_token ||
        !credential.subject || !credential.email) throw Error('GOOGLE_CREDENTIAL_NOT_VERIFIED');
    requireScopes(credential.scopes);
    token = await googleJson(TOKEN_ENDPOINT, { method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', client_id: credential.client_id,
        client_secret: credential.client_secret, refresh_token: credential.refresh_token }) }, fetcher);
    if (!token.access_token || token.token_type?.toLowerCase() !== 'bearer' ||
        !Number.isFinite(token.expires_in) || token.expires_in <= 0) throw Error('GOOGLE_ACCESS_TOKEN_INVALID');
    if (token.scope) requireScopes(token.scope);
    const identity = await googleJson(IDENTITY_ENDPOINT,
      { headers: { Authorization: 'Bearer ' + token.access_token } }, fetcher);
    if (identity.sub !== credential.subject || identity.email !== credential.email || identity.email_verified !== true) {
      throw Error('GOOGLE_OWNER_IDENTITY_MISMATCH');
    }
    if (token.refresh_token && token.refresh_token !== credential.refresh_token) {
      credential.refresh_token = token.refresh_token;
      privateWrite('credential.json', credential, directory);
    }
  } finally { unlock(); }
  const deadline = Date.now() + token.expires_in * 1000 - 30000;
  return {
    cloudProject: credential.project_id,
    async request(endpoint, { method = 'GET', body } = {}) {
      const url = approvedGoogleUrl(endpoint);
      if (['oauth2.googleapis.com', 'openidconnect.googleapis.com'].includes(url.hostname)) {
        throw Error('GOOGLE_SESSION_ENDPOINT_RESTRICTED');
      }
      if (Date.now() >= deadline) throw Error('GOOGLE_SESSION_EXPIRED');
      if (!['GET', 'POST', 'PATCH'].includes(method)) throw Error('GOOGLE_METHOD_NOT_PERMITTED');
      return googleJson(url.href, { method,
        headers: { Authorization: 'Bearer ' + token.access_token, 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, fetcher);
    },
  };
}
export async function paged(session, endpoint, field) {
  const rows = []; const seen = new Set(); let pageToken = '';
  for (let page = 0; page < 50; page++) {
    const url = new URL(endpoint); url.searchParams.set('pageSize', '200');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const data = await session.request(url.href);
    if (data[field] !== undefined && !Array.isArray(data[field])) throw Error('GOOGLE_LIST_SHAPE_INVALID');
    rows.push(...(data[field] || []));
    if (!data.nextPageToken) return rows;
    pageToken = data.nextPageToken;
    if (seen.has(pageToken)) throw Error('GOOGLE_PAGINATION_REPEATED');
    seen.add(pageToken);
  }
  throw Error('GOOGLE_PAGINATION_LIMIT_REACHED');
}
