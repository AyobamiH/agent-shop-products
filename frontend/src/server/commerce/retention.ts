import type { CommerceD1 } from "./config";
import { CommerceFailure } from "./config";

const daysAgo = (date: Date, days: number) => new Date(date.getTime() - days * 86_400_000).toISOString();
export function retentionStatements(db: CommerceD1, date = new Date()) {
  const failed = "SELECT id FROM commerce_orders WHERE state='failed' AND checkout_session_id IS NULL AND payment_intent_id IS NULL AND updated_at<? AND NOT EXISTS (SELECT 1 FROM commerce_entitlements WHERE order_id=commerce_orders.id) AND NOT EXISTS (SELECT 1 FROM commerce_recovery_events WHERE order_id=commerce_orders.id) AND NOT EXISTS (SELECT 1 FROM commerce_contracts WHERE order_id=commerce_orders.id AND legal_hold=1)";
  return [
    db.prepare("DELETE FROM commerce_contracts WHERE order_id IN (" + failed + ")").bind(daysAgo(date, 30)),
    db.prepare("DELETE FROM commerce_orders WHERE id IN (" + failed + ")").bind(daysAgo(date, 30)),
    db.prepare("UPDATE commerce_orders SET checkout_url=NULL WHERE checkout_url IS NOT NULL AND state IN ('paid','revoked','failed') AND updated_at<?").bind(daysAgo(date, 2)),
    db.prepare("DELETE FROM commerce_webhook_events WHERE processed_at<?").bind(daysAgo(date, 90)),
    db.prepare("DELETE FROM commerce_attempt_limits WHERE expires_at<?").bind(Math.floor(date.getTime() / 1000)),
  ];
}
export async function runRetention(db: CommerceD1, date = new Date()) {
  if (!Number.isFinite(date.getTime())) throw new CommerceFailure("INVALID_RETENTION_DATE", 400);
  const results = await db.batch(retentionStatements(db, date));
  if (results.some(r => r.success === false)) throw new CommerceFailure("RETENTION_FAILED", 503);
  return results.map((r, index) => ({ operation: index, changed: r.meta?.changes ?? 0 }));
}
// Paid orders, immutable contracts, active licences and refund tombstones are
// never automatically deleted. Their recorded review date and legal holds must
// be assessed before minimisation; deleting them can break recovery or refunds.
