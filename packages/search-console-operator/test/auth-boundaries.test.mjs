import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SCOPES, TOKEN_ENDPOINT, IDENTITY_ENDPOINT, requireScopes } from '../src/auth/constants.mjs';
import { privateWrite, privateRead } from '../src/auth/private-store.mjs';
import { createGoogleSession, credentialStatus } from '../src/auth/session.mjs';
import { readOnlyEndpoint, googleJson } from '../src/auth/http.mjs';
import { authorization, callbackCode, exchangeGrant } from '../src/auth/oauth.mjs';

// Every credential, identity and transport response in this file is synthetic and test-only.
const siteEndpoint = 'https://www.googleapis.com/webmasters/v3/sites';
const identity = { sub: 'test-subject', email: 'operator@example.test', email_verified: true };
const credential = { schemaVersion: 1, type: 'authorized_user', client_id: 'synthetic.apps.googleusercontent.com',
  client_secret: 'TEST_ONLY_CLIENT_SECRET', refresh_token: 'TEST_ONLY_REFRESH_TOKEN', subject: identity.sub,
  email: identity.email, project_id: 'test-project', scopes: [...SCOPES], grantedAt: '2026-10-01T00:00:00.000Z' };
const token = { access_token: 'TEST_ONLY_ACCESS_TOKEN', token_type: 'Bearer', expires_in: 3600, scope: SCOPES.join(' ') };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

function temporary(t) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'sc-auth-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('read-only endpoint guard refuses provider writes, redirects and arbitrary credential recipients before fetch', async () => {
  assert.equal(readOnlyEndpoint(siteEndpoint).href, siteEndpoint);
  assert.ok(readOnlyEndpoint(siteEndpoint + '/sc-domain%3Aexample.test/searchAnalytics/query', 'POST'));
  const forbidden = [[siteEndpoint, 'POST'], [siteEndpoint + '/sc-domain%3Aexample.test', 'PUT'],
    [siteEndpoint + '/sc-domain%3Aexample.test/sitemaps', 'GET'], ['https://analyticsadmin.googleapis.com/v1beta/properties', 'GET'],
    ['https://attacker.example/webmasters/v3/sites', 'GET'], [siteEndpoint + '?access_token=secret', 'GET'],
    ['http://www.googleapis.com/webmasters/v3/sites', 'GET']];
  let requests = 0;
  for (const [url, method] of forbidden) await assert.rejects(
    googleJson(url, { method }, async () => { requests++; }), { code: 'GOOGLE_ENDPOINT_NOT_PERMITTED' });
  assert.equal(requests, 0);
});

test('new grants require the exact read scopes; broader owner grants need explicit adapter selection', () => {
  assert.deepEqual(requireScopes(SCOPES), [...SCOPES].sort());
  const broad = [...SCOPES, 'https://www.googleapis.com/auth/analytics.edit'];
  assert.throws(() => requireScopes(broad), { code: 'GOOGLE_SCOPE_TOO_BROAD' });
  assert.equal(requireScopes(broad, { allowExistingScopes: true }).length, 4);
  assert.throws(() => requireScopes(['openid']), { code: 'GOOGLE_REQUIRED_SCOPE_MISSING' });
});

test('status does not create a missing directory and a fresh API call reports missing credentials actionably', async t => {
  const root = temporary(t); const directory = path.join(root, 'auth');
  assert.deepEqual(credentialStatus(directory), { connection: 'not_connected' });
  assert.equal(existsSync(directory), false);
  let requests = 0;
  const session = createGoogleSession({ directory, fetcher: async () => { requests++; } });
  await assert.rejects(session.request(siteEndpoint), { code: 'CREDENTIALS_NOT_FOUND' });
  assert.equal(requests, 0);
});

test('PKCE/state are unique, callback is single-valued, and consent scopes contain no writes', () => {
  const client = { clientId: credential.client_id };
  const first = authorization(client, 'http://127.0.0.1:8775/oauth2/callback', identity.email);
  const second = authorization(client, 'http://127.0.0.1:8775/oauth2/callback', identity.email);
  assert.notEqual(first.state, second.state); assert.notEqual(first.verifier, second.verifier);
  const url = new URL(first.url);
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.deepEqual(url.searchParams.get('scope').split(' '), SCOPES);
  assert.equal(callbackCode(new URL('http://127.0.0.1/?state=' + first.state + '&code=test-code'), first.state), 'test-code');
  assert.throws(() => callbackCode(new URL('http://127.0.0.1/?state=wrong&code=x'), first.state), { code: 'OAUTH_STATE_INVALID' });
  assert.throws(() => callbackCode(new URL('http://127.0.0.1/?state=' + first.state + '&state=x&code=x'), first.state), { code: 'OAUTH_STATE_INVALID' });
  assert.throws(() => callbackCode(new URL('http://127.0.0.1/?state=' + first.state + '&error=access_denied'), first.state), { code: 'GOOGLE_CONSENT_DECLINED' });
});

