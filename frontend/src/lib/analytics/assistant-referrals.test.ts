import { describe, expect, it, vi } from "vitest";
import { classifyAssistantReferrer } from "./assistant-referrals";
import { discoveryEvent } from "./events";
import { DiscoveryRuntime } from "./runtime";
import { analyticsConfig, ANALYTICS_ORIGIN } from "./config";
import { createGoogleTransport } from "./google-transport";

const config = analyticsConfig;
const origin = ANALYTICS_ORIGIN;
function fixture(referrer: () => string) {
  const transport = { start: vi.fn(), send: vi.fn(), stop: vi.fn() };
  return { runtime: new DiscoveryRuntime(config, transport, referrer), transport };
}

describe("bounded assistant referral classification", () => {
  it("matches only the supported official assistant domains", () => {
    for (const [url, expected] of [
      ["https://chatgpt.com/c/secret?email=hidden@example.com", "chatgpt.com"],
      ["https://chat.openai.com/share/abcdef", "chat.openai.com"],
      ["https://www.claude.ai/conversation/private", "claude.ai"],
      ["https://claude.ai/", "claude.ai"],
      ["https://perplexity.ai/search?q=private", "perplexity.ai"],
      ["https://copilot.microsoft.com/chats/1234", "copilot.microsoft.com"],
      ["https://gemini.google.com/app/secret", "gemini.google.com"],
      ["https://deepseek.com/", "deepseek.com"],
    ] as const) {
      expect(classifyAssistantReferrer(url)).toBe(expected);
    }
  });
  it("rejects lookalikes, unsafe protocols, credentials, ports and unknown origins", () => {
    for (const url of [
      "",
      "not a url",
      "https://fakechatgpt.com/c",
      "https://chatgpt.com.evil.test/",
      "https://claude.ai.attacker.test/private",
      "http://claude.ai/",
      "https://user:password@claude.ai/private",
      "https://claude.ai:444/",
      "javascript:alert('chatgpt.com')",
      "https://chatgpt.com@evil.test/",
      "https://google.com/search?q=chatgpt.com",
      "x".repeat(4097),
    ]) {
      expect(classifyAssistantReferrer(url)).toBeNull();
    }
  });
  it("does not replace a reviewed UTM campaign or allow arbitrary URLs", () => {
    const url =
      origin + "/solutions?utm_source=linkedin&utm_medium=social&utm_campaign=agent_shop_evidence";
    const event = discoveryEvent(url, "page_view", undefined, "claude.ai");
    expect(event?.parameters["discovery_source"]).toBe("linkedin");
    expect(event?.parameters["discovery_campaign"]).toBe("agent_shop_evidence");
    const ai = discoveryEvent(origin + "/shop", "page_view", undefined, "chatgpt.com");
    expect(ai?.parameters).toMatchObject({
      page_referrer: "",
      discovery_source: "chatgpt.com",
      discovery_medium: "referral",
      discovery_campaign: "none",
    });
    expect(
      discoveryEvent(origin + "/shop?email=private", "page_view", undefined, "claude.ai"),
    ).toBeNull();
  });
});

describe("consent and private-data isolation", () => {
  it("never reads the referrer without valid consent or on excluded pages", () => {
    const referrer = vi.fn(() => "https://chatgpt.com/c/secret");
    const { runtime, transport } = fixture(referrer);
    runtime.update(origin + "/shop", null);
    runtime.update(origin + "/shop", "denied");
    runtime.update(origin + "/private-kits/complete?claim=secret", "granted");
    expect(referrer).not.toHaveBeenCalled();
    expect(transport.start).not.toHaveBeenCalled();
    expect(transport.send).not.toHaveBeenCalled();
  });
  it("reads once after consent, keeps source across public navigation and drops raw data", () => {
    const sensitive = "https://claude.ai/chat/secret-token?email=hidden@example.com";
    const referrer = vi.fn(() => sensitive);
    const { runtime, transport } = fixture(referrer);
    runtime.update(origin + "/shop", "granted");
    runtime.pause();
    runtime.update(origin + "/integration-services", "granted");
    runtime.event(origin + "/integration-services", "granted", "quote_click");
    expect(referrer).toHaveBeenCalledTimes(1);
    expect(transport.send.mock.calls.map(([e]) => e.parameters.discovery_source)).toEqual([
      "claude.ai",
      "claude.ai",
      "claude.ai",
    ]);
    expect(JSON.stringify(transport.send.mock.calls)).not.toContain(sensitive);
    expect(JSON.stringify(transport.send.mock.calls)).not.toContain("secret-token");
    runtime.pause(true);
    runtime.update(origin + "/shop", "granted");
    expect(referrer).toHaveBeenCalledTimes(2);
  });
  it("fails closed to unattributed if the browser cannot provide referrer", () => {
    const { runtime, transport } = fixture(() => {
      throw Error("unavailable");
    });
    runtime.update(origin + "/shop", "granted");
    expect(transport.send.mock.calls[0]?.[0].parameters.discovery_source).toBe("unattributed");
  });
  it("sends only the allowlisted source to Google's existing consent-bound transport", () => {
    const queued: Record<string, unknown>[] = [];
    const browser = {
      sessionStorage: { getItem: () => null },
      agentShopAnalyticsLayer: [] as IArguments[],
    } as unknown as Window;
    const doc = {
      getElementById: () => null,
      createElement: () => ({ id: "", async: false, referrerPolicy: "", src: "" }),
      head: { append: (s: Record<string, unknown>) => queued.push(s) },
      cookie: "",
    } as unknown as Document;
    const runtime = new DiscoveryRuntime(
      config,
      createGoogleTransport(browser, doc),
      () => "https://chatgpt.com/c/private?access_token=never-send",
    );
    runtime.update(origin + "/shop", "denied");
    expect(
      (browser as unknown as { agentShopAnalyticsLayer: IArguments[] }).agentShopAnalyticsLayer,
    ).toHaveLength(0);
    runtime.update(origin + "/shop", "granted");
    const commands = (
      browser as unknown as { agentShopAnalyticsLayer: IArguments[] }
    ).agentShopAnalyticsLayer.map((args) => Array.from(args));
    const options = commands.find((args) => args[0] === "config")?.[2] as Record<string, unknown>;
    expect(options["campaign_source"]).toBe("chatgpt.com");
    expect(options["ignore_referrer"]).toBe(true);
    const payload = JSON.stringify(commands);
    expect(payload).not.toContain("access_token");
    expect(payload).not.toContain("/c/private");
    expect(commands.find((args) => args[0] === "event")?.[2]).toMatchObject({
      page_referrer: "",
      discovery_source: "chatgpt.com",
    });
    expect(queued).toHaveLength(1);
  });
});
