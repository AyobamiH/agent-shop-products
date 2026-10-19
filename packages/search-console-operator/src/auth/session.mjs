// Reuses the direct operator's refresh/identity binding; this adapter permits Search Console reads only.
import path from 'node:path';
import { TOKEN_ENDPOINT, IDENTITY_ENDPOINT, requireScopes, validateCredential, authError } from './constants.mjs';
import { privateDirectory, privateRead, privateWrite, acquireLock } from './private-store.mjs';
import { googleJson, readOnlyEndpoint } from './http.mjs';

export function createGoogleSession({ directory, allowExistingScopes = false, fetcher = fetch, now = Date.now }) {
  let token = null, deadline = 0, pending = null, account = null;
  async function refresh() {
    const unlock = acquireLock('refresh', directory);
    try {
      let stored;
      try { stored = privateRead(path.join(directory, 'credential.json')); }
      catch (error) {
        if (error.code === 'ENOENT') throw authError('CREDENTIALS_NOT_FOUND');
        throw error;
      }
      const credential = validateCredential(stored, { allowExistingScopes });
      const next = await googleJson(TOKEN_ENDPOINT, { method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'refresh_token', client_id: credential.client_id,
          client_secret: credential.client_secret, refresh_token: credential.refresh_token }) }, fetcher);
      if (typeof next.access_token !== 'string' || !next.access_token || next.token_type?.toLowerCase() !== 'bearer' ||
          !Number.isFinite(next.expires_in) || next.expires_in <= 30) throw authError('GOOGLE_ACCESS_TOKEN_INVALID');
      if (next.scope) requireScopes(next.scope, { allowExistingScopes });
      const identity = await googleJson(IDENTITY_ENDPOINT,
        { headers: { Authorization: 'Bearer ' + next.access_token } }, fetcher);
      if (identity.sub !== credential.subject || identity.email !== credential.email || identity.email_verified !== true) {
        throw authError('GOOGLE_OWNER_IDENTITY_MISMATCH');
      }
      if (next.refresh_token && next.refresh_token !== credential.refresh_token) {
        if (typeof next.refresh_token !== 'string') throw authError('GOOGLE_ACCESS_TOKEN_INVALID');
        privateWrite('credential.json', { ...credential, refresh_token: next.refresh_token }, directory);
      }
      account = { email: credential.email, cloudProject: credential.project_id || null,
        connection: 'verified', scopePolicy: allowExistingScopes ? 'existing_owner_grant_read_only_requests' : 'search_console_read_only' };
      token = next.access_token;
      deadline = now() + next.expires_in * 1000 - 30000;
    } finally { unlock(); }
  }
  async function ready() {
    if (token && now() < deadline) return;
    if (!pending) pending = refresh().finally(() => { pending = null; });
    await pending;
  }
  return {
    async account() { await ready(); return { ...account }; },
    async request(endpoint, { method = 'GET', body, signal } = {}) {
      readOnlyEndpoint(endpoint, method);
      if (signal?.aborted) throw authError('OPERATION_CANCELLED');
      await ready();
      if (signal?.aborted) throw authError('OPERATION_CANCELLED');
      try {
        return await googleJson(endpoint, { method, signal,
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, fetcher);
      } catch (error) {
        if (error.code === 'GOOGLE_AUTHENTICATION_FAILED') { token = null; deadline = 0; }
        throw error;
      }
    },
  };
}

export function credentialStatus(directory, { allowExistingScopes = false } = {}) {
  try {
    if (!privateDirectory(directory, { create: false })) return { connection: 'not_connected' };
    const value = validateCredential(privateRead(path.join(directory, 'credential.json')), { allowExistingScopes });
    return { connection: 'credential_present_not_live_verified', email: value.email,
      scopePolicy: allowExistingScopes ? 'existing_owner_grant_read_only_requests' : 'search_console_read_only',
      grantedAt: value.grantedAt || null };
  } catch (error) {
    if (error.code === 'ENOENT') return { connection: 'not_connected' };
    throw error;
  }
}
