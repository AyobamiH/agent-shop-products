import { SHOP_ORIGIN, GSC_PROPERTY, numericResource } from './constants.mjs';
import { paged } from './session.mjs';
import { safeError } from './http.mjs';
export const ADMIN = 'https://analyticsadmin.googleapis.com/v1beta/';
export const ALPHA = 'https://analyticsadmin.googleapis.com/v1alpha/';
export const DATA = 'https://analyticsdata.googleapis.com/v1beta/';
export async function inventory(session) {
  const observed = { schemaVersion: 1, observedAt: new Date().toISOString(), origin: SHOP_ORIGIN,
    cloudProject: session.cloudProject, analytics: { status: 'unknown' }, searchConsole: { status: 'unknown' } };
  try {
    const accounts = await paged(session, ADMIN + 'accountSummaries', 'accountSummaries');
    const properties = [];
    for (const account of accounts) {
      numericResource(account.account, 'accounts');
      for (const property of account.propertySummaries || []) {
        numericResource(property.property, 'properties');
        const streams = await paged(session, ADMIN + property.property + '/dataStreams', 'dataStreams');
        properties.push({ account: account.account, accountName: account.displayName,
          property: property.property, propertyName: property.displayName,
          streams: streams.map(stream => ({ name: stream.name, displayName: stream.displayName,
            type: stream.type, defaultUri: stream.webStreamData?.defaultUri ?? null,
            measurementId: stream.webStreamData?.measurementId ?? null })) });
      }
    }
    observed.analytics = { status: 'observed', accountCount: accounts.length,
      accounts: accounts.map(a => ({ account: a.account, displayName: a.displayName })), properties };
  } catch (error) { observed.analytics = { status: 'unavailable', error: safeError(error) }; }
  try {
    const sites = await session.request('https://www.googleapis.com/webmasters/v3/sites');
    const site = (sites.siteEntry || []).find(s => s.siteUrl === GSC_PROPERTY);
    observed.searchConsole = site ? { status: 'observed', property: site.siteUrl, permissionLevel: site.permissionLevel }
      : { status: 'not_in_granted_account', property: GSC_PROPERTY };
  } catch (error) { observed.searchConsole = { status: 'unavailable', error: safeError(error) }; }
  return observed;
}
export function exactShopStreams(report) {
  if (report.analytics.status !== 'observed') throw Error('ANALYTICS_INVENTORY_NOT_OBSERVED');
  return report.analytics.properties.flatMap(p => p.streams.filter(s => {
    try { return s.type === 'WEB_DATA_STREAM' && new URL(s.defaultUri).origin === SHOP_ORIGIN; }
    catch { return false; }
  }).map(s => ({ account: p.account, property: p.property, stream: s })));
}
