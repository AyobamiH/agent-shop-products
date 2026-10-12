import { readContract } from "./contracts";
import { CommerceFailure, recordedDeliveryKey } from "./config";
import type { CommerceEnv } from "./config";
import { applied, authorisedOrder, database, now, reply } from "./shared";
import type { Entitlement } from "./shared";

export async function orderStatus(request: Request, env: CommerceEnv, id: string): Promise<Response> {
  const order = await authorisedOrder(request, env, id);
  const entitlement = await database(env).prepare(
    "SELECT state,object_key,offer_id,offer_version FROM commerce_entitlements WHERE order_id=?"
  ).bind(order.id).first<Entitlement>();
  const contract = await readContract(database(env), order.id);
  return reply({
    orderId: order.id,
    state: order.state,
    purchaseRecordAvailable: !!contract?.confirmed_at,
    purchaseRecordSaved: !!contract?.document_accessed_at,
    fulfilment: order.state === "paid" && entitlement?.state === "active" ? "available" : "unavailable",
  });
}
export async function download(request: Request, env: CommerceEnv, id: string): Promise<Response> {
  const order = await authorisedOrder(request, env, id);
  const db = database(env);
  const ent = await db.prepare(
    "SELECT state,object_key,offer_id,offer_version FROM commerce_entitlements WHERE order_id=?"
  ).bind(order.id).first<Entitlement>();
  if (order.state !== "paid" || ent?.state !== "active") throw new CommerceFailure("DELIVERY_NOT_AVAILABLE", 409);
  const contract = await readContract(db, order.id);
  if (contract && !contract.document_accessed_at) throw new CommerceFailure("PURCHASE_RECORD_REQUIRED", 409);
  // Honor already-paid durable entitlements when commerce is paused.
  // Never require a current Checkout price or live Stripe secret to download.
  const verifiedKey = recordedDeliveryKey(order.offer_id, order.offer_version, ent.object_key);
  if (!verifiedKey || ent.offer_id !== order.offer_id ||
      ent.offer_version !== order.offer_version || !env.PRIVATE_KITS?.get) {
    throw new CommerceFailure("DELIVERY_CONFIGURATION_UNAVAILABLE", 503, true);
  }
  const file = await env.PRIVATE_KITS.get(verifiedKey);
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

