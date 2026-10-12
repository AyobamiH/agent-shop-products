/** Prepare a provider-compatible request offline from canonical inventory metadata. */
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const text = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.length <= max;
const fields = new Set(['contactEmail', 'requestedOutcome', 'targetRuntime', 'capabilities', 'acceptanceCriteria', 'repositoryUrl', 'siteUrl']);

export function prepareRequest(input, inventory, policy) {
  assert(input && typeof input === 'object' && !Array.isArray(input), 'invalid_input');
  assert(Object.keys(input).every((key) => fields.has(key)), 'unknown_input_field');
  assert(text(input.contactEmail, 3, 255) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail), 'invalid_contact_email');
  assert(text(input.requestedOutcome, 10, 4000) && text(input.targetRuntime, 2, 150), 'invalid_outcome_or_runtime');
  assert(Array.isArray(input.acceptanceCriteria) && input.acceptanceCriteria.length > 0
    && input.acceptanceCriteria.length <= 18 && input.acceptanceCriteria.every((value) => text(value, 3, 500)), 'invalid_acceptance_criteria');
  assert(Array.isArray(input.capabilities) && input.capabilities.length > 0 && input.capabilities.length <= 20, 'invalid_capability_selection');
  const selected = new Set();
  const capabilities = input.capabilities.map((selection) => {
    assert(selection && Object.keys(selection).every((key) => ['kind', 'name'].includes(key)), 'invalid_capability');
    const { kind, name } = selection;
    let provider;
    if (kind === 'skill') provider = inventory.skills.find((item) => item.name === name)?.name.split(':')[0];
    else if (kind === 'tool') provider = inventory.tools.find((item) => item.name === name)?.provider;
    else if (kind === 'control' && inventory.orchestrationControls.includes(name)) provider = name.split('.')[0];
    assert(provider, 'unknown_capability');
    assert(!inventory.executionConstraints.some((item) => item.provider === provider && item.state === 'excluded-from-execution'), 'capability_excluded');
    const key = `${kind}:${name}`;
    assert(!selected.has(key), 'duplicate_capability'); selected.add(key);
    return key;
  });
  const request = {
    contactEmail: input.contactEmail.trim(), requestedOutcome: input.requestedOutcome.trim(),
    scope: 'other', allowedActions: ['inspect'],
    blockedActions: ['merge', 'deploy', 'close_pr', 'change_billing', 'change_secrets', 'expand_scope', 'delete_data', 'publish'],
    deliveryType: 'report',
    acceptanceCriteria: [...input.acceptanceCriteria, 'Provider feasibility and accepted quote before implementation', 'Independent provider permissions and scoped owner authority'],
    notes: `Target runtime: ${input.targetRuntime}. Catalogue captured: ${inventory.capturedOn}. Requested capabilities: ${capabilities.join(', ')}. Catalogue discovery does not grant provider access.`,
  };
  for (const field of ['repositoryUrl', 'siteUrl']) {
    if (input[field] === undefined) continue;
    assert(text(input[field], 1, 2000), 'invalid_public_url');
    let url; try { url = new URL(input[field]); } catch { throw new Error('invalid_public_url'); }
    assert(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash, 'public_https_url_without_credentials_required');
    request[field] = url.href;
  }
  assert(request.notes.length <= 5000 && Buffer.byteLength(JSON.stringify(request)) <= policy.requestBodyLimitBytes, 'request_too_large');
  return request;
}
