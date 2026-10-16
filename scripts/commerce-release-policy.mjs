import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

const requiredFacts = ['publicBusinessAddress', 'monitoredSupportEmail', 'taxTreatment',
  'liveMerchantProfile', 'buyerContractAndRecovery', 'retentionPolicy'];
const origin = 'https://agents.proofandstate.com';
const policyKeys = ['schemaVersion', 'mode', 'offerId', 'offerVersion', 'approval'];
const approvalKeys = ['offerId', 'version', 'stripeProductId', 'priceId', 'unitAmountPence', 'currency',
  'paymentModel', 'taxCode', 'termsVersion', 'licenceVersion', 'refundPolicyVersion', 'commercialDecisionId',
  'termsUrl', 'licenceUrl', 'refundUrl'];
const versions = ['termsVersion', 'licenceVersion', 'refundPolicyVersion'];
const urls = { termsUrl: '/legal/kit-terms', licenceUrl: '/legal/kit-licence', refundUrl: '/legal/kit-refunds' };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, keys) => object(value) && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort());
const read = file => JSON.parse(readFileSync(new URL('../' + file, import.meta.url), 'utf8'));
export function merchantFactBlockers(readiness) {
  if (!object(readiness) || readiness.schemaVersion !== 1 ||
      readiness.offerId !== 'private-production-agent-operating-kit' || !object(readiness.checks)) {
    return ['merchantReadinessSchema'];
  }
  return requiredFacts.filter(name => {
    const check = readiness.checks[name];
    if (!object(check) || check.status !== 'verified' || typeof check.evidence !== 'string') return true;
    try {
      const url = new URL(check.evidence);
      return url.protocol !== 'https:' || url.hostname !== 'github.com' || !!url.username || !!url.password ||
        !/^\/AyobamiH\/agent-shop-products\/(?:blob\/[a-f0-9]{40}\/docs\/|issues\/\d+)/.test(url.pathname);
    } catch { return true; }
  });
}
// Product usability/merchant readiness is independent of impressions, clicks,
// experiments, conversions and real-customer outcomes. None is an input here.
export function releaseExpectation(policy, readiness, catalogue) {
  if (!exactKeys(policy, policyKeys) || policy.schemaVersion !== 1 ||
      !['disabled', 'live'].includes(policy.mode)) throw Error('COMMERCE_RELEASE_POLICY_INVALID');
  const offer = catalogue?.offers?.find(o => o.id === policy.offerId && o.version === policy.offerVersion);
  if (!offer || policy.offerId !== 'private-production-agent-operating-kit' ||
      offer.introductoryUnitAmountPence !== 900 || offer.currency !== 'gbp') throw Error('COMMERCE_RELEASE_OFFER_MISMATCH');
  if (policy.mode === 'disabled') {
    if (policy.approval !== null) throw Error('DISABLED_RELEASE_APPROVAL_MUST_BE_NULL');
    return Object.freeze({ mode: 'disabled', offerId: offer.id, offerVersion: offer.version, approval: null });
  }
  const blockers = merchantFactBlockers(readiness);
  if (blockers.length) throw Error('LIVE_MERCHANT_FACTS_NOT_VERIFIED');
  const approval = policy.approval;
  if (!exactKeys(approval, approvalKeys) || approval.offerId !== offer.id || approval.version !== offer.version ||
      !/^prod_[A-Za-z0-9_]{8,100}$/.test(approval.stripeProductId ?? '') ||
      !/^price_[A-Za-z0-9]{8,100}$/.test(approval.priceId ?? '') ||
      approval.unitAmountPence !== offer.introductoryUnitAmountPence || approval.currency !== 'gbp' ||
      approval.paymentModel !== 'managed_payments' || approval.paymentModel !== offer.livePaymentModel ||
      approval.taxCode !== offer.liveTaxCode || offer.buyerType !== 'business_only' ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/.test(approval.commercialDecisionId ?? '') ||
      versions.some(key => !/^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/.test(approval[key] ?? '')) ||
      new Set(versions.map(key => approval[key])).size !== 1 ||
      Object.entries(urls).some(([key, path]) => approval[key] !== origin + path)) {
    throw Error('LIVE_RELEASE_APPROVAL_INVALID');
  }
  return Object.freeze({ mode: 'live', offerId: offer.id, offerVersion: offer.version,
    approval: Object.freeze({ ...approval }) });
}
export function loadReleaseExpectation() {
  return releaseExpectation(read('commerce/release-policy.json'), read('commerce/launch-readiness.json'), read('commerce/offers.json'));
}
function textBinding(bindings, name, optional = false) {
  const matches = bindings.filter(binding => binding.name === name);
  if (!matches.length && optional) return undefined;
  if (matches.length !== 1 || matches[0].type !== 'plain_text') throw Error('COMMERCE_RELEASE_BINDING_UNREADABLE_' + name);
  const binding = matches[0];
  if (binding.text !== undefined && binding.value !== undefined && binding.text !== binding.value) throw Error('COMMERCE_RELEASE_BINDING_CONFLICT_' + name);
  const value = binding.text ?? binding.value;
  if (typeof value !== 'string') throw Error('COMMERCE_RELEASE_BINDING_UNREADABLE_' + name);
  return value;
}
export function verifyCommerceBindings(bindings, expected) {
  if (!Array.isArray(bindings)) throw Error('COMMERCE_RELEASE_BINDINGS_MISSING');
  if (expected.mode === 'disabled') {
    const flag = textBinding(bindings, 'COMMERCE_ENABLED', true);
    if (flag !== undefined && flag !== 'false') throw Error('UNAPPROVED_CHECKOUT_BINDING');
    return;
  }
  if (textBinding(bindings, 'COMMERCE_ENABLED') !== 'true' ||
      textBinding(bindings, 'COMMERCE_MODE') !== 'live' ||
      textBinding(bindings, 'COMMERCE_LIVE_APPROVED') !== 'yes:' + expected.approval.commercialDecisionId) {
    throw Error('LIVE_COMMERCE_RELEASE_BINDING_MISMATCH');
  }
  let approval;
  try { approval = JSON.parse(textBinding(bindings, 'COMMERCE_OFFER_APPROVAL')); }
  catch { throw Error('LIVE_COMMERCE_OFFER_BINDING_INVALID'); }
  if (!isDeepStrictEqual(approval, expected.approval)) throw Error('LIVE_COMMERCE_OFFER_BINDING_MISMATCH');
  for (const name of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']) {
    const matches = bindings.filter(binding => binding.name === name);
    if (matches.length !== 1 || matches[0].type !== 'secret_text' ||
        matches[0].text !== undefined || matches[0].value !== undefined) throw Error('LIVE_COMMERCE_SECRET_BINDING_INVALID');
  }
}
export function safeOfferSummary(offer) {
  return Object.fromEntries(['id', 'version', 'mode', 'paymentModel', 'currency', 'unitAmountPence', ...versions, ...Object.keys(urls)]
    .filter(key => offer[key] !== undefined).map(key => [key, offer[key]]));
}
export function verifyPublicCommerce(commerce, expected) {
  if (!object(commerce) || commerce.schemaVersion !== 1 || !Array.isArray(commerce.offers) || commerce.offers.length !== 1) {
    throw Error('COMMERCE_PUBLIC_SCHEMA_MISMATCH');
  }
  const offer = commerce.offers[0];
  if (offer.id !== expected.offerId || offer.version !== expected.offerVersion || offer.currency !== 'gbp') throw Error('COMMERCE_PUBLIC_OFFER_MISMATCH');
  if (expected.mode === 'disabled') {
    if (commerce.commerceActive !== false || offer.availability !== 'planned' ||
        ['unitAmountPence', 'priceId', 'mode'].some(key => offer[key] !== undefined)) throw Error('COMMERCE_PUBLIC_CLOSED_MISMATCH');
  } else {
    const approved = expected.approval;
    if (commerce.commerceActive !== true || offer.availability !== 'purchase_available' || offer.mode !== 'live' ||
        offer.paymentModel !== 'managed_payments' || offer.paymentModel !== approved.paymentModel ||
        offer.unitAmountPence !== approved.unitAmountPence || offer.priceId !== undefined ||
        [...versions, ...Object.keys(urls)].some(key => offer[key] !== approved[key])) throw Error('COMMERCE_PUBLIC_LIVE_MISMATCH');
  }
  return { commerceActive: commerce.commerceActive, privateKitOffer: offer.availability, commerceOffer: safeOfferSummary(offer) };
}
export function matchesPublicAcceptance(result, expected) {
  if (result?.status !== 'PASS' || result.products !== 33 || result.externalCapabilities !== 990 || result.codingBugs !== 24) return false;
  if (expected.mode === 'disabled') return result.commerceActive === false && result.privateKitOffer === 'planned';
  try {
    verifyPublicCommerce({ schemaVersion: 1, commerceActive: result.commerceActive,
      offers: [{ ...result.commerceOffer, availability: result.privateKitOffer }] }, expected);
    return true;
  } catch { return false; }
}
export function releaseStatus() {
  const policy = read('commerce/release-policy.json');
  const readiness = read('commerce/launch-readiness.json');
  const expected = loadReleaseExpectation();
  return { scope: 'source_readiness_not_deployment_proof', selectedReleaseMode: expected.mode,
    liveCheckoutSourceReady: expected.mode === 'live', merchantFactBlockers: merchantFactBlockers(readiness),
    liveOfferApprovalPresent: policy.approval !== null,
    demandIsReleaseGate: false, firstCustomerIsReleaseGate: false,
    providerReadbackStillRequired: true, realMoneyTransactionPerformed: false };
}
