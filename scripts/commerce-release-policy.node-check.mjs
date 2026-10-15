import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { releaseExpectation, loadReleaseExpectation, merchantFactBlockers, verifyCommerceBindings,
  verifyPublicCommerce, matchesPublicAcceptance, releaseStatus } from './commerce-release-policy.mjs';
import { guardedPromote } from './guarded-promote.mjs';
const id = 'private-production-agent-operating-kit';
const catalogue = { offers: [{ id, version: '2026.10.1', introductoryUnitAmountPence: 900, currency: 'gbp' }] };
const names = ['publicBusinessAddress', 'monitoredSupportEmail', 'taxTreatment', 'liveMerchantProfile', 'buyerContractAndRecovery', 'retentionPolicy'];
// Synthetic release proof only. These URLs/values do not represent merchant acceptance.
const facts = { schemaVersion: 1, offerId: id, checks: Object.fromEntries(names.map(name => [name,
  { status: 'verified', evidence: 'https://github.com/AyobamiH/agent-shop-products/blob/' + 'a'.repeat(40) + '/docs/unit-fixture.md' }])) };
const approval = { offerId: id, version: '2026.10.1', priceId: 'price_TestFixtureOnly', unitAmountPence: 900, currency: 'gbp',
  termsVersion: '2026-10-12.2', licenceVersion: '2026-10-12.2', refundPolicyVersion: '2026-10-12.2',
  commercialDecisionId: 'UNIT-ONLY', termsUrl: 'https://agents.proofandstate.com/legal/kit-terms',
  licenceUrl: 'https://agents.proofandstate.com/legal/kit-licence', refundUrl: 'https://agents.proofandstate.com/legal/kit-refunds' };
const policy = { schemaVersion: 1, mode: 'live', offerId: id, offerVersion: '2026.10.1', approval };
const live = () => releaseExpectation(policy, facts, catalogue);
const bindings = [
  ...Object.entries({ COMMERCE_ENABLED: 'true', COMMERCE_MODE: 'live', COMMERCE_LIVE_APPROVED: 'yes:UNIT-ONLY',
    COMMERCE_OFFER_APPROVAL: JSON.stringify(approval) }).map(([name, text]) => ({ name, type: 'plain_text', text })),
  { name: 'STRIPE_SECRET_KEY', type: 'secret_text' }, { name: 'STRIPE_WEBHOOK_SECRET', type: 'secret_text' },
];
const publicOffer = { id, version: '2026.10.1', mode: 'live', availability: 'purchase_available', currency: 'gbp', unitAmountPence: 900,
  ...Object.fromEntries(['termsVersion', 'licenceVersion', 'refundPolicyVersion', 'termsUrl', 'licenceUrl', 'refundUrl'].map(key => [key, approval[key]])) };
