import type { ApprovedOffer, CommerceEnv } from "./config";
import { CommerceFailure } from "./config";

export type StripeSession = {
  id: string; url?: string | null; livemode?: boolean; mode?: string;
  payment_status?: string; currency?: string | null; amount_total?: number | null;
  amount_subtotal?: number | null;
  automatic_tax?: { enabled?: boolean; status?: string | null } | null;
  total_details?: { amount_tax?: number | null; amount_discount?: number | null; amount_shipping?: number | null } | null;
  client_reference_id?: string | null; metadata?: Record<string, string>;
  payment_intent?: string | { id?: string } | null;
  line_items?: { data?: Array<{ price?: { id?: string }; quantity?: number }> };
};

async function stripeRequest(
  key: string, path: string, options: { method?: string; body?: URLSearchParams; idempotencyKey?: string } = {},
  fetcher: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  const headers = new Headers({ Authorization: "Bearer " + key });
  if (options.body) headers.set("Content-Type", "application/x-www-form-urlencoded");
  if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);
  let response: Response;
  try {
    response = await fetcher("https://api.stripe.com/v1" + path, {
      method: options.method || "GET", headers,
      ...(options.body ? { body: options.body.toString() } : {}),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new CommerceFailure("PAYMENT_PROVIDER_UNAVAILABLE", 503, true);
  }
  let value: Record<string, unknown>;
  try {
    const raw = await response.text();
    if (raw.length > 131_072) throw new Error("oversized Stripe payload");
    value = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new CommerceFailure("PAYMENT_PROVIDER_BAD_RESPONSE", 502, true);
  }
  if (!response.ok) {
    // Fail closed. No provider response body, customer metadata or secrets returned to clients.
    throw new CommerceFailure("PAYMENT_PROVIDER_ERROR", response.status === 429 || response.status >= 500 ? 503 : 502, response.status >= 500 || response.status === 429);
  }
  return value;
}

export async function verifyStripePrice(
  env: CommerceEnv, offer: ApprovedOffer, fetcher: typeof fetch = fetch,
): Promise<void> {
  // A price ID is not a verified amount. Check the Stripe-owned Price before
  // creating Checkout so misconfigured offers cannot overcharge a buyer.
  const price = await stripeRequest(
    env.STRIPE_SECRET_KEY!, "/prices/" + encodeURIComponent(offer.priceId), {}, fetcher,
  );
  if (
    price["id"] !== offer.priceId ||
    price["livemode"] !== (offer.mode === "live") ||
    price["active"] !== true ||
    price["currency"] !== offer.currency ||
    price["unit_amount"] !== offer.unitAmountPence ||
    price["type"] !== "one_time" ||
    price["tax_behavior"] !== "exclusive" ||
    (price["recurring"] !== null && price["recurring"] !== undefined)
  ) throw new CommerceFailure("PAYMENT_PRICE_MISMATCH", 409);
}

export async function createStripeSession(
  env: CommerceEnv, offer: ApprovedOffer, orderId: string, fetcher: typeof fetch = fetch,
): Promise<{ id: string; url: string }> {
  await verifyStripePrice(env, offer, fetcher);
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": offer.priceId,
    "line_items[0][quantity]": "1",
    // Stripe Checkout now derives allowed payment methods from the merchant's
    // Dashboard configuration. Legacy `payment_method_types` rejects sessions
    // on Stripe's current 2026 API. Keep the policy on the merchant side.
    "client_reference_id": orderId,
    "metadata[agent_shop_order_id]": orderId,
    "metadata[offer_id]": offer.id,
    "metadata[offer_version]": offer.version,
    "metadata[terms_version]": offer.termsVersion,
    "success_url": "https://agents.proofandstate.com/private-kits/complete?session_id={CHECKOUT_SESSION_ID}",
    "cancel_url": "https://agents.proofandstate.com/private-kits?checkout=cancelled",
    "billing_address_collection": "required",
    // Requires an owner-approved Stripe Tax configuration. Fails closed if unavailable.
    "automatic_tax[enabled]": "true",
  });
  const result = await stripeRequest(env.STRIPE_SECRET_KEY!, "/checkout/sessions", {
    method: "POST", body, idempotencyKey: "agent-shop-v1-" + orderId,
  }, fetcher);
  const session = result as StripeSession;
  let destination: URL;
  try { destination = new URL(session.url || ""); }
  catch { throw new CommerceFailure("PAYMENT_PROVIDER_BAD_RESPONSE", 502); }
  if (!/^cs_(?:test_|live_)[A-Za-z0-9]{10,}$/.test(session.id) ||
      destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com" ||
      session.livemode !== (offer.mode === "live") ||
      (session.client_reference_id && session.client_reference_id !== orderId)) {
    throw new CommerceFailure("PAYMENT_PROVIDER_BAD_RESPONSE", 502);
  }
  return { id: session.id, url: destination.toString() };
}

export async function getStripeSession(
  env: CommerceEnv, sessionId: string, fetcher: typeof fetch = fetch,
): Promise<StripeSession> {
  if (!/^cs_(?:test_|live_)[A-Za-z0-9]{10,}$/.test(sessionId)) {
    throw new CommerceFailure("INVALID_PAYMENT_REFERENCE", 400);
  }
  return await stripeRequest(env.STRIPE_SECRET_KEY!, "/checkout/sessions/" +
    encodeURIComponent(sessionId) + "?expand%5B%5D=line_items", {}, fetcher) as StripeSession;
}

export function verifyPaidSession(
  session: StripeSession, offer: ApprovedOffer,
  order: { id: string; checkout_session_id: string; amount_pence: number; currency: string; offer_id: string; offer_version: string },
): string {
  if (
    session.id !== order.checkout_session_id ||
    session.client_reference_id !== order.id ||
    session.mode !== "payment" ||
    session.livemode !== (offer.mode === "live") ||
    session.payment_status !== "paid" ||
    // Checkout must have actually completed Stripe Tax calculation; a 0 tax
    // result is acceptable, but disabled or unresolved automatic tax is not.
    session.automatic_tax?.enabled !== true ||
    session.automatic_tax.status !== "complete" ||
    session.currency !== offer.currency ||
    // Stripe Tax can add tax on top of the approved GBP base amount. Reconcile
    // the original line subtotal AND the exact tax-inclusive charged total.
    session.amount_subtotal !== offer.unitAmountPence ||
    !Number.isSafeInteger(session.total_details?.amount_tax) ||
    Number(session.total_details?.amount_tax) < 0 ||
    session.total_details?.amount_discount !== 0 ||
    session.total_details?.amount_shipping !== 0 ||
    session.amount_total !== offer.unitAmountPence + Number(session.total_details.amount_tax) ||
    order.amount_pence !== offer.unitAmountPence ||
    order.currency !== offer.currency ||
    order.offer_id !== offer.id ||
    order.offer_version !== offer.version ||
    session.metadata?.["agent_shop_order_id"] !== order.id ||
    session.metadata?.["offer_id"] !== offer.id ||
    session.metadata?.["offer_version"] !== offer.version ||
    session.line_items?.data?.length !== 1 ||
    session.line_items.data[0]?.price?.id !== offer.priceId ||
    session.line_items.data[0]?.quantity !== 1
  ) throw new CommerceFailure("PAYMENT_RECONCILIATION_FAILED", 409);
  const intent = session.payment_intent;
  const id = typeof intent === "string" ? intent : intent?.id;
  if (!id || !/^pi_[A-Za-z0-9]+$/.test(id)) throw new CommerceFailure("PAYMENT_RECONCILIATION_FAILED", 409);
  return id;
}
