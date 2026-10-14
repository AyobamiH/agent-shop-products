/** Outside-in readback of this P1 slice. No visitor or payment event is created. */
export function checkDiscoveryMeasurement({ privacy, solutions, integration, root, sitemap, canonical }) {
  for (const [label, text, marker] of [
    ["privacy", privacy, "Website privacy and optional analytics"],
    ["privacy version", privacy, "2026-10-14.1"],
    ["inactive analytics", privacy, "Google Analytics is off."],
    ["privacy canonical", privacy, canonical + "/privacy"],
    ["privacy sitemap", sitemap, canonical + "/privacy"],
    ["privacy navigation", root, 'href="/privacy"'],
    ["preferences navigation", root, "Analytics settings"],
    ["evidence checklist", solutions, "How to verify an AI-generated pull request before accepting the work"],
    ["scope example", integration, "Turn a broken workflow into a quoteable repository fix"],
    ["quote measurement", integration, 'data-discovery-event="quote_click"'],
  ]) {
    if (!text.includes(marker)) throw new Error("P1_DISCOVERY_MISSING_" + label.replaceAll(" ", "_"));
  }
  for (const html of [privacy, solutions, integration, root]) {
    if (/<script\b[^>]*src=["'][^"']*(googletagmanager|google-analytics|doubleclick)/i.test(html)) {
      throw new Error("P1_ANALYTICS_TAG_WITHOUT_CONSENT");
    }
  }
  if (/<loc>[^<]*\/capabilities\/[^<]+<\/loc>/.test(sitemap)) {
    throw new Error("P1_THIN_EXTERNAL_REFERENCE_IN_SITEMAP");
  }
  return { analyticsActive: false, websitePrivacyVersion: "2026-10-14.1", discoveryGuide: "verified" };
}

export async function verifyDiscoveryMeasurement(origin, canonical) {
  const paths = ["/privacy", "/solutions", "/integration-services", "/", "/sitemap.xml"];
  const pages = await Promise.all(paths.map(async path => {
    const response = await fetch(origin + path, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error("P1_DISCOVERY_HTTP_" + response.status + "_" + path);
    return response.text();
  }));
  const [privacy, solutions, integration, root, sitemap] = pages;
  return checkDiscoveryMeasurement({ privacy, solutions, integration, root, sitemap, canonical });
}