const remote = { schemaVersion: 1, commerceActive: true, offers: [publicOffer] };
test('default policy stays closed for factual blockers, not demand', () => {
  assert.equal(loadReleaseExpectation().mode, 'disabled');
  const status = releaseStatus();
  assert.equal(status.demandIsReleaseGate, false); assert.equal(status.firstCustomerIsReleaseGate, false);
  assert.ok(status.merchantFactBlockers.includes('taxTreatment'));
});
test('complete live release can be admitted before any traffic, enquiries or customer purchase', () => {
  const expectation = live();
  assert.equal(expectation.mode, 'live');
  assert.equal(merchantFactBlockers({ ...facts, clicks: 0, qualifiedEnquiries: 0, firstSale: null }).length, 0);
  verifyCommerceBindings(bindings, expectation);
  assert.equal(verifyPublicCommerce(remote, expectation).commerceActive, true);
});
test('each actual seller fact remains independently required', () => {
  for (const name of names) {
    const copy = structuredClone(facts); copy.checks[name].status = 'missing';
    assert.deepEqual(merchantFactBlockers(copy), [name]);
    assert.throws(() => releaseExpectation(policy, copy, catalogue), /FACTS_NOT_VERIFIED/);
    copy.checks[name] = { status: 'verified', evidence: 'https://unrelated.example/evidence' };
    assert.throws(() => releaseExpectation(policy, copy, catalogue));
  }
});
test('a boolean or environment-style bypass cannot enable the source policy', () => {
  for (const value of [true, { ...policy, mode: 'test' }, { ...policy, approval: null }, { ...policy, skipChecks: true }]) {
    assert.throws(() => releaseExpectation(value, facts, catalogue));
  }
});
test('live price, currency, legal URLs and versions must match the approved offer', () => {
  for (const patch of [{ unitAmountPence: 4900 }, { currency: 'usd' }, { priceId: 'arbitrary' },
    { termsUrl: 'https://other.example/terms' }, { termsVersion: 'mismatched' }, { unexpected: 'value' }]) {
    assert.throws(() => releaseExpectation({ ...policy, approval: { ...approval, ...patch } }, facts, catalogue));
  }
});
test('closed policy rejects true, ambiguous, duplicate or opaque enablement flags', () => {
  const closed = loadReleaseExpectation();
  verifyCommerceBindings([], closed);
  verifyCommerceBindings([{ name: 'COMMERCE_ENABLED', type: 'plain_text', text: 'false' }], closed);
  for (const bad of [bindings, [{ name: 'COMMERCE_ENABLED', type: 'secret_text' }],
    [{ name: 'COMMERCE_ENABLED', type: 'plain_text', text: 'false', value: 'true' }],
    [{ name: 'COMMERCE_ENABLED', type: 'plain_text', text: 'false' }, { name: 'COMMERCE_ENABLED', type: 'plain_text', text: 'false' }]]) {
    assert.throws(() => verifyCommerceBindings(bad, closed));
  }
});
test('live bindings require exact decision and offer plus secret-name presence without exposing keys', () => {
  for (const name of bindings.map(b => b.name)) assert.throws(() => verifyCommerceBindings(bindings.filter(b => b.name !== name), live()));
  assert.throws(() => verifyCommerceBindings(bindings.map(b => b.name === 'STRIPE_SECRET_KEY' ? { ...b, type: 'plain_text', text: 'synthetic-only' } : b), live()));
  assert.throws(() => verifyCommerceBindings(bindings.map(b => b.name === 'COMMERCE_MODE' ? { ...b, text: 'test' } : b), live()));
});
test('public readback rejects sandbox mode, hidden price changes and wrong policy versions', () => {
  for (const patch of [{ mode: 'test' }, { unitAmountPence: 4900 }, { currency: 'usd' },
    { refundPolicyVersion: 'old' }, { priceId: approval.priceId }, { version: 'wrong' }]) {
    assert.throws(() => verifyPublicCommerce({ ...remote, offers: [{ ...publicOffer, ...patch }] }, live()));
  }
  assert.throws(() => verifyPublicCommerce(remote, loadReleaseExpectation()));
});
test('public acceptance reports its actual selected mode rather than forcing disabled', () => {
  const result = { status: 'PASS', products: 33, externalCapabilities: 990, codingBugs: 24,
    ...verifyPublicCommerce(remote, live()) };
  assert.ok(matchesPublicAcceptance(result, live()));
  assert.ok(!matchesPublicAcceptance(result, loadReleaseExpectation()));
  assert.ok(!matchesPublicAcceptance({ ...result, status: 'FAIL' }, live()));
});
test('guarded promotion accepts the exact live contract with no sale and still verifies the provider deployment', async () => {
  const sha = 'a'.repeat(40), old = '11111111-1111-4111-8111-111111111111', next = '22222222-2222-4222-8222-222222222222';
  let active = old, deployment = 'before', writes = 0;
  const candidate = { annotations: { 'workers/tag': sha }, resources: { bindings: [
    { name: 'COMMERCE_DB', type: 'd1', id: 'f3fa2e0b-bb41-4c51-8b44-25f699baa39b' },
    { name: 'PRIVATE_KITS', type: 'r2_bucket', bucket_name: 'agent-shop-private-kits' },
    { name: 'COMMERCE_RATE_LIMITER', type: 'ratelimit' }, ...bindings] } };
  const fetcher = async (url, options) => {
    let result;
    if (url.endsWith('/versions/' + next)) result = candidate;
    else if (url.endsWith('/deployments') && options.method === 'POST') {
      writes++; active = JSON.parse(options.body).versions[0].version_id; deployment = 'ours';
      result = { id: deployment };
    } else result = { deployments: [{ id: deployment, versions: [{ version_id: active, percentage: 100 }] }] };
    return new Response(JSON.stringify({ success: true, result }), { headers: { 'content-type': 'application/json' } });
  };
  const proof = await guardedPromote({ sha, versionId: next, accountId: '6ddcbcb8474f1a7e460b2f0aabec0e2f',
    token: 'unit-fixture-not-real', fetcher, delay: async () => {}, commerceExpectation: live(),
    publicVerifier: async () => ({ status: 'PASS', products: 33, externalCapabilities: 990, codingBugs: 24,
      ...verifyPublicCommerce(remote, live()) }) });
  assert.equal(proof.status, 'PASS'); assert.equal(proof.publicAcceptance.commerceActive, true); assert.equal(writes, 1);
});
test('both rollout entry points and the outside-in verifier use the same policy', () => {
  for (const name of ['scripts/owner-local-release.mjs', '.github/workflows/deploy-agent-shop-cloudflare.yml', 'frontend/scripts/verify-deployed-surface.mjs']) {
    const source = readFileSync(new URL('../' + name, import.meta.url), 'utf8');
    assert.ok(source.includes('loadReleaseExpectation'));
    assert.ok(!source.includes('result.commerceActive !== false'));
  }
});
