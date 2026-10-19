import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { main } from '../src/cli.mjs';
import { parseToolArgs } from '../src/contracts.mjs';
import { publicError } from '../src/errors.mjs';

function harness(bootstrap = {}, service) {
  let output = '', errors = '';
  return { dependencies: { bootstrap, service, stdout: { write: text => { output += text; } }, stderr: { write: text => { errors += text; } } },
    output: () => output, errors: () => errors };
}

test('actual tools command works without credentials and returns strict schemas', () => {
  const run = spawnSync(process.execPath, [fileURLToPath(new URL('../bin/search-console-operator.mjs', import.meta.url)), 'tools'], { encoding: 'utf8', timeout: 10000 });
  assert.ifError(run.error);
  assert.equal(run.status, 0);
  assert.equal(run.stderr, '');
  const result = JSON.parse(run.stdout);
  assert.equal(result.tools.length, 12);
  assert.equal(result.tools.find(tool => tool.name === 'get_account_info').inputSchema.additionalProperties, false);
});

test('CLI validates before loading service and rejects unknown or duplicate flags', async () => {
  let created = 0;
  for (const argv of [
    ['call', 'not_implemented'], ['call', 'list_sites', '--args', '{'], ['call', 'list_sites', '--args', '{"extra":1}'],
    ['call', 'list_sites', '--args', '{}', '--args', '{}'], ['call', 'list_sites', '--state-dir', 'relative'],
    ['call', 'list_sites', '--unknown', 'x'], ['snapshots', '--limit', '101'], ['replay', '../outside'],
    ['tools', '--args', '{}'], ['status', 'extra'],
  ]) {
    const h = harness({ createDefaultService: async () => { created++; throw Error('not reached'); } });
    assert.equal(await main(argv, h.dependencies), 1, JSON.stringify(argv));
    assert.equal(h.output(), '');
    assert.ok(JSON.parse(h.errors()).error.code);
  }
  assert.equal(created, 0);
});

test('CLI forwards exactly the shared validated contract and explicit runtime selection', async () => {
  let receivedRuntime, receivedCall;
  const h = harness({ createDefaultService: async runtime => {
    receivedRuntime = runtime;
    return { callTool: async (...call) => { receivedCall = call; return { status: 'partial', retained: true }; } };
  } });
  const input = { siteUrl: 'sc-domain:example.com', limit: 4 };
  const exit = await main(['call', 'query_top_queries', '--args', JSON.stringify(input), '--state-dir', '/tmp/seo-state', '--owner-credentials-dir', '/tmp/explicit-owner'], h.dependencies);
  assert.equal(exit, 0);
  assert.deepEqual(receivedRuntime, { stateDir: '/tmp/seo-state', ownerCredentialsDir: '/tmp/explicit-owner' });
  assert.deepEqual(receivedCall.slice(0, 2), ['query_top_queries', parseToolArgs('query_top_queries', input)]);
  assert.equal(JSON.parse(h.output()).status, 'partial');
});

test('failed evidence exits nonzero and unexpected exception details never reach CLI output', async () => {
  const failed = harness({}, { callTool: async () => ({ status: 'failed', snapshot: { id: 'a'.repeat(64) } }) });
  assert.equal(await main(['call', 'list_sites'], failed.dependencies), 1);
  assert.equal(JSON.parse(failed.output()).snapshot.id, 'a'.repeat(64));
  const replay = harness({}, { replay: async () => ({ status: 'failed', snapshot: { id: 'a'.repeat(64) } }) });
  assert.equal(await main(['replay', 'a'.repeat(64)], replay.dependencies), 1);
  const error = harness({}, { callTool: async () => { throw Object.assign(new Error('synthetic-secret-value'), { code: 'SYNTHETIC_SECRET_CODE' }); } });
  assert.equal(await main(['call', 'list_sites'], error.dependencies), 1);
  assert.equal(JSON.parse(error.errors()).error.code, 'INTERNAL_ERROR');
  assert.doesNotMatch(error.errors(), /synthetic-secret|SYNTHETIC_SECRET_CODE/);
});

test('status, snapshots and replay have independent offline routes', async () => {
  const invoked = [];
  const bootstrap = { getStatus: async runtime => { invoked.push(['status', runtime]); return { liveAccess: 'not_checked' }; } };
  const service = { listSnapshots: async args => { invoked.push(['snapshots', args]); return []; },
    replay: async id => { invoked.push(['replay', id]); return { status: 'complete', fromSnapshot: true }; } };
  for (const argv of [['status'], ['snapshots'], ['replay', 'a'.repeat(64)]]) {
    const h = harness(bootstrap, service);
    assert.equal(await main(argv, h.dependencies), 0);
  }
  assert.deepEqual(invoked, [['status', {}], ['snapshots', { limit: 20 }], ['replay', 'a'.repeat(64)]]);
});

test('auth rejects a legacy adapter and completes the explicit new-grant lifecycle', async () => {
  let requested, closes = 0;
  const bootstrap = { runAuth: async options => {
    requested = options;
    return { connectUrl: 'http://127.0.0.1:8775/connect/synthetic', expiresAt: '2026-10-19T15:00:00Z', requestedScopes: ['openid'],
      done: Promise.resolve({ status: 'connected', warning: 'GOOGLE_AUTHORIZATION_STATUS_UNAVAILABLE' }), close: async () => { closes++; } };
  } };
  const blocked = harness(bootstrap);
  const args = ['auth', '--client-file', '/tmp/synthetic-client.json', '--expected-email', 'synthetic@example.invalid'];
  assert.equal(await main([...args, '--owner-credentials-dir', '/tmp/legacy'], blocked.dependencies), 1);
  assert.equal(requested, undefined);
  const h = harness(bootstrap), signals = new EventEmitter();
  assert.equal(await main([...args, '--state-dir', '/tmp/new-state'], { ...h.dependencies, signals }), 0);
  assert.deepEqual(requested, { stateDir: '/tmp/new-state', clientFile: '/tmp/synthetic-client.json', expectedEmail: 'synthetic@example.invalid', port: 8775 });
  const lines = h.output().trim().split('\n').map(line => JSON.parse(line));
  assert.equal(lines[0].status, 'awaiting_google_consent');
  assert.equal(lines[1].status, 'connected');
  assert.equal(lines[1].warning.code, 'GOOGLE_AUTHORIZATION_STATUS_UNAVAILABLE');
  assert.equal(signals.listenerCount('SIGINT'), 0);
  assert.equal(signals.listenerCount('SIGTERM'), 0);
  assert.equal(closes, 1);
});

test('public errors retain only approved codes and static recovery details', () => {
  const known = publicError({ code: 'GOOGLE_RATE_LIMITED', message: 'synthetic-secret', retryable: false });
  assert.equal(known.code, 'GOOGLE_RATE_LIMITED');
  assert.equal(known.retryable, true);
  assert.doesNotMatch(known.message, /synthetic/);
  assert.equal(publicError({ code: '__proto__' }).code, 'INTERNAL_ERROR');
  assert.equal(publicError(new Error('GOOGLE_RATE_LIMITED')).code, 'INTERNAL_ERROR');
  assert.equal(publicError({ get code() { throw new Error('synthetic-secret-accessor'); } }).code, 'INTERNAL_ERROR');
});
