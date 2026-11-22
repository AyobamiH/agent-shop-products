import { describe, expect, it, vi } from "vitest";
import { safePage, discoveryEvent } from "./events";
import { DiscoveryRuntime } from "./runtime";
import { analyticsConfig, ANALYTICS_ORIGIN } from "./config";
import { createGoogleTransport } from "./google-transport";

const origin = ANALYTICS_ORIGIN;
const tagged = (path: string) => origin + path + "?utm_source=chatgpt.com";

describe("official ChatGPT search source parameter", () => {
  it("admits only the fixed standalone ChatGPT source on eligible public routes", () => {
    for (const path of [
      "/",
      "/shop",
      "/integration-services",
      "/products/auditable-indexing-state-reconciliation",
    ]) {
      expect(safePage(tagged(path))).toMatchObject({
        path,
        source: "chatgpt.com",
        campaign: "none",
        socialMedium: "referral",
      });
      expect(discoveryEvent(tagged(path), "page_view")?.parameters).toMatchObject({
        page_location: origin + path,
        page_referrer: "",
        discovery_source: "chatgpt.com",
        discovery_medium: "referral",
        discovery_campaign: "none",
      });
    }
  });
  it("rejects impersonation, extra parameters, duplicate UTM and secret-bearing URLs", () => {
    for (const q of [
      "?utm_source=claude.ai",
      "?utm_source=chatgpt.com.evil.test",
      "?utm_source=chatgpt.com&utm_source=linkedin",
      "?utm_source=chatgpt.com&utm_medium=referral",
      "?utm_source=chatgpt.com&utm_campaign=unapproved",
      "?utm_source=chatgpt.com&email=somebody@example.com",
      "?utm_source=chatgpt.com&access_token=secret",
      "?utm_source=CHATGPT.COM",
      "?utm_source=chatgpt.com%0asecret",
    ]) {
      expect(safePage(origin + "/shop" + q)).toBeNull();
    }
    expect(safePage(origin + "/private-kits/complete?utm_source=chatgpt.com")).toBeNull();
  });
  it("does not confuse an external campaign with the protected ChatGPT source", () => {
    const campaign =
      origin + "/solutions?utm_source=linkedin&utm_medium=social&utm_campaign=agent_shop_evidence";
    expect(discoveryEvent(campaign, "page_view", undefined, "claude.ai")?.parameters).toMatchObject(
      { discovery_source: "linkedin", discovery_campaign: "agent_shop_evidence" },
    );
    expect(
      discoveryEvent(tagged("/shop"), "page_view", undefined, "claude.ai")?.parameters,
    ).toMatchObject({ discovery_source: "chatgpt.com", discovery_medium: "referral" });
  });
  it("sends a canonical URL and fixed source only after consent, even without a referrer", () => {
    const browser = {
      sessionStorage: { getItem: () => null },
      agentShopAnalyticsLayer: [] as IArguments[],
    } as unknown as Window;
    const doc = {
      getElementById: () => null,
      createElement: () => ({ id: "", async: false, referrerPolicy: "", src: "" }),
      head: { append: vi.fn() },
      cookie: "",
    } as unknown as Document;
    const getReferrer = vi.fn(() => "");
    const runtime = new DiscoveryRuntime(
      analyticsConfig,
      createGoogleTransport(browser, doc),
      getReferrer,
    );
    const layer = (browser as unknown as { agentShopAnalyticsLayer: IArguments[] })
      .agentShopAnalyticsLayer;
    runtime.update(tagged("/shop"), "denied");
    expect(layer).toHaveLength(0);
    expect(getReferrer).not.toHaveBeenCalled();
    runtime.update(tagged("/shop"), "granted");
    const commands = layer.map((x) => Array.from(x));
    const config = commands.find((v) => v[0] === "config")?.[2] as Record<string, unknown>;
    expect(config["campaign_source"]).toBe("chatgpt.com");
    expect(config["campaign_medium"]).toBe("referral");
    expect(config["ignore_referrer"]).toBe(true);
    const event = commands.find((v) => v[0] === "event")?.[2] as Record<string, unknown>;
    expect(event).toMatchObject({
      page_location: origin + "/shop",
      page_referrer: "",
      discovery_source: "chatgpt.com",
      discovery_medium: "referral",
    });
    expect(JSON.stringify(commands)).not.toContain("utm_source=");
    expect(JSON.stringify(commands)).not.toContain("utm_source%3D");
  });
});
