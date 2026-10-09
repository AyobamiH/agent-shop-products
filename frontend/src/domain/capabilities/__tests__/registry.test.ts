import { describe, expect, it } from "vitest";
import { capabilityId, capabilityMeta, getCapability, listCapabilities } from "../repository";
import { queryCapabilities, validateCapabilityQuery } from "../search";
import { buildIntegrationBrief } from "../brief";
import { buildCapabilitiesJson } from "@/lib/machine-readable/capabilities";
import { listCodingBugs } from "@/domain/coding-bugs/repository";

describe("complete external acquisition catalogue", () => {
  const all = listCapabilities();
  it("exposes each source record once with stable indexed lookup", () => {
    expect(all).toHaveLength(990);
    expect(capabilityMeta.counts).toEqual({
      uniqueSkills: 111,
      advertisedTools: 868,
      orchestrationControls: 11,
    });
    expect(new Set(all.map((c) => c.id)).size).toBe(990);
    for (const c of all) {
      expect(getCapability(c.id)).toBe(c);
      expect(capabilityId(c.kind, c.name)).toBe(c.id);
    }
    expect(getCapability("missing")).toBeUndefined();
  });
  it("shares filtering and bounded pagination across kinds and providers", () => {
    for (const [kind, total] of [
      ["skill", 111],
      ["tool", 868],
      ["control", 11],
    ] as const) {
      const result = queryCapabilities(all, { kind });
      expect(result.total).toBe(total);
      expect(result.records.every((c) => c.kind === kind)).toBe(true);
    }
    const result = queryCapabilities(all, {
      kind: "tool",
      provider: "GitHub",
      q: "fetch",
      page: 9999,
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.page).toBe(result.pageCount);
    expect(result.records.every((c) => c.provider === "GitHub" && c.name.includes("fetch"))).toBe(
      true,
    );
    expect(queryCapabilities(all, { provider: "unknown" }).total).toBe(0);
    expect(validateCapabilityQuery({ page: -1, kind: "invalid", q: "  " })).toEqual({
      page: undefined,
      kind: undefined,
      q: undefined,
      provider: undefined,
    });
  });
  it("includes all records by default and aligns explicit JSON pages with HTML", () => {
    const full = buildCapabilitiesJson();
    expect(full.capabilities).toHaveLength(990);
    for (const c of full.capabilities) {
      expect(c.detailUrl).toContain(`/capabilities/${c.id}`);
      expect(c.briefUrl).toContain(c.id);
    }
    const paged = buildCapabilitiesJson(new URLSearchParams("page=1"));
    expect(paged.capabilities).toHaveLength(40);
    const query = { kind: "tool" as const, provider: "GitHub", page: 2 };
    const html = queryCapabilities(all, query);
    const json = buildCapabilitiesJson(new URLSearchParams("kind=tool&provider=GitHub&page=2"));
    expect(json.capabilities.map((c) => c.id)).toEqual(html.records.map((c) => c.id));
  });
  it("prepares incomplete quote requests without claiming purchase or provider access", () => {
    for (const c of all) {
      const brief = buildIntegrationBrief(c);
      expect(brief.acquisition.model).toBe("quote-first-original-integration");
      expect(brief.acquisition).not.toHaveProperty("price");
      if (c.integrationRequestAllowed) {
        expect(brief.handoff?.templateIsIncomplete).toBe(true);
        expect(brief.handoff?.requestTemplate).not.toHaveProperty("contactEmail");
        expect(brief.handoff?.requestTemplate.allowedActions).toEqual(["inspect"]);
        expect(
          new TextEncoder().encode(JSON.stringify(brief.handoff?.requestTemplate)).length,
        ).toBeLessThan(16000);
      } else {
        expect(brief.handoff).toBeUndefined();
        expect(c.provider).toBe("RUBE");
      }
    }
  });
  it("keeps scoped bug evidence linked and avoids fresh-production claims", () => {
    const bugs = listCodingBugs();
    expect(bugs).toHaveLength(19);
    expect(new Set(bugs.map((b) => b.evidence.id)).size).toBe(19);
    expect(
      bugs.every((b) => Boolean(b.evidence.scope && b.nextAcceptance && b.regressionCheck)),
    ).toBe(true);
    expect(bugs.find((b) => b.id === "BUG-0013")?.status).toBe("Candidate fix open");
    expect(bugs.find((b) => b.id === "BUG-0017")?.status).toBe("Cause unresolved");
    expect(bugs.filter((b) => b.status === "Preventive failure mode")).toHaveLength(3);
  });
});
