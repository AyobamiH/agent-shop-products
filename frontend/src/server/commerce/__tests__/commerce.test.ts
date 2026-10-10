import { describe, expect, it, vi } from "vitest";
import { approvedOffer, publicOffers, settlementOffer } from "../config";
import type { CommerceEnv } from "../config";
import { claimTokenHash, newClaimToken, verifyStripeSignature } from "../crypto";
import { verifyPaidSession, verifyStripePrice } from "../stripe";
import { handleCommerceRequest } from "../handler";
import realIntroductorySession from "./fixtures/stripe-nine-pound-sandbox-20261010.json";

type Overrides = { [K in keyof CommerceEnv]?: CommerceEnv[K] | undefined };
function ready(overrides: Overrides = {}): CommerceEnv {
  return {
    COMMERCE_ENABLED: "true", COMMERCE_MODE: "test",
    COMMERCE_OFFER_APPROVAL: JSON.stringify({
      offerId: "private-production-agent-operating-kit", version: "2026.10.1",
      priceId: "price_123456789012", unitAmountPence: 900, currency: "gbp",
      termsVersion: "terms.v1", licenceVersion: "licence.v1",
      refundPolicyVersion: "refund.v1", commercialDecisionId: "approval.v1",
      termsUrl: "https://agents.proofandstate.com/legal/kit-terms",
      licenceUrl: "https://agents.proofandstate.com/legal/kit-licence",
      refundUrl: "https://agents.proofandstate.com/legal/kit-refunds",
    }),
    STRIPE_SECRET_KEY: "sk_test_example", STRIPE_WEBHOOK_SECRET: "whsec_example",
    COMMERCE_DB: { prepare: vi.fn(), batch: vi.fn() } as unknown as CommerceEnv["COMMERCE_DB"],
    PRIVATE_KITS: { head: vi.fn(), get: vi.fn() },
    COMMERCE_RATE_LIMITER: { limit: vi.fn() },
    ...overrides,
  } as CommerceEnv;
}
const KIT = "private-production-agent-operating-kit";
describe("Private kit gated commerce", () => {
  it("does not invent public prices or active checkout", () => {
    const offers = publicOffers({});
    expect(offers[0]).toMatchObject({ id: KIT, availability: "planned" });
    expect(offers[0]).not.toHaveProperty("unitAmountPence");
    expect(approvedOffer({}, KIT)).toBeNull();
  });
  it("requires explicit offer, legal, mode, storage, rate limit and live approval", () => {
    expect(approvedOffer(ready(), KIT)).toMatchObject({ mode: "test", unitAmountPence: 900 });
    expect(approvedOffer(ready({ COMMERCE_DB: undefined }), KIT)).toBeNull();
    expect(approvedOffer(ready({ PRIVATE_KITS: undefined }), KIT)).toBeNull();
    expect(approvedOffer(ready({ COMMERCE_RATE_LIMITER: undefined }), KIT)).toBeNull();
    expect(approvedOffer(ready({ STRIPE_SECRET_KEY: "sk_live_wrong" }), KIT)).toBeNull();
    expect(approvedOffer(ready({ STRIPE_SECRET_KEY: "rk_test_scoped_permissions" }), KIT))
      .toMatchObject({ mode: "test" });
    expect(approvedOffer(ready({ STRIPE_SECRET_KEY: "rk_live_wrong_mode" }), KIT)).toBeNull();
    expect(approvedOffer(ready({ COMMERCE_MODE: "live", STRIPE_SECRET_KEY: "sk_live_example" }), KIT)).toBeNull();
    expect(approvedOffer(ready({ COMMERCE_MODE: "live", STRIPE_SECRET_KEY: "sk_live_example",
      COMMERCE_LIVE_APPROVED: "yes:approval.v1" }), KIT)).toMatchObject({ mode: "live" });
    expect(approvedOffer(ready({ COMMERCE_OFFER_APPROVAL: "{broken" }), KIT)).toBeNull();
    const overpricedApproval = ready({
      COMMERCE_OFFER_APPROVAL: ready().COMMERCE_OFFER_APPROVAL!.replace('"unitAmountPence":900','"unitAmountPence":4900'),
    });
    // The old £49 engineering fixture is not permission to charge £49 live.
    expect(approvedOffer(overpricedApproval, KIT)).toBeNull();
    // But a historic signed £49 payment must remain individually settleable.
    expect(settlementOffer(overpricedApproval, KIT)?.unitAmountPence).toBe(4900);
  });
  it("does not misrepresent a genuine £9 Stripe test Checkout as paid before confirmation", () => {
    expect(realIntroductorySession.livemode).toBe(false);
    expect(realIntroductorySession.amount_subtotal).toBe(900);
    expect(realIntroductorySession.currency).toBe("gbp");
    expect(realIntroductorySession.line_items.data).toEqual([{
      price: { id: "price_1UOp7qGbPfXt7ec5XHftnGUj" }, quantity: 1,
    }]);
    expect(realIntroductorySession.status).toBe("open");
    expect(realIntroductorySession.payment_status).toBe("unpaid");
    expect(realIntroductorySession.payment_intent).toBeNull();
    expect(realIntroductorySession.automatic_tax.enabled).toBe(true);
    expect(realIntroductorySession.automatic_tax.status).toBe("requires_location_inputs");
  });
  it("issues distinct 256-bit claims and hashes", async () => {
    const a = newClaimToken(), b = newClaimToken();
    expect(a).not.toBe(b);
    expect(await claimTokenHash(a)).toMatch(/^[a-f0-9]{64}$/);
    expect(await claimTokenHash(a)).not.toBe(await claimTokenHash(b));
  });
  it("verifies raw Stripe HMAC with timestamp tolerance and tamper resistance", async () => {
    const secret = "whsec_example", body = '{"id":"evt_verified_1234"}', t = 1_800_000_000;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(t + "." + body));
    const hex = Array.from(new Uint8Array(mac), b => b.toString(16).padStart(2, "0")).join("");
    const header = "t=" + t + ",v1=" + hex;
    expect(await verifyStripeSignature(body, header, secret, t)).toBe(true);
    expect(await verifyStripeSignature(body + " ", header, secret, t)).toBe(false);
    expect(await verifyStripeSignature(body, header, secret, t + 301)).toBe(false);
    expect(await verifyStripeSignature(body, header + ",t=" + t, secret, t)).toBe(false);
    expect(await verifyStripeSignature(body, "t=" + t + ",v1=" + "f".repeat(64), secret, t)).toBe(false);
  });
  it("reconciles real payment status, price, amount, currency, intent and mode", () => {
    const offer = approvedOffer(ready(), KIT)!;
    const order = { id: "order-123", checkout_session_id: "cs_test_123456789012",
      offer_id: offer.id, offer_version: offer.version, amount_pence: 900, currency: "gbp" };
    const session = { id: order.checkout_session_id, client_reference_id: order.id, mode: "payment",
      livemode: false, payment_status: "paid", automatic_tax: { enabled: true, status: "complete" },
      amount_subtotal: 900,
      amount_total: 1080, total_details: { amount_tax: 180, amount_discount: 0, amount_shipping: 0 },
      currency: "gbp",
      payment_intent: "pi_123456789012",
      metadata: { agent_shop_order_id: order.id, offer_id: KIT, offer_version: offer.version },
      line_items: { data: [{ price: { id: offer.priceId }, quantity: 1 }] } };
    expect(verifyPaidSession(session, offer, order)).toBe("pi_123456789012");
    for (const bad of [
      { amount_total: 100 }, { payment_status: "unpaid" }, { livemode: true },
      { currency: "usd" }, { line_items: { data: [] } },
      { amount_subtotal: 800 }, { amount_total: 900 },
      { total_details: { amount_tax: 180, amount_discount: 100, amount_shipping: 0 } },
      { total_details: null },
      { automatic_tax: { enabled: false, status: "complete" } },
      { automatic_tax: { enabled: true, status: "requires_location_inputs" } },
    ]) expect(() => verifyPaidSession({ ...session, ...bad }, offer, order)).toThrow();
  });
  it("refuses Checkout when Stripe's actual price conflicts with approved displayed amount", async () => {
    const offer = approvedOffer(ready(), KIT)!;
    const provider = async () => new Response(JSON.stringify({
      id: offer.priceId, active: true, livemode: false, currency: "gbp",
      unit_amount: 9999, type: "one_time", recurring: null,
    }), { status: 200 });
    await expect(verifyStripePrice(ready(), offer, provider as typeof fetch))
      .rejects.toMatchObject({ code: "PAYMENT_PRICE_MISMATCH", status: 409 });
  });
  it("fails closed on unauthorised browser actions, forged Stripe events and success URLs", async () => {
    const offers = await handleCommerceRequest(new Request("https://agents.proofandstate.com/api/v1/commerce/offers"), {});
    expect(offers?.status).toBe(200);
    expect((await offers!.json()).commerceActive).toBe(false);
    const attempt = await handleCommerceRequest(new Request("https://agents.proofandstate.com/api/v1/commerce/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId: KIT }),
    }), {});
    expect(attempt?.status).toBe(403);
    const fake = await handleCommerceRequest(new Request("https://agents.proofandstate.com/api/v1/commerce/stripe-webhook", {
      method: "POST", headers: { "stripe-signature": "t=1800000000,v1=" + "a".repeat(64) }, body: "{}",
    }), { STRIPE_WEBHOOK_SECRET: "whsec_example" });
    expect(fake?.status).toBe(400);
    const fakeSuccess = await handleCommerceRequest(new Request(
      "https://agents.proofandstate.com/api/v1/commerce/orders/12345678-1234-1234-1234-123456789abc?session_id=cs_test_fake"
    ), {});
    expect(fakeSuccess?.status).toBe(401);
  });
});
