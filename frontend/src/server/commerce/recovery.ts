// Owner-only operation. Deliberately not routed through the public HTTP handler.
import { CommerceFailure } from "./config";
import type { CommerceEnv } from "./config";
import { claimTokenHash, newClaimToken } from "./crypto";
import { database, now, orderPattern } from "./shared";
import type { Order } from "./shared";
import { getStripeSession } from "./stripe";

export type RecoveryEvidence = {
  requestId: string; orderId: string; customerEmail: string;
  verifiedCustomerControl: true;
};
export async function recoverOrderAccess(env: CommerceEnv, evidence: RecoveryEvidence,
  fetcher: typeof fetch = fetch): Promise<{ orderId: string; claimToken: string }> {
  if (!["test", "live"].includes(env.COMMERCE_MODE || "")) throw new CommerceFailure("RECOVERY_MODE_REQUIRED", 400);
  if (!orderPattern.test(evidence.requestId) || !orderPattern.test(evidence.orderId) ||
      evidence.verifiedCustomerControl !== true || !evidence.customerEmail ||
      evidence.customerEmail.length > 254) throw new CommerceFailure("RECOVERY_EVIDENCE_REQUIRED", 400);
  const db = database(env);
  const existing = await db.prepare("SELECT id FROM commerce_recovery_events WHERE id=?").bind(evidence.requestId).first();
  if (existing) throw new CommerceFailure("RECOVERY_ALREADY_APPLIED", 409);
  const order = await db.prepare("SELECT * FROM commerce_orders WHERE id=?").bind(evidence.orderId).first<Order>();
  if (!order || order.state !== "paid" || !order.checkout_session_id || !order.payment_intent_id) {
    throw new CommerceFailure("RECOVERY_UNAVAILABLE", 409);
  }
  const session = await getStripeSession(env, order.checkout_session_id, fetcher);
  const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const email = session.customer_details?.email;
  if (session.id !== order.checkout_session_id || session.client_reference_id !== order.id ||
      session.payment_status !== "paid" || intent !== order.payment_intent_id ||
      session.livemode !== (env.COMMERCE_MODE === "live") ||
      !email || email.toLowerCase() !== evidence.customerEmail.trim().toLowerCase()) {
    throw new CommerceFailure("RECOVERY_IDENTITY_MISMATCH", 403);
  }
  const claimToken = newClaimToken(), newHash = await claimTokenHash(claimToken);
  // Audit insert and conditional token rotation are atomic. A concurrent refund
  // or another recovery prevents the old claim compare-and-swap from succeeding.
  const results = await db.batch([
    db.prepare("INSERT INTO commerce_recovery_events (id,order_id,old_claim_hash,new_claim_hash,verified_at,method) SELECT ?,id,claim_token_hash,?,?,'owner_verified_stripe_customer' FROM commerce_orders WHERE id=? AND state='paid' AND claim_token_hash=? AND EXISTS (SELECT 1 FROM commerce_entitlements WHERE order_id=? AND state='active') AND NOT EXISTS (SELECT 1 FROM commerce_refunds WHERE payment_intent_id=?)")
      .bind(evidence.requestId, newHash, now(), order.id, order.claim_token_hash, order.id, order.payment_intent_id),
    db.prepare("UPDATE commerce_orders SET claim_token_hash=? WHERE id=? AND state='paid' AND claim_token_hash=? AND EXISTS (SELECT 1 FROM commerce_recovery_events WHERE id=? AND new_claim_hash=?)")
      .bind(newHash, order.id, order.claim_token_hash, evidence.requestId, newHash),
  ]);
  if (results.some(r => r.success === false || r.meta?.changes !== 1)) throw new CommerceFailure("RECOVERY_CONFLICT", 409);
  const stored = await db.prepare("SELECT * FROM commerce_orders WHERE id=?").bind(order.id).first<Order>();
  if (stored?.state !== "paid" || stored.claim_token_hash !== newHash) throw new CommerceFailure("RECOVERY_CONFLICT", 409);
  return { orderId: order.id, claimToken };
}
