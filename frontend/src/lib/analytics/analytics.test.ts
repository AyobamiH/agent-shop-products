import { describe, expect, it, vi } from "vitest";
import {
  analyticsConfig,
  ANALYTICS_ORIGIN,
  configuredMeasurementId,
  CONSENT_LIFETIME_MS,
  CONSENT_VERSION,
} from "./config";
import type { AnalyticsConfig } from "./config";
import { readConsent, saveConsent } from "./consent";
import { discoveryEvent, safePage } from "./events";
import { DiscoveryRuntime } from "./runtime";
import { listCapabilities } from "@/domain/capabilities/repository";
const enabled: AnalyticsConfig = {
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
const origin = ANALYTICS_ORIGIN;
function storage() {
  let value: string | null = null;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
  };
}
function fixture(config = enabled) {
  const transport = { start: vi.fn(), send: vi.fn(), stop: vi.fn() };
  return { runtime: new DiscoveryRuntime(config, transport), transport };
}
describe("analytics configuration admission", () => {
  it("ships off without inventing a property or stream", () => {
    expect(analyticsConfig.enabled).toBe(false);
    expect(analyticsConfig.measurementId).toBeNull();
    expect(configuredMeasurementId(analyticsConfig)).toBeNull();
  });
  it("requires independent ownership, origin, enhanced-measurement, ad and retention gates", () => {
    expect(configuredMeasurementId(enabled)).toBe("G-TESTONLY00");
    for (const patch of [
      { enabled: false },
      { propertyId: null },
      { streamId: null },
      { origin: "https://other.example" },
      { measurementId: "G-INVALID?email=x" },
      { ownershipVerifiedAt: null },
      { ownershipVerifiedAt: "2099-01-01" },
      { enhancedMeasurementDisabled: false },
      { advertisingFeaturesDisabled: false },
      { retentionMonths: 14 },
      { consentVersion: "obsolete" },
    ]) {
      expect(configuredMeasurementId({ ...enabled, ...patch })).toBeNull();
    }
  });
});
describe("versioned optional preference", () => {
  it("defaults to no consent and remembers explicit equal choices", () => {
    const store = storage();
    expect(readConsent(store)).toBeNull();
    for (const choice of ["granted", "denied"] as const) {
      expect(saveConsent(store, choice, 100)).toBe(true);
      expect(readConsent(store, 101)).toBe(choice);
    }
  });
  it("rejects corrupt, stale, future, out-of-version and inaccessible preferences", () => {
    const store = storage();
    for (const data of [
      "not-json",
      "null",
      "{}",
      JSON.stringify({ version: "old", choice: "granted", timestamp: 1 }),
      JSON.stringify({ version: CONSENT_VERSION, choice: "granted", timestamp: 1000 }),
    ]) {
      store.setItem("", data);
      expect(readConsent(store, 50)).toBeNull();
    }
    saveConsent(store, "granted", 0);
    expect(readConsent(store, CONSENT_LIFETIME_MS)).toBeNull();
    const blocked = {
      getItem() {
        throw Error();
      },
      setItem() {
        throw Error();
      },
    };
    expect(readConsent(blocked)).toBeNull();
    expect(saveConsent(blocked, "granted")).toBe(false);
  });
});
describe("public discovery event boundary", () => {
  it("drops all receipt, email, customer-text, order, unknown and API surfaces", () => {
    for (const path of [
      "/private-kits/complete",
      "/private-kits/complete?order=secret",
      "/api/v1/commerce/offers",
      "/solutions?email=buyer@example.com",
      "/capabilities?q=private+payload",
      "/shop#receipt-secret",
      "/products/private-customer-project",
      "/capabilities/unknown",
      "/solutions?utm_source=buyer@example.com",
      "/solutions?utm_source=linkedin&utm_source=reddit&utm_medium=social&utm_campaign=agent_shop_evidence",
    ]) {
      expect(safePage(origin + path)).toBeNull();
      expect(discoveryEvent(origin + path, "page_view")).toBeNull();
    }
    expect(safePage("https://other.example/solutions")).toBeNull();
  });
  it("permits only bounded campaigns and strips the complete query and hash", () => {
    const event = discoveryEvent(
      origin +
        "/solutions?utm_source=linkedin&utm_medium=social&utm_campaign=agent_shop_evidence#verify-agent-work",
      "page_view",
    );
    expect(event?.parameters["page_location"]).toBe(origin + "/solutions");
    expect(event?.parameters["page_referrer"]).toBe("");
    expect(event?.parameters["discovery_source"]).toBe("linkedin");
    expect(event?.parameters["discovery_campaign"]).toBe("agent_shop_evidence");
    expect(JSON.stringify(event)).not.toContain("utm_");
  });
  it("selects real public capability IDs only on their browser", () => {
    const capability = listCapabilities()[0]!;
    const event = discoveryEvent(origin + "/capabilities", "select_capability", capability.id);
    expect(event?.parameters["capability_id"]).toBe(capability.id);
    expect(
      discoveryEvent(origin + "/capabilities", "select_capability", "customer-secret"),
    ).toBeNull();
    expect(discoveryEvent(origin + "/shop", "select_capability", capability.id)).toBeNull();
  });
  it("counts only eligible quote contexts, never a purchase or qualified lead", () => {
    expect(
      discoveryEvent(origin + "/integration-services", "quote_click")?.parameters["quote_context"],
    ).toBe("integration_services");
    expect(discoveryEvent(origin + "/private-kits", "quote_click")).toBeNull();
    expect(discoveryEvent(origin + "/solutions", "purchase")).toBeNull();
    const excluded = listCapabilities().find((c) => !c.integrationRequestAllowed)!;
    expect(discoveryEvent(origin + "/capabilities/" + excluded.id, "quote_click")).toBeNull();
  });
});
describe("consent runtime", () => {
  it("never starts or queues Google without explicit valid consent and configuration", () => {
    for (const config of [analyticsConfig, enabled]) {
      const { runtime, transport } = fixture(config);
      runtime.update(origin + "/solutions", null);
      runtime.event(origin + "/integration-services", "denied", "quote_click");
      if (!config.enabled) runtime.update(origin + "/solutions", "granted");
      expect(transport.start).not.toHaveBeenCalled();
      expect(transport.send).not.toHaveBeenCalled();
    }
  });
  it("deduplicates page views and counts quote-click independently", () => {
    const { runtime, transport } = fixture();
    runtime.update(origin + "/integration-services", "granted");
    runtime.update(origin + "/integration-services", "granted");
    runtime.event(origin + "/integration-services", "granted", "quote_click");
    expect(transport.start).toHaveBeenCalledTimes(1);
    expect(transport.send.mock.calls.map((call) => call[0].name)).toEqual([
      "page_view",
      "quote_click",
    ]);
  });
  it("keeps the consented identifier on navigation but clears it on withdrawal", () => {
    const { runtime, transport } = fixture();
    runtime.update(origin + "/solutions", "granted");
    runtime.pause();
    expect(transport.stop).toHaveBeenLastCalledWith(false);
    runtime.update(origin + "/integration-services", "granted");
    runtime.update(origin + "/integration-services", "denied");
    expect(transport.stop).toHaveBeenLastCalledWith(true);
    const count = transport.send.mock.calls.length;
    runtime.event(origin + "/integration-services", "denied", "quote_click");
    expect(transport.send).toHaveBeenCalledTimes(count);
  });
  it("stops a previously consented session before private/unsafe routes", () => {
    const { runtime, transport } = fixture();
    runtime.update(origin + "/solutions", "granted");
    runtime.update(origin + "/private-kits/complete?claim=secret", "granted");
    runtime.event(origin + "/private-kits/complete?claim=secret", "granted", "quote_click");
    expect(transport.send).toHaveBeenCalledTimes(1);
    expect(transport.stop).toHaveBeenCalled();
  });
});
