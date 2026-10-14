import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, chmodSync, statSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { SCOPES, SHOP_ORIGIN, requireScopes } from './google/constants.mjs';
import { desktopClient, authorization, callbackCode, exchangeGrant } from './google/oauth.mjs';
import { privateRead, privateWrite, privateDirectory, acquireLock } from './google/private-store.mjs';
import { approvedGoogleUrl, googleJson, safeError } from './google/http.mjs';
import { inventory, exactShopStreams } from './google/inventory.mjs';
import { paged } from './google/session.mjs';
import { dateWindow, searchQuery, analyticsReport, inspectUrl } from './google/reports.mjs';
// All credentials below are synthetic unit-test values. No Google request is made.
const client = { clientId: '123-ownerfixture.apps.googleusercontent.com', clientSecret: 'unit-test-only', projectId: 'owner-fixture-project' };
const email = 'owner@example.invalid';
const fixtureBody = { installed: { client_id: client.clientId, client_secret: client.clientSecret,
  project_id: client.projectId, auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token', redirect_uris: ['http://localhost'] } };
function directory(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'agent-shop-google-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true })); return root;
}
const response = data => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });

test('requested access excludes the existing document and publishing permissions', () => {
  assert.equal(requireScopes(SCOPES).length, 5);
  assert.ok(SCOPES.includes('https://www.googleapis.com/auth/analytics.edit'));
  assert.ok(SCOPES.includes('https://www.googleapis.com/auth/webmasters.readonly'));
  assert.ok(SCOPES.every(s => !/(drive|documents|gmail|cloud-platform)/.test(s)));
  assert.throws(() => requireScopes(SCOPES.slice(1)), /SCOPES_NOT_GRANTED/);
});
test('desktop registration shape is validated without changing it', t => {
  const file = path.join(directory(t), 'client.json');
  writeFileSync(file, JSON.stringify(fixtureBody), { mode: 0o600 });
  assert.deepEqual(desktopClient(file), client);
  writeFileSync(file, JSON.stringify({ web: fixtureBody.installed }));
  assert.throws(() => desktopClient(file), /DESKTOP_OAUTH_CLIENT/);
});
test('authorization binds a fresh state and S256 challenge without disclosing the verifier', () => {
  const redirect = 'http://127.0.0.1:8774/oauth2/callback';
  const a = authorization(client, redirect, email), b = authorization(client, redirect, email);
  const url = new URL(a.url);
  assert.equal(url.origin, 'https://accounts.google.com');
  assert.equal(url.searchParams.get('redirect_uri'), redirect);
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('code_challenge'), createHash('sha256').update(a.verifier).digest('base64url'));
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('include_granted_scopes'), 'false');
  assert.ok(!a.url.includes(a.verifier)); assert.ok(!a.url.includes(client.clientSecret));
  assert.notEqual(a.state, b.state);
});
test('callback requires matching state and exactly one authorization code', () => {
  const base = 'http://127.0.0.1:8774/oauth2/callback';
  assert.equal(callbackCode(new URL(base + '?state=matching&code=fixture'), 'matching'), 'fixture');
  for (const query of ['state=other&code=x', 'state=matching&state=matching&code=x', 'state=matching', 'state=matching&code=a&code=b', 'state=matching&error=access_denied']) {
    assert.throws(() => callbackCode(new URL(base + '?' + query), 'matching'));
  }
});
test('exchange verifies the owner identity and saves offline authority, not the access token', async () => {
  const calls = [];
  const fake = async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1 ? response({ scope: SCOPES.join(' '), token_type: 'Bearer', access_token: 'unit-access', refresh_token: 'unit-refresh' })
      : response({ sub: 'unit-subject', email, email_verified: true });
  };
  const saved = await exchangeGrant({ client, code: 'unit-code', verifier: 'unit-verifier', redirectUri: 'http://127.0.0.1:8774/oauth2/callback', expectedEmail: email }, fake);
  assert.equal(saved.refresh_token, 'unit-refresh'); assert.equal(saved.subject, 'unit-subject');
  assert.equal(saved.access_token, undefined); assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[0].options.body.get('code_verifier'), 'unit-verifier');
  assert.equal(calls[1].url, 'https://openidconnect.googleapis.com/v1/userinfo');
});
test('partial grants or a different account are rejected', async () => {
  for (const wrongOwner of [false, true]) {
    let count = 0;
    const fake = async () => ++count === 1 ? response({ scope: wrongOwner ? SCOPES.join(' ') : 'openid', token_type: 'Bearer', access_token: 'unit-access', refresh_token: 'unit-refresh' })
      : response({ sub: 'unit-other', email: 'other@example.invalid', email_verified: true });
    await assert.rejects(() => exchangeGrant({ client, code: 'unit-code', verifier: 'unit-verifier', redirectUri: 'http://127.0.0.1:8774/oauth2/callback', expectedEmail: email }, fake));
  }
});
test('saved credentials and reports are owner-only and filenames cannot escape the store', t => {
  const dir = path.join(directory(t), 'private'); privateDirectory(dir);
  privateWrite('report.json', { status: 'unit-test' }, dir);
  assert.deepEqual(privateRead(path.join(dir, 'report.json')), { status: 'unit-test' });
  assert.equal(statSync(path.join(dir, 'report.json')).mode & 0o777, 0o600);
  assert.equal(statSync(dir).mode & 0o777, 0o700);
  assert.throws(() => privateWrite('../outside.json', {}, dir), /FILENAME/);
  chmodSync(path.join(dir, 'report.json'), 0o644);
  assert.throws(() => privateRead(path.join(dir, 'report.json')), /PERMISSION/);
});
test('operation locks do not overwrite an already active operation', t => {
  const dir = path.join(directory(t), 'private'); const release = acquireLock('authorization', dir);
  assert.throws(() => acquireLock('authorization', dir), /ALREADY_LOCKED/); release();
  const second = acquireLock('authorization', dir); second();
  assert.equal(existsSync(path.join(dir, 'authorization.lock')), false);
});
test('transport restricts destinations and refuses oversized responses', async () => {
  for (const value of ['http://analyticsadmin.googleapis.com/v1beta/accounts', 'https://example.invalid/api', 'https://www.googleapis.com:444/api']) assert.throws(() => approvedGoogleUrl(value));
  await assert.rejects(() => googleJson('https://analyticsadmin.googleapis.com/v1beta/accounts', {}, async () => new Response('x'.repeat(2000001))), /TOO_LARGE/);
  assert.equal(safeError(Error('Unfiltered remote error text')), 'GOOGLE_OPERATION_FAILED');
});
test('search reports have a settled, bounded date window and exact Shop host filter', () => {
  const q = searchQuery('2026-09-14', '2026-10-11'); assert.equal(q.dataState, 'final');
  assert.equal(q.dimensionFilterGroups[0].filters[0].expression, '^https://agents\\.proofandstate\\.com/');
  for (const dates of [['2026-02-30', '2026-03-01'], ['2025-01-01', '2026-10-11'], ['2026-10-11', '2026-09-14']]) assert.throws(() => dateWindow(...dates));
});
test('one unavailable API does not turn independent Search Console access into zero traffic', async () => {
  const session = { cloudProject: 'unit-project', request: async url => {
    if (url.includes('analyticsadmin')) throw Error('GOOGLE_API_DISABLED');
    return { siteEntry: [{ siteUrl: 'sc-domain:proofandstate.com', permissionLevel: 'siteOwner' }] };
  } };
  const report = await inventory(session); assert.equal(report.analytics.status, 'unavailable');
  assert.equal(report.searchConsole.status, 'observed'); assert.throws(() => exactShopStreams(report), /NOT_OBSERVED/);
});
test('stream selection does not substitute an unrelated brand', () => {
  const report = { analytics: { status: 'observed', properties: [{ account: 'accounts/1', property: 'properties/2', streams: [
    { type: 'WEB_DATA_STREAM', defaultUri: 'https://example.invalid/' }, { type: 'WEB_DATA_STREAM', defaultUri: SHOP_ORIGIN, name: 'properties/2/dataStreams/3' },
  ] }] } };
  assert.equal(exactShopStreams(report).length, 1);
});
test('Analytics reporting verifies stream ownership before querying activity', async () => {
  let calls = 0; const session = { request: async () => { calls++; return { name: 'properties/1/dataStreams/2', type: 'WEB_DATA_STREAM', webStreamData: { defaultUri: 'https://example.invalid/' } }; } };
  await assert.rejects(() => analyticsReport(session, 'properties/1', '2', '2026-09-14', '2026-10-11'), /MISMATCH/);
  assert.equal(calls, 1);
});
test('inspection excludes private and query-bearing URLs before calling Google', async () => {
  let calls = 0; const session = { request: async () => { calls++; return {}; } };
  for (const value of [SHOP_ORIGIN + '/private-kits/complete', SHOP_ORIGIN + '/api/v1/commerce/offers', SHOP_ORIGIN + '/solutions?private=1', 'https://example.invalid/']) await assert.rejects(() => inspectUrl(session, value));
  assert.equal(calls, 0);
});
test('pagination cannot silently loop over the same next-page token', async () => {
  await assert.rejects(() => paged({ request: async () => ({ items: [], nextPageToken: 'same' }) }, 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries', 'items'), /PAGINATION_REPEATED/);
});

test('real loopback callback rejects unmatched requests and releases the expired listener', async t => {
  const { createServer } = await import('node:net');
  const { serveAuthorization } = await import('./google/oauth.mjs');
  const root = directory(t), file = path.join(root, 'client.json'), dir = path.join(root, 'private');
  writeFileSync(file, JSON.stringify(fixtureBody), { mode: 0o600 });
  const finder = createServer();
  await new Promise(resolve => finder.listen(0, '127.0.0.1', resolve));
  const port = finder.address().port;
  await new Promise(resolve => finder.close(resolve));
  const flow = await serveAuthorization({ clientFile: file, expectedEmail: email, port, directory: dir, durationMs: 2000 });
  const redirect = await fetch(flow.connectUrl, { redirect: 'manual' });
  assert.equal(redirect.status, 302);
  assert.equal(new URL(redirect.headers.get('location')).origin, 'https://accounts.google.com');
  const rejected = await fetch('http://127.0.0.1:' + port + '/oauth2/callback?state=unmatched&code=unit-test');
  assert.equal(rejected.status, 400);
  assert.equal(existsSync(path.join(dir, 'credential.json')), false);
  assert.equal((await flow.done).status, 'expired');
  assert.equal(existsSync(path.join(dir, 'authorization.lock')), false);
});
test('API-disabled errors retain their bounded classification without provider message text', async () => {
  let failure;
  try {
    await googleJson('https://analyticsadmin.googleapis.com/v1beta/accounts', {}, async () =>
      new Response(JSON.stringify({ error: { message: 'Do not print this provider text', details: [{ reason: 'SERVICE_DISABLED' }] } }), { status: 403 }));
  } catch (error) { failure = safeError(error); }
  assert.equal(failure, 'GOOGLE_API_DISABLED_ANALYTICSADMIN_GOOGLEAPIS_COM');
});


test('ordinary reports exclude operator diagnostics and diagnostics require an explicit report choice',async()=>{
 const {realtimeReport,BUSINESS_EVENTS,DIAGNOSTIC_EVENT}=await import('./google/reports.mjs');
 const calls=[];const session={request:async(url,options={})=>{
  calls.push({url,options});
  if(url.endsWith('/dataStreams/2'))return{name:'properties/1/dataStreams/2',type:'WEB_DATA_STREAM',webStreamData:{defaultUri:SHOP_ORIGIN}};
  return{rows:[]};
 }};
 await analyticsReport(session,'properties/1','2','2026-09-14','2026-10-11');
 assert.deepEqual(calls.at(-1).options.body.dimensionFilter.andGroup.expressions.find(x=>x.filter.fieldName==='eventName').filter.inListFilter.values,BUSINESS_EVENTS);
 await realtimeReport(session,'properties/1','2');
 assert.deepEqual(calls.at(-1).options.body.metrics,[{name:'eventCount'}]);
 assert.deepEqual(calls.at(-1).options.body.dimensionFilter.andGroup.expressions[1].filter.inListFilter.values,BUSINESS_EVENTS);
 await realtimeReport(session,'properties/1','2',{diagnostic:true});
 assert.deepEqual(calls.at(-1).options.body.dimensionFilter.andGroup.expressions[1].filter.inListFilter.values,[DIAGNOSTIC_EVENT]);
});
