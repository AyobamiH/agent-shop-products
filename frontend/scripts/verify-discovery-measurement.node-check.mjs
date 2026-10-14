import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDiscoveryMeasurement } from "./verify-discovery-measurement.mjs";
const fixture = {
  canonical: "https://example.invalid",
  privacy: "Website privacy and optional analytics 2026-10-14.2 Optional Google Analytics is available only after you allow it. https://example.invalid/privacy",
  root: '<a href="/privacy">Privacy</a> Analytics settings',
  sitemap: "<loc>https://example.invalid/privacy</loc>",
  solutions: "How to verify an AI-generated pull request before accepting the work",
  integration: 'Turn a broken workflow into a quoteable repository fix data-discovery-event="quote_click"',
};
test("readback accepts only present public content and consent-required analytics", () => {
  assert.deepEqual(checkDiscoveryMeasurement(fixture), {
    analyticsConfigured: true, analyticsRequiresConsent: true, websitePrivacyVersion: "2026-10-14.2", discoveryGuide: "verified",
  });
});
test("missing pages or misleading active collection fail the release", () => {
  for (const field of ["privacy", "root", "sitemap", "solutions", "integration"]) {
    assert.throws(() => checkDiscoveryMeasurement({ ...fixture, [field]: "" }));
  }
  assert.throws(() => checkDiscoveryMeasurement({ ...fixture,
    root: fixture.root + '<script src="https://www.googletagmanager.com/gtag/js?id=G-TESTONLY00"></script>' }));
  assert.throws(() => checkDiscoveryMeasurement({ ...fixture,
    sitemap: fixture.sitemap + '<loc>https://example.invalid/capabilities/tool</loc>' }));
});

test("disabled source still requires an honest off-state, not an active configuration claim",()=>{
 const off={...fixture,expectedEnabled:false,privacy:fixture.privacy.replace("Optional Google Analytics is available only after you allow it.","Google Analytics is off.")};
 assert.equal(checkDiscoveryMeasurement(off).analyticsConfigured,false);
 assert.throws(()=>checkDiscoveryMeasurement({...off,expectedEnabled:true}));
});
