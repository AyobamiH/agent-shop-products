import { describe, expect, it } from "vitest";
import { merchantReady } from "../launch-readiness";

const evidence = "https://github.com/AyobamiH/agent-shop-products/blob/" + "a".repeat(40) + "/docs/receipt.md";
const valid = () => ({
  schemaVersion: 1, offerId: "private-production-agent-operating-kit",
  checks: Object.fromEntries(["publicBusinessAddress", "monitoredSupportEmail", "taxTreatment", "liveMerchantProfile", "buyerContractAndRecovery", "retentionPolicy"]
    .map((key) => [key, { status: "verified", evidence }])),
});
describe("merchant readiness before new live sales", () => {
  it("accepts the reconciled source facts while still rejecting absent or malformed evidence", () => {
    expect(merchantReady()).toBe(true);
    expect(merchantReady(null)).toBe(false);
    expect(merchantReady(valid())).toBe(true);
  });
  it("requires each independent fact and pinned evidence", () => {
    for (const key of Object.keys(valid().checks)) {
      for (const replacement of [
        undefined, { status: "unverified", evidence }, { status: "verified", evidence: null },
        { status: "verified", evidence: evidence.replace("github.com", "example.com") },
        { status: "verified", evidence: evidence.replace("a".repeat(40), "main") },
      ]) {
        const input = valid();
        Object.assign(input.checks, { [key]: replacement });
        expect(merchantReady(input)).toBe(false);
      }
    }
  });
});
