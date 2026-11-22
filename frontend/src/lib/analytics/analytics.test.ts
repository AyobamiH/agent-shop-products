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
import { createGoogleTransport } from "./google-transport";
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
const disabled: AnalyticsConfig = {
  ...analyticsConfig,
  enabled: false,
  propertyId: null,
  streamId: null,
  measurementId: null,
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
  it("binds the independently observed Shop stream while preserving disabled admission", () => {
    expect(analyticsConfig.propertyId).toBe("properties/559055643");
    expect(analyticsConfig.streamId).toBe("16129921164");
    expect(configuredMeasurementId(analyticsConfig)).toBe("G-9LH3DJYS4B");
    expect(configuredMeasurementId(disabled)).toBeNull();
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
describe("reviewed Post-Once Agent Shop LinkedIn attribution", () => {
  const campaign = "ASP-LIVE-20261016-001";
  const approved =
    "/?utm_source=linkedin&utm_medium=social&utm_campaign=" + campaign + "&utm_content=catalogue";
  const observed =
    "/?utmsource=linkedin&utmmedium=social&utmcampaign=" + campaign + "&utmcontent=catalogue";
  it("accepts only exact frozen campaign on the owned public landing page", () => {
    for (const path of [approved, observed]) {
      const page = safePage(origin + path);
      expect(page).toMatchObject({
        path: "/",
        source: "linkedin",
        campaign,
        socialMedium: "social",
        socialContent: "catalogue",
      });
      const event = discoveryEvent(origin + path, "page_view");
      expect(event?.parameters).toMatchObject({
        page_location: origin + "/",
        page_referrer: "",
        discovery_source: "linkedin",
        discovery_campaign: campaign,
        discovery_medium: "social",
        discovery_content: "catalogue",
      });
      expect(JSON.stringify(event)).not.toContain("utmsource");
      expect(JSON.stringify(event)).not.toContain("utm_source");
    }
  });
  it("refuses duplicate, mixed, private or other-brand queries even with known campaign", () => {
    const input = new URLSearchParams(observed.split("?")[1]);
    for (const value of [
      observed + "&code=secret",
      observed + "&utmsource=reddit",
      observed.replace("utmcampaign", "utm_campaign"),
      observed.replace("utmcampaign=" + campaign, "utmcampaign=UNVERIFIED"),
      observed.replace("utmcontent=catalogue", "utmcontent=checkout"),
      "/login" + observed.slice(1),
      "/private-kits/complete" + observed.slice(1),
      "/agents" + observed.slice(1),
      approved + "&email=private@example.com",
      approved.replace("utm_content=catalogue", "utm_content=unknown"),
    ]) {
      expect(safePage(origin + value)).toBeNull();
    }
    expect(safePage("https://evil.test/" + observed.slice(1))).toBeNull();
    expect(safePage(origin + "/?utmsource=x")).toBeNull();
    expect(input.get("utmcampaign")).toBe(campaign);
  });
  it("queues correctly scoped GA4 campaign settings only after explicit runtime start", () => {
    const scripts: Record<string, unknown>[] = [];
    const browser = {
      sessionStorage: { getItem: () => null },
      agentShopAnalyticsLayer: [] as IArguments[],
    } as unknown as Window;
    const document = {
      getElementById: () => null,
      createElement: () => ({ id: "", async: false, referrerPolicy: "", src: "" }),
      head: { append: (s: Record<string, unknown>) => scripts.push(s) },
      cookie: "",
    } as unknown as Document;
    const transport = createGoogleTransport(browser, document);
    expect(
      (browser as unknown as { agentShopAnalyticsLayer: IArguments[] }).agentShopAnalyticsLayer,
    ).toHaveLength(0);
    const event = discoveryEvent(
      origin +
        "/?utmsource=linkedin&utmmedium=social&utmcampaign=" +
        campaign +
        "&utmcontent=catalogue",
      "page_view",
    );
    expect(event).not.toBeNull();
    transport.start("G-TESTID", event!);
    transport.send(event!);
    const commands = (
      browser as unknown as { agentShopAnalyticsLayer: IArguments[] }
    ).agentShopAnalyticsLayer.map((args) => Array.from(args));
    const config = commands.find((args) => args[0] === "config");
    expect(config?.[2]).toMatchObject({
      campaign_source: "linkedin",
      campaign_medium: "social",
      campaign_name: campaign,
      campaign_content: "catalogue",
      send_page_view: false,
    });
    expect(config?.[2]).not.toHaveProperty("email");
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.["src"]).toContain("gtag/js?id=G-TESTID");
    const eventCommand = commands.find((args) => args[0] === "event");
    expect(eventCommand?.[2]).toMatchObject({
      page_location: origin + "/",
      discovery_campaign: campaign,
      discovery_content: "catalogue",
    });
    transport.stop(true);
    expect(scripts).toHaveLength(1); // only the originally injected script, no second vendor.
  });
  it("does not broaden existing campaign allowlist or modify native-page semantics", () => {
    const old = discoveryEvent(
      origin + "/solutions?utm_source=linkedin&utm_medium=social&utm_campaign=agent_shop_evidence",
      "page_view",
    );
    expect(old?.parameters["discovery_campaign"]).toBe("agent_shop_evidence");
    expect(old?.parameters).not.toHaveProperty("discovery_content");
    expect(
      discoveryEvent(
        origin +
          "/solutions?utm_source=linkedin&utm_medium=social&utm_campaign=" +
          campaign +
          "&utm_content=catalogue",
        "page_view",
      ),
    ).toBeNull();
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
    for (const config of [disabled, enabled]) {
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
