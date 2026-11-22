import { readFileSync } from 'node:fs';
const configuration = JSON.parse(readFileSync(new URL('../src/lib/analytics/configuration.json', import.meta.url), 'utf8'));
/** Outside-in configuration/SSR readback. This never creates a visitor event. */
export function checkDiscoveryMeasurement({ privacy, solutions, integration, root, sitemap, canonical,
  expectedEnabled = configuration.enabled, consentVersion = configuration.consentVersion }) {
  const stateMarker = expectedEnabled ? 'Optional Google Analytics is available only after you allow it.' : 'Google Analytics is off.';
  for (const [label, text, marker] of [
    ['privacy', privacy, 'Website privacy and optional analytics'],
    ['privacy version', privacy, consentVersion], ['analytics availability', privacy, stateMarker],
    ['privacy canonical', privacy, canonical + '/privacy'], ['privacy sitemap', sitemap, canonical + '/privacy'],
    ['privacy navigation', root, 'href="/privacy"'], ['preferences navigation', root, 'Analytics settings'],
    ['evidence checklist', solutions, 'How to verify an AI-generated pull request before accepting the work'],
    ['scope example', integration, 'Turn a broken workflow into a quoteable repository fix'],
    ['quote measurement', integration, 'data-discovery-event="quote_click"'],
  ]) if (!text.includes(marker)) throw Error('P1_DISCOVERY_MISSING_' + label.replaceAll(' ', '_'));
  for (const html of [privacy, solutions, integration, root]) {
    if (/<script\b[^>]*src=["'][^"']*(googletagmanager|google-analytics|doubleclick)/i.test(html)) {
      throw Error('P1_ANALYTICS_TAG_WITHOUT_CONSENT');
    }
  }
  if (/<loc>[^<]*\/capabilities\/[^<]+<\/loc>/.test(sitemap)) throw Error('P1_THIN_EXTERNAL_REFERENCE_IN_SITEMAP');
  return { analyticsConfigured: expectedEnabled, analyticsRequiresConsent: true, websitePrivacyVersion: consentVersion, discoveryGuide: 'verified' };
}
export async function verifyDiscoveryMeasurement(origin, canonical) {
  const paths = ['/privacy', '/solutions', '/integration-services', '/', '/sitemap.xml'];
  const pages = await Promise.all(paths.map(async path => {
    const response = await fetch(origin + path, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error('P1_DISCOVERY_HTTP_' + response.status + '_' + path);
    return response.text();
  }));
  const [privacy, solutions, integration, root, sitemap] = pages;
  return checkDiscoveryMeasurement({ privacy, solutions, integration, root, sitemap, canonical });
}
