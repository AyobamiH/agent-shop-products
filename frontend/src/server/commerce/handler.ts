import { approvedOffer, CommerceFailure, publicOffers } from "./config";
import type { ApprovedOffer, CommerceD1, CommerceEnv } from "./config";
import { assertBrowserOrigin, checkBodySize, claimTokenHash, newClaimToken, verifyStripeSignature } from "./crypto";
import { createStripeSession, getStripeSession, verifyPaidSession } from "./stripe";

const PREFIX = "/api/v1/commerce/";
const orderPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const eventPattern = /^evt_[A-Za-z0-9]{8,}$/;
const sessionPattern = /^cs_(?:test_|live_)[A-Za-z0-9]{10,}$/;
const intentPattern = /^pi_[A-Za-z0-9]{8,}$/;
const headers = {
  "Cache-Control": "no-store, private",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
const now = () => new Date().toISOString();

type Order = {
  id: string; offer_id: string; offer_version: string; state: string;
  currency: string; amount_pence: number; terms_version: string;
  claim_token_hash: string; checkout_session_id: string; payment_intent_id: string | null;
};
type Entitlement = { state: string; object_key: string };

function reply(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, ...extra } });
}
function methodNotAllowed(allowed: string): Response {
  return reply({ error: "METHOD_NOT_ALLOWED" }, 405, { Allow: allowed });
}
function database(env: CommerceEnv): CommerceD1 {
  if (!env.COMMERCE_DB?.prepare || !env.COMMERCE_DB.batch) {
    throw new CommerceFailure("COMMERCE_STORAGE_UNAVAILABLE", 503, true);
  }
  return env.COMMERCE_DB;
}
function offerOrFail(env: CommerceEnv, id: string): ApprovedOffer {
  const offer = approvedOffer(env, id);
  if (!offer) throw new CommerceFailure("OFFER_UNAVAILABLE", 409);
  return offer;
}
async function applied(
  statement: ReturnType<CommerceD1["prepare"]>, expectedChanges?: number,
): Promise<void> {
  const result = await statement.run();
  if (result.success === false ||
      (expectedChanges !== undefined && result.meta?.changes !== expectedChanges)) {
    throw new CommerceFailure("COMMERCE_STORAGE_UNAVAILABLE", 503, true);
  }
}
function verifyClientJSON(input: unknown): { offerId: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new CommerceFailure("INVALID_REQUEST", 400);
  const body = input as Record<string, unknown>;
  if (Object.keys(body).length !== 1 || typeof body["offerId"] !== "string" ||
      body["offerId"].length > 100 || !/^[a-z0-9-]+$/.test(body["offerId"])) {
    throw new CommerceFailure("INVALID_REQUEST", 400);
  }
  return { offerId: body["offerId"] };
}
async function rateLimit(request: Request, env: CommerceEnv): Promise<void> {
  if (!env.COMMERCE_RATE_LIMITER?.limit) throw new CommerceFailure("RATE_LIMIT_UNAVAILABLE", 503, true);
  const ip = request.headers.get("cf-connecting-ip") || "unattributed";
  const result = await env.COMMERCE_RATE_LIMITER.limit({ key: "commerce-checkout:" + ip });
  if (!result.success) throw new CommerceFailure("RATE_LIMITED", 429, true);
}

async function checkout(request: Request, env: CommerceEnv, fetcher: typeof fetch): Promise<Response> {
  assertBrowserOrigin(request);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new CommerceFailure("UNSUPPORTED_MEDIA", 415);
  }
  checkBodySize(request, 4096);
  const payload = await request.text();
  if (payload.length > 4096) throw new CommerceFailure("PAYLOAD_TOO_LARGE", 413);
  let input: unknown;
  try { input = JSON.parse(payload); }
  catch { throw new CommerceFailure("INVALID_JSON", 400); }
  const body = verifyClientJSON(input);
  const nonce = request.headers.get("idempotency-key") || "";
  if (!orderPattern.test(nonce)) throw new CommerceFailure("IDEMPOTENCY_KEY_REQUIRED", 400);
  const approved = offerOrFail(env, body["offerId"]);
  const db = database(env);
  await rateLimit(request, env);
  // No checkout URL is created or exposed until private content availability is verified.
  if (!await env.PRIVATE_KITS!.head(approved.assetKey)) {
    throw new CommerceFailure("PRIVATE_ASSET_UNAVAILABLE", 503, true);
  }
  const orderId = crypto.randomUUID();
  const claimToken = newClaimToken();
  const claimHash = await claimTokenHash(claimToken);
  const created = now();
  try {
    await applied(db.prepare(
      "INSERT INTO commerce_orders (id,offer_id,offer_version,currency,amount_pence,terms_version,state,claim_token_hash,idempotency_key,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(orderId, approved.id, approved.version, approved.currency, approved.unitAmountPence,
      approved.termsVersion, "creating", claimHash, nonce, created, created), 1);
  } catch (error) {
    // Unique idempotency collisions never create a second Stripe checkout.
    if (String(error).includes("UNIQUE") || String(error).includes("constraint")) {
      throw new CommerceFailure("CHECKOUT_ALREADY_REQUESTED", 409);
    }
    throw error;
  }
  let session;
  try {
    session = await createStripeSession(env, approved, orderId, fetcher);
  } catch (error) {
    await applied(db.prepare("UPDATE commerce_orders SET state='failed',updated_at=? WHERE id=? AND state='creating'")
      .bind(now(), orderId));
    throw error;
  }
  await applied(db.prepare(
    "UPDATE commerce_orders SET state='checkout_open',checkout_session_id=?,checkout_url=?,updated_at=? WHERE id=? AND state='creating'"
  ).bind(session.id, session.url, now(), orderId), 1);
  // This high-entropy secret is returned once. Keep it in same-tab sessionStorage, never the Stripe URL.
  return reply({ orderId, checkoutUrl: session.url, claimToken, state: "checkout_open" }, 201);
}

