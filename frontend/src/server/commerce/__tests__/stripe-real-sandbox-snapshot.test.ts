import { describe, expect, it } from "vitest";
import provider from "./fixtures/stripe-real-sandbox-20261010.json";
import { verifyPaidSession } from "../stripe";
import type { ApprovedOffer } from "../config";

// Provider-shaped, anonymised test-mode evidence: the real Stripe account
// returned a paid Checkout Session with this price and an associated test
// refund. IDs and any buyer information are substituted before committing.
const offer = {
  id: "private-production-agent-operating-kit",
  version: "2026.10.1",
  priceId: "price_1UOoeoGbPfXt7ec5mf0iN5OQ",
  unitAmountPence: 4900,
  currency: "gbp",
  mode: "test",
} as ApprovedOffer;
const record = {
  id: provider.session.client_reference_id,
  checkout_session_id: provider.session.id,
  amount_pence: 4900,
  currency: "gbp",
  offer_id: offer.id,
  offer_version: offer.version,
};

describe("2026-10-10 authentic Stripe test-mode provider-shape acceptance", () => {
  it("reconciles the actually paid, tax-complete Agent Shop test Price", () => {
    expect(provider.evidence.realProviderTestMode).toBe(true);
    expect(provider.evidence.realMoneyMoved).toBe(false);
    expect(provider.session.status).toBe("complete");
    expect(provider.session.automatic_tax.enabled).toBe(true);
    expect(provider.session.automatic_tax.status).toBe("complete");
    expect(verifyPaidSession(provider.session, offer, record))
      .toBe(provider.session.payment_intent);
  });

  it("denies an event with incomplete tax despite a paid-looking status", () => {
    for (const automatic_tax of [
      { enabled: false, status: "complete" },
      { enabled: true, status: "requires_location_inputs" },
    ]) {
      expect(() => verifyPaidSession({
        ...provider.session, automatic_tax,
      }, offer, record)).toThrow("PAYMENT_RECONCILIATION_FAILED");
    }
  });

  it("denies forged currency, tax-inclusive total, price or live-mode metadata", () => {
    const malicious = [
      { currency: "usd" },
      { amount_total: 4901 },
      { amount_subtotal: 4899 },
      { livemode: true },
      { payment_status: "unpaid" },
      { line_items: { data: [{ price: { id: "price_not_the_approved_sku" }, quantity: 1 }] } },
      { metadata: { ...provider.session.metadata, offer_version: "999" } },
    ];
    for (const delta of malicious) {
      expect(() => verifyPaidSession({
        ...provider.session, ...delta,
      }, offer, record)).toThrow("PAYMENT_RECONCILIATION_FAILED");
    }
  });

  it("tracks the actual matching Stripe test refund as a separate revocation boundary", () => {
    expect(provider.refund.type).toBe("charge.refunded");
    expect(provider.refund.livemode).toBe(false);
    expect(provider.refund.object.payment_intent).toBe(provider.session.payment_intent);
    expect(provider.refund.object.refunded).toBe(true);
    expect(provider.refund.object.amount_refunded).toBe(4900);
    // The provider refund record is not, alone, an entitlement mutation.
    // The signed webhook and D1 revocation remain separate acceptance steps.
  });
});
