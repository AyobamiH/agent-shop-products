import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareRequest } from './request.mjs';
const inventory = JSON.parse(readFileSync(new URL('../../catalog/capability-inventory.json', import.meta.url)));
const policy = JSON.parse(readFileSync(new URL('../../catalog/capability-acquisition.json', import.meta.url)));
const tool = inventory.tools.find((item) => !inventory.executionConstraints.some((rule) => rule.provider === item.provider && rule.state === 'excluded-from-execution'));
const input = { contactEmail: 'test@example.com', requestedOutcome: 'Inspect the integration prerequisites', targetRuntime: 'isolated review', capabilities: [{ kind: 'tool', name: tool.name }], acceptanceCriteria: ['Return a bounded feasibility report'] };
test('canonical tool can become bounded quote request', () => {
  const request = prepareRequest(input, inventory, policy);
  assert.deepEqual(request.allowedActions, ['inspect']);
  assert(request.blockedActions.includes('deploy'));
  assert.equal(request.price, undefined);
});
test('unknown tools, duplicate selections and supplied pricing rejected', () => {
  for (const change of [{ capabilities: [{ kind: 'tool', name: 'not-real' }] }, { capabilities: [input.capabilities[0], input.capabilities[0]] }, { amountMinor: 1 }]) {
    assert.throws(() => prepareRequest({ ...input, ...change }, inventory, policy));
  }
});
test('owner-excluded providers cannot be requested', () => {
  const excluded = inventory.tools.find((item) => inventory.executionConstraints.some((rule) => rule.provider === item.provider && rule.state === 'excluded-from-execution'));
  assert(excluded);
  assert.throws(() => prepareRequest({ ...input, capabilities: [{ kind: 'tool', name: excluded.name }] }, inventory, policy), /excluded/);
});
test('credential-bearing URLs and oversized UTF-8 requests rejected', () => {
  for (const repositoryUrl of ['http://example.com', 'https://user:password@example.com', 'https://example.com?token=secret']) assert.throws(() => prepareRequest({ ...input, repositoryUrl }, inventory, policy));
  assert.throws(() => prepareRequest({ ...input, requestedOutcome: '😀'.repeat(2000), acceptanceCriteria: Array(18).fill('😀'.repeat(200)) }, inventory, policy), /large/);
});