function bearer(request: Request): string {
  const value = request.headers.get("authorization") || "";
  const match = /^Bearer ([A-Za-z0-9_-]{40,90})$/.exec(value);
  if (!match) throw new CommerceFailure("AUTHORIZATION_REQUIRED", 401);
  return match[1]!;
}
async function authorisedOrder(request: Request, env: CommerceEnv, orderId: string): Promise<Order> {
  if (!orderPattern.test(orderId)) throw new CommerceFailure("NOT_FOUND", 404);
  const token = bearer(request);
  const db = database(env);
  const row = await db.prepare("SELECT * FROM commerce_orders WHERE id=?").bind(orderId).first<Order>();
  // Deliberately use the same client response for missing orders and wrong bearers.
  if (!row || (await claimTokenHash(token)) !== row.claim_token_hash) {
    throw new CommerceFailure("NOT_FOUND", 404);
  }
  return row;
}
async function orderStatus(request: Request, env: CommerceEnv, id: string): Promise<Response> {
  const order = await authorisedOrder(request, env, id);
  const entitlement = await database(env).prepare(
    "SELECT state,object_key FROM commerce_entitlements WHERE order_id=?"
  ).bind(order.id).first<Entitlement>();
  return reply({
    orderId: order.id,
    state: order.state,
    fulfilment: order.state === "paid" && entitlement?.state === "active" ? "available" : "unavailable",
  });
}
async function download(request: Request, env: CommerceEnv, id: string): Promise<Response> {
  const order = await authorisedOrder(request, env, id);
  const db = database(env);
  const ent = await db.prepare(
    "SELECT state,object_key FROM commerce_entitlements WHERE order_id=?"
  ).bind(order.id).first<Entitlement>();
  if (order.state !== "paid" || ent?.state !== "active") throw new CommerceFailure("DELIVERY_NOT_AVAILABLE", 409);
  const offer = approvedOffer(env, order.offer_id);
  if (!offer || offer.version !== order.offer_version || ent.object_key !== offer.assetKey) {
    throw new CommerceFailure("DELIVERY_CONFIGURATION_UNAVAILABLE", 503, true);
  }
  const file = await env.PRIVATE_KITS!.get(ent.object_key);
  if (!file?.body) throw new CommerceFailure("DELIVERY_NOT_AVAILABLE", 503, true);
  await applied(db.prepare(
    "UPDATE commerce_entitlements SET last_download_at=? WHERE order_id=? AND state='active'"
  ).bind(now(), order.id));
  return new Response(file.body, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=\"private-agent-execution-kit.zip\"",
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
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
  const order = await db.prepare("SELECT * FROM commerce_orders WHERE checkout_session_id=?")
    .bind(sessionId).first<Order>();
  if (!order) {
    // A webhook can race checkout-session persistence. Retry rather than silently
    // losing a legitimate paid event; ignore only proven unrelated sessions.
    const ref = data?.["client_reference_id"];
    if (typeof ref === "string" && orderPattern.test(ref)) {
      const creating = await db.prepare("SELECT id,state FROM commerce_orders WHERE id=?")
        .bind(ref).first<{ id: string; state: string }>();
      if (creating?.state === "creating") {
        throw new CommerceFailure("ORDER_PENDING_RECONCILIATION", 503, true);
      }
    }
    await applied(recordEvent);
    return;
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
  const approved = offerOrFail(env, order.offer_id);
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

async function webhook(request: Request, env: CommerceEnv, fetcher: typeof fetch): Promise<Response> {
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

export async function handleCommerceRequest(
  request: Request, env: CommerceEnv,
  fetcher: typeof fetch = fetch,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (!path.startsWith(PREFIX)) return null;
  const requestId = crypto.randomUUID();
  try {
    if (path === PREFIX + "offers") {
      if (request.method !== "GET") return methodNotAllowed("GET");
      return reply({ schemaVersion: 1, offers: publicOffers(env), commerceActive: Boolean(publicOffers(env).some((o) => o["availability"] === "purchase_available")) });
    }
    if (path === PREFIX + "checkout") {
      if (request.method !== "POST") return methodNotAllowed("POST");
      return await checkout(request, env, fetcher);
    }
    if (path === PREFIX + "stripe-webhook") {
      if (request.method !== "POST") return methodNotAllowed("POST");
      return await webhook(request, env, fetcher);
    }
    const status = /^\/api\/v1\/commerce\/orders\/([^/]+)$/.exec(path);
    if (status) {
      if (request.method !== "GET") return methodNotAllowed("GET");
      return await orderStatus(request, env, status[1]!);
    }
    const asset = /^\/api\/v1\/commerce\/download\/([^/]+)$/.exec(path);
    if (asset) {
      if (request.method !== "GET") return methodNotAllowed("GET");
      return await download(request, env, asset[1]!);
    }
    return reply({ error: "NOT_FOUND" }, 404);
  } catch (error) {
    const failure = error instanceof CommerceFailure
      ? error : new CommerceFailure("COMMERCE_DEPENDENCY_ERROR", 503, true);
    // Only a bounded code and correlation ID are logged. No tokens, buyer details, Stripe bodies or secrets.
    console.error(JSON.stringify({ event: "commerce_api_failure", code: failure.code, requestId }));
    return reply({ error: failure.code, requestId, retryable: failure.retryable }, failure.status,
      failure.status === 429 ? { "Retry-After": "60" } : {});
  }
}
