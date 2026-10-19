import os from 'node:os';
import path from 'node:path';

export const DEFAULT_STATE_DIR = path.join(os.homedir(), '.config', 'search-console-operator');
export const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
export const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
export const IDENTITY_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';
export const SCOPES = Object.freeze([
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/webmasters.readonly',
]);

export function authError(code) {
  return Object.assign(new Error(code), { code });
}

export function requireScopes(value, { allowExistingScopes = false } = {}) {
  const scopes = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/\s+/) : [];
  if (!SCOPES.every(scope => scopes.includes(scope))) throw authError('GOOGLE_REQUIRED_SCOPE_MISSING');
  if (!allowExistingScopes && scopes.some(scope => !SCOPES.includes(scope))) {
    throw authError('GOOGLE_SCOPE_TOO_BROAD');
  }
  return [...new Set(scopes)].sort();
}

export function validateCredential(value, options = {}) {
  const fields = ['client_id', 'client_secret', 'refresh_token', 'subject', 'email'];
  if (!value || value.schemaVersion !== 1 || value.type !== 'authorized_user' ||
      fields.some(field => typeof value[field] !== 'string' || !value[field] || value[field].length > 16384)) {
    throw authError('GOOGLE_CREDENTIAL_NOT_VERIFIED');
  }
  requireScopes(value.scopes, options);
  return value;
}
