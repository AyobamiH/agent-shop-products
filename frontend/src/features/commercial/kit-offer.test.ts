import { describe, expect, it } from "vitest";
import { KIT_ID, parseKitCatalogue } from "./kit-offer";

const offer = {
  id: KIT_ID,
  title: "Private Production Agent Operating Kit",
  summary: "Verified runtime examples",
  version: "2026.10.1",
  availability: "purchase_available",
  currency: "gbp",
  paymentModel: "managed_payments",
  unitAmountPence: 900,
  termsUrl: "https://agents.proofandstate.com/legal/kit-terms",
  licenceUrl: "https://agents.proofandstate.com/legal/kit-licence",
  refundUrl: "https://agents.proofandstate.com/legal/kit-refunds",
};
const live = { schemaVersion: 1, commerceActive: true, offers: [offer] };

describe("private-kit offer boundary", () => {
  it("accepts one authoritative live £9 GBP offer with legal links", () => {
    expect(parseKitCatalogue(live)).toEqual({ commerceActive: true, offer });
  });

  it("retains genuine global closure and planned availability", () => {
    const closed = {
      ...live,
      commerceActive: false,
      offers: [{ ...offer, availability: "planned", unitAmountPence: undefined }],
    };
    expect(parseKitCatalogue(closed).commerceActive).toBe(false);
    expect(parseKitCatalogue({ ...live, commerceActive: false }).commerceActive).toBe(false);
  });

  it("rejects contradictory or missing live price, currency and payment authority", () => {
    for (const changed of [
      { unitAmountPence: 800 },
      { unitAmountPence: undefined },
      { unitAmountPence: "900" },
      { currency: "usd" },
      { currency: undefined },
      { paymentModel: "card" },
      { paymentModel: undefined },
      { availability: "planned" },
    ]) {
      expect(() => parseKitCatalogue({ ...live, offers: [{ ...offer, ...changed }] })).toThrow();
    }
  });

  it("rejects missing, off-site or swapped legal destinations in live offers", () => {
    for (const changed of [
      { termsUrl: undefined },
      { licenceUrl: "https://example.invalid/legal/kit-licence" },
      { refundUrl: "javascript:alert(1)" },
      { termsUrl: offer.refundUrl },
    ]) {
      expect(() => parseKitCatalogue({ ...live, offers: [{ ...offer, ...changed }] })).toThrow();
    }
  });

  it("rejects unrecognised schema, missing/duplicate kit, and malformed offer shape", () => {
    for (const invalid of [
      {},
      { ...live, schemaVersion: 2 },
      { ...live, offers: [] },
      { ...live, offers: [offer, offer] },
      { ...live, offers: [{ ...offer, id: "other" }] },
      { ...live, offers: [null] },
      { ...live, offers: [42] },
    ]) {
      expect(() => parseKitCatalogue(invalid)).toThrow();
    }
  });
});
