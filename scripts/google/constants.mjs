import os from 'node:os';
import path from 'node:path';
export const SHOP_ORIGIN = 'https://agents.proofandstate.com';
export const SHOP_HOST = 'agents.proofandstate.com';
export const GSC_PROPERTY = 'sc-domain:proofandstate.com';
export const PRIVATE_DIR = path.join(os.homedir(), '.config', 'agent-shop-google');
export const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
export const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
export const IDENTITY_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';
export const SCOPES = Object.freeze([
  'openid', 'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit',
  'https://www.googleapis.com/auth/webmasters.readonly',
]);
export function requireScopes(granted) {
  const set = new Set(Array.isArray(granted) ? granted : String(granted || '').split(' '));
  if (SCOPES.some(scope => !set.has(scope))) throw Error('GOOGLE_REQUIRED_SCOPES_NOT_GRANTED');
  return [...set].sort();
}
export function numericResource(value, kind) {
  if (!['accounts', 'properties'].includes(kind) ||
      !new RegExp('^' + kind + '/[0-9]+$').test(value || '')) throw Error('INVALID_GOOGLE_RESOURCE');
  return value;
}
