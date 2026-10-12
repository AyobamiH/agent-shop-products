import { approvedOffer, CommerceFailure } from "./config";
import type { ApprovedOffer, CommerceEnv } from "./config";
import { assertBrowserOrigin, checkBodySize, claimTokenHash, newClaimToken } from "./crypto";
import { contractInsert, contractSnapshot } from "./contracts";
import { createStripeSession } from "./stripe";
import { applied, database, now, orderPattern, reply } from "./shared";

function offerOrFail(env: CommerceEnv, id: string): ApprovedOffer {
  const offer = approvedOffer(env, id);
  if (!offer) throw new CommerceFailure("OFFER_UNAVAILABLE", 409);
  return offer;
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

export async function checkout(request: Request, env: CommerceEnv, fetcher: typeof fetch): Promise<Response> {
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
  const snapshot = await contractSnapshot(approved, orderId, created);
  try {
    const createdRows = await db.batch([db.prepare(
      "INSERT INTO commerce_orders (id,offer_id,offer_version,currency,amount_pence,terms_version,state,claim_token_hash,idempotency_key,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(orderId, approved.id, approved.version, approved.currency, approved.unitAmountPence,
      approved.termsVersion, "creating", claimHash, nonce, created, created),
      contractInsert(db, orderId, created, snapshot)]);
    if (createdRows.some(row => row.success === false || row.meta?.changes !== 1)) {
      throw new CommerceFailure("COMMERCE_STORAGE_UNAVAILABLE", 503, true);
    }
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
    // Stripe can accept a session before our network receives its response.
    // A transport timeout/5xx is not proof that no Checkout Session exists.
    // Retain the creating row for signed-webhook reconciliation rather than
    // marking the order failed and permanently losing a paid customer event.
    const definiteRejection = error instanceof CommerceFailure && (
      error.code === "PAYMENT_PRICE_MISMATCH" ||
      (error.code === "PAYMENT_PROVIDER_ERROR" && !error.retryable)
    );
    if (definiteRejection) {
      await applied(db.prepare("UPDATE commerce_orders SET state='failed',updated_at=? WHERE id=? AND state='creating'")
        .bind(now(), orderId));
    }
    throw error;
  }
  await applied(db.prepare(
    "UPDATE commerce_orders SET state='checkout_open',checkout_session_id=?,checkout_url=?,updated_at=? WHERE id=? AND state='creating'"
  ).bind(session.id, session.url, now(), orderId), 1);
  // This high-entropy secret is returned once. Keep it in same-tab sessionStorage, never the Stripe URL.
  return reply({ orderId, checkoutUrl: session.url, claimToken, state: "checkout_open" }, 201);
}

