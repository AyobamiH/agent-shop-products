#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { PRIVATE_DIR, SCOPES } from './google/constants.mjs';
import { privateRead, privateWrite } from './google/private-store.mjs';
import { serveAuthorization } from './google/oauth.mjs';
import { googleSession } from './google/session.mjs';
import { inventory, exactShopStreams, ALPHA, ADMIN } from './google/inventory.mjs';
import { searchReport, analyticsReport, realtimeReport, inspectUrl, sitemapReport, boundStream } from './google/reports.mjs';
import { safeError } from './google/http.mjs';
import { scopesFromFile, validateSocial, readPortfolio } from './google/portfolio-report.mjs';

export function status() {
  const file = path.join(PRIVATE_DIR, 'credential.json');
  let authorization = null;
  const pending = path.join(PRIVATE_DIR, 'authorization-status.json');
  if (existsSync(pending)) authorization = privateRead(pending);
  if (!existsSync(file)) return { credentialPresent: false, authorization, collectionManagedByThisCommand: false };
  const credential = privateRead(file);
  return { credentialPresent: true, cloudProject: credential.project_id, grantedAt: credential.grantedAt,
    scopes: credential.scopes, authorization, liveAccess: 'not_checked_by_local_status' };
}
async function inspectStream(session, property, streamId) {
  const stream = await boundStream(session, property, streamId);
  const details = {};
  for (const [key, endpoint] of [
    ['enhancedMeasurement', ALPHA + stream.name + '/enhancedMeasurementSettings'],
    ['retention', ADMIN + property + '/dataRetentionSettings'],
    ['googleSignals', ALPHA + property + '/googleSignalsSettings'],
  ]) {
    try { details[key] = await session.request(endpoint); }
    catch (error) { details[key] = { status: 'unavailable', error: safeError(error) }; }
  }
  return { observedAt: new Date().toISOString(), property, stream, details,
    collectionEnabledByThisCommand: false, boundary: 'Read-only; no site configuration or Google settings changed.' };
}
async function saveInventory() {
  const report = await inventory(await googleSession());
  const saved = privateWrite('inventory.json', report);
  console.log(JSON.stringify({ status: 'inventory_observed', saved, analytics: report.analytics,
    searchConsole: report.searchConsole, exactShopStreams: report.analytics.status === 'observed' ? exactShopStreams(report) : null }));
  return report;
}
export async function main(args = process.argv.slice(2)) {
  const { positionals, values } = parseArgs({ args, allowPositionals: true, options: {
    'client-file': { type: 'string' }, 'expected-email': { type: 'string' }, port: { type: 'string', default: '8774' },
    property: { type: 'string' }, stream: { type: 'string' }, start: { type: 'string' }, end: { type: 'string' },
    url: { type: 'string' }, 'social-file': { type: 'string' }, 'gsc-end': { type: 'string' }, diagnostic: { type: 'boolean', default: false }, help: { type: 'boolean', default: false },
  } });
  const command = positionals[0];
  if (values.help || command === 'help' || !command) {
    console.log('Agent Shop direct Google operator (Node 24+)\n' +
      'status\nauth --client-file PRIVATE_DESKTOP_JSON --expected-email OWNER_EMAIL [--port 8774]\n' +
      'inventory\ninspect-stream --property properties/ID --stream ID\n' +
      'search-report --start YYYY-MM-DD --end YYYY-MM-DD\n' +
      'analytics-report --property properties/ID --stream ID --start YYYY-MM-DD --end YYYY-MM-DD\n' +
      'realtime-report --property properties/ID --stream ID [--diagnostic]\nportfolio-report --start YYYY-MM-DD --end YYYY-MM-DD --gsc-end YYYY-MM-DD [--social-file OWNER_PRIVATE_FILE]\ninspect-url --url PUBLIC_SHOP_URL\nsitemaps\n' +
      'Tokens/reports stay in ~/.config/agent-shop-google/. Never paste credentials. No collection, billing, or provider setting is enabled by these commands.');
    return;
  }
  if (positionals.length !== 1) throw Error('ONE_GOOGLE_COMMAND_REQUIRED');
  if (command === 'status') { console.log(JSON.stringify(status())); return; }
  if (command === 'auth') {
    const pending = await serveAuthorization({ clientFile: values['client-file'], expectedEmail: values['expected-email'],
      port: Number(values.port), onConnected: saveInventory });
    process.once('SIGTERM', () => { void pending.close(); });
    process.once('SIGINT', () => { void pending.close(); });
    console.log(JSON.stringify({ status: 'awaiting_google_consent', connectUrl: pending.connectUrl,
      expiresAt: pending.expiresAt, cloudProject: pending.cloudProject, requestedScopes: SCOPES,
      note: 'Approve in your normal browser on this computer. Existing Post-Once token is not read or modified.' }));
    console.log(JSON.stringify(await pending.done)); return;
  }
  if (command === 'inventory') { await saveInventory(); return; }
  if (command === 'portfolio-report') {
    const scopes=scopesFromFile();
    const social=values['social-file'] ? validateSocial(privateRead(values['social-file']),scopes) : [];
    const session=await googleSession();
    const current=await inventory(session);
    const output=await readPortfolio({session,scopes,inv:current,start:values.start,
      end:values.end,gscEnd:values['gsc-end'],social});
    const saved=privateWrite('portfolio-attribution.json',output);
    console.log(JSON.stringify({status:'observed',command,saved,observedAt:output.observedAt,
      mapped:Object.values(output.scopes).filter(x=>x.status==='mapped').length,
      unmapped:Object.values(output.scopes).filter(x=>x.status==='not_mapped').length,
      socialCampaigns:output.campaigns.length,
      preliminary:!output.ga4Window.matured,
      note:'Direct Google API readbacks only; no credentials or customer records exposed.'}));
    return;
  }
  const allowed = ['inspect-stream', 'search-report', 'analytics-report', 'realtime-report', 'inspect-url', 'sitemaps'];
  if (!allowed.includes(command)) throw Error('UNKNOWN_GOOGLE_COMMAND');
  const session = await googleSession(); let report;
  if (command === 'inspect-stream') report = await inspectStream(session, values.property, values.stream);
  if (command === 'search-report') report = await searchReport(session, values.start, values.end);
  if (command === 'analytics-report') report = await analyticsReport(session, values.property, values.stream, values.start, values.end);
  if (command === 'realtime-report') report = await realtimeReport(session, values.property, values.stream, { diagnostic: values.diagnostic });
  if (command === 'inspect-url') report = await inspectUrl(session, values.url);
  if (command === 'sitemaps') report = await sitemapReport(session);
  const saved = privateWrite(command + '.json', report);
  console.log(JSON.stringify({ status: 'observed', command, saved, observedAt: report.observedAt,
    note: 'Provider response saved privately. Observed activity is not proof of a qualified enquiry or sale.' }));
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch(error => { console.error(safeError(error)); process.exitCode = 1; });
}
