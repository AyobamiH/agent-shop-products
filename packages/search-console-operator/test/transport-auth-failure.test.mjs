import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, chmodSync, existsSync, statSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serveAuthorization } from '../src/auth/listener.mjs';
import { privateRead } from '../src/auth/private-store.mjs';
import { SCOPES, TOKEN_ENDPOINT, IDENTITY_ENDPOINT } from '../src/auth/constants.mjs';

test('a saved Google grant survives a failed status receipt without a second browser response', async t => {
  // Synthetic credentials and provider responses only; the browser connection stays on loopback.
  const root = mkdtempSync(path.join(os.tmpdir(), 'sc-status-receipt-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const directory = path.join(root, 'auth'), clientFile = path.join(root, 'client.json');
  writeFileSync(clientFile, JSON.stringify({ installed: {
    client_id: '123-synthetic.apps.googleusercontent.com', client_secret: 'synthetic-client-secret',
    project_id: 'synthetic-project', token_uri: TOKEN_ENDPOINT, auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  } }), { mode: 0o600 });
  const calls = [];
  const fetcher = async url => {
    calls.push(url);
    const data = url === TOKEN_ENDPOINT ? { token_type: 'Bearer', access_token: 'synthetic-access',
      refresh_token: 'synthetic-refresh', scope: SCOPES.join(' ') } :
      { sub: 'synthetic-subject', email: 'synthetic@example.invalid', email_verified: true };
    return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
  };
  const pending = await serveAuthorization({ clientFile, expectedEmail: 'synthetic@example.invalid',
    port: 0, directory, durationMs: 5000, fetcher });
  t.after(() => pending.close());
  const redirect = await fetch(pending.connectUrl, { redirect: 'manual' });
  assert.equal(redirect.status, 302);
  const google = new URL(redirect.headers.get('location'));
  const callback = new URL(google.searchParams.get('redirect_uri'));
  callback.search = new URLSearchParams({ state: google.searchParams.get('state'), code: 'synthetic-code' });
  // Fail the final status write after the listener successfully wrote its initial status.
  chmodSync(path.join(directory, 'authorization-status.json'), 0o644);
  const unhandled = [];
  const record = reason => { unhandled.push(reason); };
  process.on('unhandledRejection', record);
  t.after(() => process.removeListener('unhandledRejection', record));
  const response = await fetch(callback);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /read access is connected/);
  const outcome = await pending.done;
  assert.equal(outcome.status, 'connected');
  assert.equal(outcome.warning, 'GOOGLE_AUTHORIZATION_STATUS_UNAVAILABLE');
  assert.equal(outcome.error, null);
  const credentialFile = path.join(directory, 'credential.json');
  assert.equal(privateRead(credentialFile).refresh_token, 'synthetic-refresh');
  assert.equal(statSync(credentialFile).mode & 0o777, 0o600);
  assert.equal(existsSync(path.join(directory, 'authorization.lock')), false);
  assert.deepEqual(calls, [TOKEN_ENDPOINT, IDENTITY_ENDPOINT]);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(unhandled, []);
});
