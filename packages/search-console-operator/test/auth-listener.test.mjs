import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, rmSync, lstatSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serveAuthorization } from '../src/auth/listener.mjs';
import { privateRead } from '../src/auth/private-store.mjs';
import { AUTH_ENDPOINT, TOKEN_ENDPOINT, IDENTITY_ENDPOINT, SCOPES } from '../src/auth/constants.mjs';

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'search-console-auth-listener-test-'));
  const listeners = [];
  t.after(async () => {
    await Promise.allSettled(listeners.map(listener => listener.close()));
    rmSync(root, { recursive: true, force: true });
  });
  const clientFile = path.join(root, 'synthetic-client.json');
  writeFileSync(clientFile, JSON.stringify({ installed: {
    client_id: 'synthetic-client.apps.googleusercontent.com', client_secret: 'synthetic-client-secret',
    project_id: 'synthetic-test-project', token_uri: TOKEN_ENDPOINT, auth_uri: AUTH_ENDPOINT,
  } }), { mode: 0o600 });
  return { root, clientFile, directory: path.join(root, 'auth'), expectedEmail: 'owner@example.test',
    port: 0, durationMs: 10000, retain: listener => listeners.push(listener) };
}

function localRequest(connectUrl, { target, headers = {}, method = 'GET' } = {}) {
  const url = new URL(connectUrl);
  return new Promise((resolve, reject) => {
    const req = request({ hostname: url.hostname, port: url.port, path: target ?? url.pathname,
      method, agent: false, headers: { Host: url.host, ...headers }, timeout: 2000 }, res => {
      let body = '';
      res.setEncoding('utf8'); res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(Error('LOCAL_TEST_REQUEST_TIMED_OUT')));
    req.on('error', reject); req.end();
  });
}

test('malformed targets, hostile Host/Origin and forged state cannot consume the loopback grant', async t => {
  const options = fixture(t); let providerCalls = 0;
  const pending = await serveAuthorization({ ...options, fetcher: async () => {
    providerCalls++; throw Error('No provider request authorised by this test');
  } });
  options.retain(pending);
  const attempts = [{ target: '//[' }, { headers: { Host: 'attacker.example' } },
    { headers: { Origin: 'https://attacker.example' } }, { method: 'POST' },
    { target: '/oauth2/callback?code=synthetic&state=forged' }];
  for (const attempt of attempts) {
    const response = await localRequest(pending.connectUrl, attempt);
    assert.equal(response.status, 400);
    assert.equal(response.headers['cache-control'], 'no-store');
  }
  const usable = await localRequest(pending.connectUrl);
  assert.equal(usable.status, 302, 'malformed input must not kill the listener or consume its state');
  const auth = new URL(usable.headers.location);
  assert.equal(auth.origin + auth.pathname, AUTH_ENDPOINT);
  assert.equal(auth.searchParams.get('code_challenge_method'), 'S256');
  assert.deepEqual(auth.searchParams.get('scope').split(' '), [...SCOPES]);
  assert.equal(providerCalls, 0);
  assert.equal(existsSync(path.join(options.directory, 'credential.json')), false);
  await pending.close();
  assert.deepEqual(await pending.done, { status: 'cancelled', error: 'GOOGLE_AUTHORIZATION_CANCELLED' });
  assert.equal(existsSync(path.join(options.directory, 'authorization.lock')), false);
  assert.equal(privateRead(path.join(options.directory, 'authorization-status.json')).status, 'cancelled');
  await assert.rejects(localRequest(pending.connectUrl));
});

test('synthetic loopback exchange binds PKCE and owner identity before saving a private refresh grant', async t => {
  const options = fixture(t); const calls = []; let auth;
  const fetcher = async (url, init) => {
    calls.push(url);
    assert.equal(init.redirect, 'error');
    if (url === TOKEN_ENDPOINT) {
      assert.equal(init.method, 'POST');
      const fields = new URLSearchParams(init.body);
      assert.equal(fields.get('grant_type'), 'authorization_code');
      assert.equal(fields.get('code'), 'synthetic-authorisation-code');
      assert.equal(fields.get('redirect_uri'), auth.searchParams.get('redirect_uri'));
      assert.equal(createHash('sha256').update(fields.get('code_verifier')).digest('base64url'),
        auth.searchParams.get('code_challenge'));
      return Response.json({ token_type: 'Bearer', access_token: 'synthetic-access-token',
        refresh_token: 'synthetic-refresh-token', scope: SCOPES.join(' ') });
    }
    assert.equal(url, IDENTITY_ENDPOINT);
    assert.equal(init.headers.Authorization, 'Bearer synthetic-access-token');
    return Response.json({ sub: 'synthetic-owner-subject', email: options.expectedEmail, email_verified: true });
  };
  const pending = await serveAuthorization({ ...options, fetcher });
  options.retain(pending);
  auth = new URL((await localRequest(pending.connectUrl)).headers.location);
  const query = new URLSearchParams({ code: 'synthetic-authorisation-code', state: auth.searchParams.get('state') });
  const response = await localRequest(pending.connectUrl, { target: '/oauth2/callback?' + query });
  assert.equal(response.status, 200);
  assert.deepEqual(await pending.done, { status: 'connected', error: null });
  assert.deepEqual(calls, [TOKEN_ENDPOINT, IDENTITY_ENDPOINT]);
  const filename = path.join(options.directory, 'credential.json');
  const credential = privateRead(filename);
  assert.equal(credential.subject, 'synthetic-owner-subject');
  assert.equal(credential.email, options.expectedEmail);
  assert.equal(credential.refresh_token, 'synthetic-refresh-token');
  assert.equal(Object.hasOwn(credential, 'access_token'), false);
  assert.equal(Object.hasOwn(credential, 'code'), false);
  assert.equal(lstatSync(filename).mode & 0o777, 0o600);
  assert.equal(existsSync(path.join(options.directory, 'authorization.lock')), false);
  assert.equal(response.body.includes('synthetic-'), false, 'browser response must not contain secret fixtures');
});

test('credential/client FIFO is refused without blocking on an absent writer', t => {
  const { root } = fixture(t);
  const fifo = path.join(root, 'synthetic-fifo');
  const created = spawnSync('mkfifo', ['-m', '600', fifo], { encoding: 'utf8' });
  assert.ifError(created.error); assert.equal(created.status, 0, created.stderr);
  assert.throws(() => privateRead(fifo), { code: 'PRIVATE_FILE_PERMISSION_OR_SIZE_UNSAFE' });
});
