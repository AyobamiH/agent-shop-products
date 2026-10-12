import { POLICY_VERSION } from "../../../domain/commerce/policies";
import { handleCommerceRequest } from "../handler";
import type { CommerceEnv } from "../config";
import { sqliteFixture } from "./sqlite";

export const API = "https://agents.proofandstate.com/api/v1/commerce/";
export const KIT = "private-production-agent-operating-kit";
export function buyerFixture() {
  const { native, db } = sqliteFixture();
  let currentId = "";
  let sessionId = "cs_test_123456789012345";
  const intentId = "pi_123456789012345";
  const env: CommerceEnv = {
    COMMERCE_ENABLED: "true", COMMERCE_MODE: "test",
    COMMERCE_OFFER_APPROVAL: JSON.stringify({
      offerId: KIT, version: "2026.10.1", priceId: "price_123456789012",
      unitAmountPence: 900, currency: "gbp", termsVersion: POLICY_VERSION,
      licenceVersion: POLICY_VERSION, refundPolicyVersion: POLICY_VERSION,
      commercialDecisionId: "approval.v1",
      termsUrl: "https://agents.proofandstate.com/legal/kit-terms",
      licenceUrl: "https://agents.proofandstate.com/legal/kit-licence",
      refundUrl: "https://agents.proofandstate.com/legal/kit-refunds",
    }),
    STRIPE_SECRET_KEY: "rk_test_synthetic", STRIPE_WEBHOOK_SECRET: "whsec_synthetic",
    COMMERCE_DB: db, COMMERCE_RATE_LIMITER: { async limit() { return { success: true }; } },
    PRIVATE_KITS: { async head() { return {}; }, async get() { return { body: new Response("kit").body! }; } },
  };
  const provider = (async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.includes("/prices/")) return Response.json({
      id: "price_123456789012", active: true, currency: "gbp", unit_amount: 900,
      type: "one_time", tax_behavior: "exclusive", recurring: null, livemode: false,
    });
    if (init?.method === "POST") {
      currentId = new URLSearchParams(String(init.body)).get("client_reference_id")!;
      sessionId = "cs_test_" + currentId.replaceAll("-", "");
    }
    return Response.json({
      id: sessionId, url: "https://checkout.stripe.com/pay/" + sessionId,
      client_reference_id: currentId, livemode: false, mode: "payment", payment_status: "paid",
      currency: "gbp", amount_subtotal: 900, amount_total: 1080,
      total_details: { amount_tax: 180, amount_discount: 0, amount_shipping: 0 },
      automatic_tax: { enabled: true, status: "complete" }, payment_intent: intentId,
      metadata: { agent_shop_order_id: currentId, offer_id: KIT, offer_version: "2026.10.1" },
      line_items: { data: [{ price: { id: "price_123456789012" }, quantity: 1 }] },
      customer_details: { email: "buyer@example.invalid" },
    });
  }) as typeof fetch;
  async function create() {
    const result = await handleCommerceRequest(new Request(API + "checkout", {
      method: "POST", headers: { origin: "https://agents.proofandstate.com",
        "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
      body: JSON.stringify({ offerId: KIT }),
    }), env, provider);
    if (result?.status !== 201) throw new Error(await result?.text());
    return await result.json() as { orderId: string; claimToken: string };
  }
  async function event(type = "checkout.session.completed") {
    const object = type === "charge.refunded" ? { payment_intent: intentId } : { id: sessionId, client_reference_id: currentId };
    const payload = JSON.stringify({ id: "evt_" + crypto.randomUUID().replaceAll("-", ""), type, livemode: false, data: { object } });
    const t = Math.floor(Date.now() / 1000);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET!),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(t + "." + payload)));
    const signature = Array.from(mac, b => b.toString(16).padStart(2, "0")).join("");
    return handleCommerceRequest(new Request(API + "stripe-webhook", {
      method: "POST", headers: { "stripe-signature": "t=" + t + ",v1=" + signature }, body: payload,
    }), env, provider);
  }
  const request = (path: string, claim: string) => handleCommerceRequest(new Request(API + path,
    { headers: { Authorization: "Bearer " + claim } }), env);
  return { native, db, env, provider, create, event, request };
}
