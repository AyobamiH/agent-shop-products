// Isolated browser test entry. Never imported by application routes or deployed.
import { analyticsConfig, ANALYTICS_ORIGIN } from "../../src/lib/analytics/config";
import { createGoogleTransport } from "../../src/lib/analytics/google-transport";
import { DiscoveryRuntime } from "../../src/lib/analytics/runtime";
import type { ConsentChoice } from "../../src/lib/analytics/consent";
const config = {
  ...analyticsConfig,
  enabled: true,
  propertyId: "properties/123456",
  streamId: "987654",
  measurementId: "G-TESTONLY00",
  ownershipVerifiedAt: "2026-10-01T00:00:00Z",
  enhancedMeasurementDisabled: true,
  advertisingFeaturesDisabled: true,
  retentionMonths: 2,
};
const runtime = new DiscoveryRuntime(config, createGoogleTransport());
const api = {
  visit(path: string, choice: ConsentChoice | null) {
    runtime.update(ANALYTICS_ORIGIN + path, choice);
  },
  click(path: string, choice: ConsentChoice | null, event: string, id?: string) {
    runtime.event(ANALYTICS_ORIGIN + path, choice, event, id);
  },
  pause() {
    runtime.pause();
  },
};
Object.assign(window, { analyticsFixture: api });
