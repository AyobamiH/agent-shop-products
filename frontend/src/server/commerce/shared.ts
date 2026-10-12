import { CommerceFailure } from "./config";
import type { CommerceD1, CommerceEnv } from "./config";
import { claimTokenHash } from "./crypto";

export const orderPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const headers = {
  "Cache-Control": "no-store, private",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
export const now = () => new Date().toISOString();

export type Order = {
  id: string; offer_id: string; offer_version: string; state: string;
  currency: string; amount_pence: number; terms_version: string;
  claim_token_hash: string; checkout_session_id: string; payment_intent_id: string | null;
};
export type Entitlement = { state: string; object_key: string; offer_id: string; offer_version: string };

export function reply(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, ...extra } });
}
export function methodNotAllowed(allowed: string): Response {
  return reply({ error: "METHOD_NOT_ALLOWED" }, 405, { Allow: allowed });
}
export function database(env: CommerceEnv): CommerceD1 {
  if (!env.COMMERCE_DB?.prepare || !env.COMMERCE_DB.batch) {
    throw new CommerceFailure("COMMERCE_STORAGE_UNAVAILABLE", 503, true);
  }
  return env.COMMERCE_DB;
}
export async function applied(
  statement: ReturnType<CommerceD1["prepare"]>, expectedChanges?: number,
): Promise<void> {
  const result = await statement.run();
  if (result.success === false ||
      (expectedChanges !== undefined && result.meta?.changes !== expectedChanges)) {
    throw new CommerceFailure("COMMERCE_STORAGE_UNAVAILABLE", 503, true);
  }
}
function bearer(request: Request): string {
  const value = request.headers.get("authorization") || "";
  const match = /^Bearer ([A-Za-z0-9_-]{40,90})$/.exec(value);
  if (!match) throw new CommerceFailure("AUTHORIZATION_REQUIRED", 401);
  return match[1]!;
}
export async function authorisedOrder(request: Request, env: CommerceEnv, orderId: string): Promise<Order> {
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
