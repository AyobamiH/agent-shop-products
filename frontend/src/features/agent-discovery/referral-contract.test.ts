import { describe, expect, it } from "vitest";
import {
  SUBCONTRACTING_CAPABILITY_QUOTE_URL,
  SUBCONTRACTING_INTEGRATION_QUOTE_URL,
  SUBCONTRACTING_SERVICE_GUIDE,
  SUBCONTRACTING_SERVICE_CATALOGUE,
} from "./subcontracting-source";

describe("separate human enquiry and agent documentation", () => {
  for (const [url, campaign] of [
    [SUBCONTRACTING_INTEGRATION_QUOTE_URL, "integration_services"],
    [SUBCONTRACTING_CAPABILITY_QUOTE_URL, "capability_brief"],
  ] as const) {
    it("uses a direct form and bounded UTM markers for " + campaign, () => {
      const target = new URL(url);
      expect(target.origin).toBe("https://tailwaggingwebdesign.com");
      expect(target.pathname).toBe("/contact/");
      expect(Object.fromEntries(target.searchParams)).toEqual({
        utm_source: "agent_shop",
        utm_medium: "referral",
        utm_campaign: campaign,
      });
      expect(url).not.toContain("@");
    });
  }
  it("keeps agent intake and machine metadata on separate authoritative links", () => {
    expect(SUBCONTRACTING_SERVICE_GUIDE).toBe("https://tailwaggingwebdesign.com/agents/");
    expect(SUBCONTRACTING_SERVICE_CATALOGUE).toBe(
      "https://tailwaggingwebdesign.com/agent-services.json",
    );
  });
});
