import { CommerceFailure, settlementOffer } from "./config";
import type { ApprovedOffer, CommerceEnv } from "./config";
import { checkBodySize, verifyStripeSignature } from "./crypto";
import { confirmContract } from "./contracts";
import { getStripeSession, verifyPaidSession } from "./stripe";
import { applied, database, now, orderPattern, reply } from "./shared";
import type { Entitlement, Order } from "./shared";

const eventPattern = /^evt_[A-Za-z0-9]{8,}$/;
const sessionPattern = /^cs_(?:test_|live_)[A-Za-z0-9]{10,}$/;
const intentPattern = /^pi_[A-Za-z0-9]{8,}$/;
function settlementOrFail(env: CommerceEnv, id: string): ApprovedOffer {
  const configured = settlementOffer(env, id);
  if (!configured) throw new CommerceFailure("ORDER_SETTLEMENT_CONFIGURATION_UNAVAILABLE", 503, true);
  return configured;
}
type StripeEvent = {
  id?: string; type?: string; livemode?: boolean;
  data?: { object?: Record<string, unknown> };
};
async function processWebhookEvent(event: StripeEvent, env: CommerceEnv, fetcher: typeof fetch): Promise<void> {
  if (!eventPattern.test(event.id || "") || typeof event.type !== "string") {
    throw new CommerceFailure("INVALID_EVENT", 400);
  }
  const db = database(env);
  const already = await db.prepare("SELECT event_id FROM commerce_webhook_events WHERE event_id=?")
    .bind(event.id).first();
  if (already) return;
  const type = event.type;
  const data = event.data?.object;
  const timestamp = now();
  const recordEvent = db.prepare(
    "INSERT OR IGNORE INTO commerce_webhook_events (event_id,type,processed_at) VALUES (?,?,?)"
  ).bind(event.id, type, timestamp);

  if (type === "charge.refunded") {
    const intent = data?.["payment_intent"];
    if (typeof intent !== "string" || !intentPattern.test(intent)) {
      // Signed Stripe events for unrelated transactions must not poison retries.
      await applied(recordEvent);
      return;
    }
    await db.batch([
      db.prepare("INSERT OR IGNORE INTO commerce_refunds (payment_intent_id,event_id,received_at) VALUES (?,?,?)")
        .bind(intent, event.id, timestamp),
      db.prepare("UPDATE commerce_orders SET state='revoked',updated_at=? WHERE payment_intent_id=? AND state IN ('paid','revoked')")
        .bind(timestamp, intent),
      db.prepare("UPDATE commerce_entitlements SET state='revoked',revoked_at=? WHERE order_id IN (SELECT id FROM commerce_orders WHERE payment_intent_id=?) AND state='active'")
        .bind(timestamp, intent),
      recordEvent,
    ]);
    return;
  }
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded",
         "checkout.session.async_payment_failed", "checkout.session.expired"].includes(type)) {
    await applied(recordEvent);
    return;
  }
  const sessionId = data?.["id"];
  if (typeof sessionId !== "string" || !sessionPattern.test(sessionId)) {
    throw new CommerceFailure("INVALID_EVENT", 400);
  }
  let order = await db.prepare("SELECT * FROM commerce_orders WHERE checkout_session_id=?")
    .bind(sessionId).first<Order>();
  if (!order) {
    // Stripe may complete a session after its API POST committed but before
    // our Worker received the Checkout URL. A signed webhook provides a hint,
    // not ownership proof: re-read Stripe's authoritative session, inspect the
    // complete offer linkage and atomically fence the originally creating row.
    const ref = data?.["client_reference_id"];
    if (typeof ref === "string" && orderPattern.test(ref)) {
      const creating = await db.prepare("SELECT * FROM commerce_orders WHERE id=?")
        .bind(ref).first<Order>();
      if (creating?.state === "creating" && !creating.checkout_session_id) {
        const approved = settlementOrFail(env, creating.offer_id);
        const provider = await getStripeSession(env, sessionId, fetcher);
        if (
          provider.client_reference_id !== creating.id ||
          provider.mode !== "payment" ||
          provider.livemode !== (approved.mode === "live") ||
          provider.currency !== approved.currency ||
          provider.amount_subtotal !== approved.unitAmountPence ||
          provider.metadata?.["agent_shop_order_id"] !== creating.id ||
          provider.metadata?.["offer_id"] !== approved.id ||
          provider.metadata?.["offer_version"] !== approved.version ||
          provider.line_items?.data?.length !== 1 ||
          provider.line_items.data[0]?.price?.id !== approved.priceId ||
          provider.line_items.data[0]?.quantity !== 1
        ) throw new CommerceFailure("PAYMENT_RECONCILIATION_FAILED", 409);
        await applied(db.prepare(
          "UPDATE commerce_orders SET state='checkout_open',checkout_session_id=?,updated_at=? WHERE id=? AND state='creating' AND checkout_session_id IS NULL",
        ).bind(sessionId, timestamp, creating.id), 1);
        order = await db.prepare("SELECT * FROM commerce_orders WHERE checkout_session_id=?")
          .bind(sessionId).first<Order>();
      } else if (creating?.state === "creating") {
        throw new CommerceFailure("ORDER_PENDING_RECONCILIATION", 503, true);
      }
    }
    if (!order) {
      // Foreign sessions cannot create entitlements or expose purchaser data.
      await applied(recordEvent);
      return;
    }
  }
  if (type === "checkout.session.async_payment_failed" || type === "checkout.session.expired") {
    await db.batch([
      db.prepare("UPDATE commerce_orders SET state='failed',updated_at=? WHERE id=? AND state='checkout_open'")
        .bind(timestamp, order.id),
      recordEvent,
    ]);
    return;
  }
  if (order.state === "creating" || order.state === "failed") {
    throw new CommerceFailure("ORDER_PENDING_RECONCILIATION", 503, true);
  }
  const approved = settlementOrFail(env, order.offer_id);
  const provider = await getStripeSession(env, sessionId, fetcher);
  if (provider.payment_status !== "paid") {
    await applied(recordEvent);
    return;
  }
  const intent = verifyPaidSession(provider, approved, order);
  if (event.livemode !== (approved.mode === "live")) throw new CommerceFailure("PAYMENT_RECONCILIATION_FAILED", 409);
  if (!await env.PRIVATE_KITS!.head(approved.assetKey)) {
    throw new CommerceFailure("PRIVATE_ASSET_UNAVAILABLE", 503, true);
  }
  // Stripe does not guarantee webhook order. A refund may arrive before the
  // matching paid-session event. Honour its tombstone rather than retrying
  // forever or temporarily granting a kit that was already refunded.
  const priorRefund = await db.prepare(
    "SELECT payment_intent_id FROM commerce_refunds WHERE payment_intent_id=?",
  ).bind(intent).first();
  if (priorRefund) {
    const revoked = await db.batch([
      confirmContract(db, order.id, provider.amount_total!, provider.total_details!.amount_tax!, timestamp),
      db.prepare("UPDATE commerce_orders SET state='revoked',payment_intent_id=?,updated_at=? WHERE id=? AND state IN ('checkout_open','paid','revoked')")
        .bind(intent, timestamp, order.id),
      db.prepare("UPDATE commerce_entitlements SET state='revoked',revoked_at=? WHERE order_id=? AND state='active'")
        .bind(timestamp, order.id),
    ]);
    if (revoked.some((row) => row.success === false)) {
      throw new CommerceFailure("COMMERCE_STORAGE_UNAVAILABLE", 503, true);
    }
    const finalOrder = await db.prepare("SELECT * FROM commerce_orders WHERE id=?")
      .bind(order.id).first<Order>();
    const finalEntitlement = await db.prepare("SELECT state,object_key FROM commerce_entitlements WHERE order_id=?")
      .bind(order.id).first<Entitlement>();
    if (finalOrder?.state !== "revoked" || finalOrder.payment_intent_id !== intent ||
        finalEntitlement?.state === "active") {
      throw new CommerceFailure("PAYMENT_RECONCILIATION_FAILED", 503, true);
    }
    await applied(recordEvent);
    return;
  }
  // The state transition + entitlement are one atomic D1 batch. Record the
  // event only AFTER verifying both durable readbacks; failed transitions stay
  // retryable instead of being silently acknowledged.
  const results = await db.batch([
    confirmContract(db, order.id, provider.amount_total!, provider.total_details!.amount_tax!, timestamp),
    db.prepare("UPDATE commerce_orders SET state='paid',payment_intent_id=?,updated_at=? WHERE id=? AND state IN ('checkout_open','paid') AND NOT EXISTS (SELECT 1 FROM commerce_refunds WHERE payment_intent_id=?)")
      .bind(intent, timestamp, order.id, intent),
    db.prepare("INSERT OR IGNORE INTO commerce_entitlements (order_id,offer_id,offer_version,object_key,state,issued_at) SELECT ?,?,?,?,'active',? WHERE NOT EXISTS (SELECT 1 FROM commerce_refunds WHERE payment_intent_id=?) AND EXISTS (SELECT 1 FROM commerce_orders WHERE id=? AND state='paid')")
      .bind(order.id, approved.id, approved.version, approved.assetKey, timestamp, intent, order.id),
  ]);
  if (results.some((result) => result.success === false)) {
    throw new CommerceFailure("COMMERCE_STORAGE_UNAVAILABLE", 503, true);
  }
  const storedOrder = await db.prepare("SELECT * FROM commerce_orders WHERE id=?").bind(order.id).first<Order>();
  const entitlement = await db.prepare("SELECT state,object_key FROM commerce_entitlements WHERE order_id=?")
    .bind(order.id).first<Entitlement>();
  const refund = await db.prepare("SELECT payment_intent_id FROM commerce_refunds WHERE payment_intent_id=?")
    .bind(intent).first();
  if (refund) {
    if (storedOrder?.state !== "revoked" || entitlement?.state === "active") {
      throw new CommerceFailure("PAYMENT_RECONCILIATION_FAILED", 503, true);
    }
  } else if (
    storedOrder?.state !== "paid" || storedOrder.payment_intent_id !== intent ||
    entitlement?.state !== "active" || entitlement.object_key !== approved.assetKey
  ) {
    throw new CommerceFailure("PAYMENT_RECONCILIATION_FAILED", 503, true);
  }
  await applied(recordEvent);
}

export async function webhook(request: Request, env: CommerceEnv, fetcher: typeof fetch): Promise<Response> {
  checkBodySize(request, 65_536);
  const payload = await request.text();
  if (new TextEncoder().encode(payload).length > 65_536) throw new CommerceFailure("PAYLOAD_TOO_LARGE", 413);
  if (!env.STRIPE_WEBHOOK_SECRET) throw new CommerceFailure("WEBHOOK_NOT_CONFIGURED", 503, true);
  if (!await verifyStripeSignature(payload, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET)) {
    throw new CommerceFailure("INVALID_SIGNATURE", 400);
  }
  let event: StripeEvent;
  try { event = JSON.parse(payload) as StripeEvent; }
  catch { throw new CommerceFailure("INVALID_JSON", 400); }
  await processWebhookEvent(event, env, fetcher);
  return reply({ received: true });
}