test('one verified refresh serves concurrent reads and refreshes again on token expiry without leaking credentials', async t => {
  const directory = temporary(t); privateWrite('credential.json', credential, directory);
  let currentTime = 0, refreshes = 0; const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    if (url === TOKEN_ENDPOINT) { refreshes++; return json({ ...token, refresh_token: 'TEST_ONLY_ROTATED_TOKEN' }); }
    if (url === IDENTITY_ENDPOINT) return json(identity);
    return json({ siteEntry: [] });
  };
  const session = createGoogleSession({ directory, fetcher, now: () => currentTime });
  await Promise.all([session.request(siteEndpoint), session.request(siteEndpoint)]);
  assert.equal(refreshes, 1);
  assert.equal(privateRead(path.join(directory, 'credential.json')).refresh_token, 'TEST_ONLY_ROTATED_TOKEN');
  assert.equal(statSync(path.join(directory, 'credential.json')).mode & 0o777, 0o600);
  const account = await session.account();
  assert.equal(account.connection, 'verified'); assert.equal(account.email, identity.email);
  assert.doesNotMatch(JSON.stringify(account), /TOKEN|SECRET|client_secret|refresh_token/);
  currentTime = 3_600_000;
  await session.request(siteEndpoint); assert.equal(refreshes, 2);
  for (const call of calls) assert.equal(call.options.redirect, 'error');
  assert.equal(credentialStatus(directory).connection, 'credential_present_not_live_verified');
});

test('identity mismatch stops API use and does not overwrite the existing grant', async t => {
  const directory = temporary(t); privateWrite('credential.json', credential, directory);
  let apiReads = 0;
  const fetcher = async url => {
    if (url === TOKEN_ENDPOINT) return json({ ...token, refresh_token: 'UNTRUSTED_ROTATION' });
    if (url === IDENTITY_ENDPOINT) return json({ ...identity, sub: 'someone-else' });
    apiReads++; return json({});
  };
  const session = createGoogleSession({ directory, fetcher });
  await assert.rejects(session.request(siteEndpoint), { code: 'GOOGLE_OWNER_IDENTITY_MISMATCH' });
  assert.equal(apiReads, 0); assert.equal(privateRead(path.join(directory, 'credential.json')).refresh_token, credential.refresh_token);
});

test('HTTP error bodies remain private, revoked grants are actionable, cancellation is honoured', async () => {
  await assert.rejects(googleJson(TOKEN_ENDPOINT, {}, async () => json({ error: 'invalid_grant', description: 'PRIVATE_MARKER' }, 400)),
    error => error.code === 'GOOGLE_GRANT_EXPIRED_OR_REVOKED' && !error.message.includes('PRIVATE_MARKER'));
  await assert.rejects(googleJson(siteEndpoint, {}, async () => json({ error: { message: 'PRIVATE_MARKER' } }, 429)), { code: 'GOOGLE_RATE_LIMITED' });
  await assert.rejects(googleJson(siteEndpoint, { signal: AbortSignal.abort() }, async (_, options) => { options.signal.throwIfAborted(); }),
    { code: 'OPERATION_CANCELLED' });
  await assert.rejects(googleJson(siteEndpoint, {}, async () => new Response('x'.repeat(2_000_001))), { code: 'GOOGLE_RESPONSE_TOO_LARGE' });
});

test('fresh grant exchange binds the expected account and refuses missing offline consent', async () => {
  const request = { client: { clientId: credential.client_id, clientSecret: credential.client_secret, projectId: 'test-project' },
    code: 'TEST_ONLY_CODE', verifier: 'TEST_ONLY_VERIFIER', redirectUri: 'http://127.0.0.1:8775/oauth2/callback', expectedEmail: identity.email };
  const valid = await exchangeGrant(request, async url => json(url === TOKEN_ENDPOINT ? { ...token, refresh_token: credential.refresh_token } : identity));
  assert.equal(valid.email, identity.email); assert.deepEqual(valid.scopes, [...SCOPES].sort());
  await assert.rejects(exchangeGrant(request, async () => json(token)), { code: 'GOOGLE_OFFLINE_GRANT_MISSING' });
  await assert.rejects(exchangeGrant(request, async url => json(url === TOKEN_ENDPOINT ? { ...token, refresh_token: credential.refresh_token } :
    { ...identity, email: 'different@example.test' })), { code: 'GOOGLE_OWNER_IDENTITY_MISMATCH' });
});
