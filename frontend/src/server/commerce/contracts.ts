import { policies, POLICY_VERSION, SELLER } from "../../domain/commerce/policies";
import { SUPPORT_EMAIL } from "../../lib/contact";
import { CommerceFailure } from "./config";
import type { ApprovedOffer, CommerceD1, CommerceEnv } from "./config";
import { applied, authorisedOrder, database, headers, now } from "./shared";

export type Contract = {
  order_id: string; body: string; sha256: string; created_at: string;
  paid_total_pence: number | null; tax_pence: number | null;
  confirmed_at: string | null; document_accessed_at: string | null;
  financial_retain_until: string | null; legal_hold: number;
};
export async function digestText(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}
export async function contractSnapshot(offer: ApprovedOffer, orderId: string, createdAt: string) {
  if ([offer.termsVersion, offer.licenceVersion, offer.refundPolicyVersion]
      .some(version => version !== POLICY_VERSION)) {
    throw new CommerceFailure("PURCHASE_DOCUMENTS_MISMATCH", 409);
  }
  const body = JSON.stringify({
    schemaVersion: 1, orderId, createdAt, seller: SELLER, supportEmail: SUPPORT_EMAIL,
    offer: { id: offer.id, title: offer.title, version: offer.version,
      currency: offer.currency, baseAmountPence: offer.unitAmountPence },
    policyVersion: POLICY_VERSION, policies,
  });
  return { body, sha256: await digestText(body) };
}
export function contractInsert(db: CommerceD1, orderId: string, created: string,
  snapshot: { body: string; sha256: string }) {
  return db.prepare("INSERT INTO commerce_contracts (order_id,body,sha256,created_at) VALUES (?,?,?,?)")
    .bind(orderId, snapshot.body, snapshot.sha256, created);
}
// UK self-employed minimum: five years after the 31 January filing deadline.
// This is a review date, never automatic deletion of a licence or a legal hold.
export function financialReviewDate(paidAt: string): string {
  const date = new Date(paidAt);
  if (!Number.isFinite(date.getTime())) throw new Error("INVALID_PAID_DATE");
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London",
    year: "numeric", month: "numeric", day: "numeric" }).formatToParts(date);
  const part = (name: string) => Number(parts.find(p => p.type === name)?.value);
  const year = part("year"), month = part("month"), day = part("day");
  const taxYearEnd = month < 4 || (month === 4 && day < 6) ? year : year + 1;
  return new Date(Date.UTC(taxYearEnd + 6, 1, 1)).toISOString();
}
export function confirmContract(db: CommerceD1, orderId: string, total: number, tax: number, timestamp: string) {
  return db.prepare("UPDATE commerce_contracts SET paid_total_pence=?,tax_pence=?,confirmed_at=?,financial_retain_until=? WHERE order_id=? AND confirmed_at IS NULL")
    .bind(total, tax, timestamp, financialReviewDate(timestamp), orderId);
}
export async function readContract(db: CommerceD1, orderId: string): Promise<Contract | null> {
  return db.prepare("SELECT * FROM commerce_contracts WHERE order_id=?").bind(orderId).first<Contract>();
}
export async function purchaseRecord(request: Request, env: CommerceEnv, id: string): Promise<Response> {
  const order = await authorisedOrder(request, env, id);
  if (!["paid", "revoked"].includes(order.state)) throw new CommerceFailure("PURCHASE_RECORD_UNAVAILABLE", 409);
  const db = database(env);
  const record = await readContract(db, id);
  if (!record?.confirmed_at || record.paid_total_pence === null || record.tax_pence === null) {
    throw new CommerceFailure("PURCHASE_RECORD_UNAVAILABLE", 409);
  }
  if (await digestText(record.body) !== record.sha256) throw new CommerceFailure("PURCHASE_RECORD_INTEGRITY_ERROR", 503);
  const snapshot = JSON.parse(record.body) as {
    seller: string; supportEmail: string; policyVersion: string;
    offer: { title: string; version: string; currency: string; baseAmountPence: number };
    policies: Record<string, { title: string; sections: Array<[string, string]> }>;
  };
  const money = (pence: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: order.currency }).format(pence / 100);
  const lines = ["AGENT SHOP — PURCHASE RECORD", "", "Order: " + id,
    "Payment confirmed: " + record.confirmed_at, "Current order status: " + order.state,
    "Seller: " + snapshot.seller, "Contact: " + snapshot.supportEmail,
    "Item: " + snapshot.offer.title + " · " + snapshot.offer.version,
    "Base amount: " + money(order.amount_pence), "Tax: " + money(record.tax_pence),
    "Total paid: " + money(record.paid_total_pence),
    "Terms version: " + snapshot.policyVersion, "Contract SHA-256: " + record.sha256, "",
    "Keep this record. A refund ends the commercial licence and further download access.", ""];
  for (const policy of Object.values(snapshot.policies)) {
    lines.push(policy.title.toUpperCase(), "");
    for (const [heading, body] of policy.sections) lines.push(heading, body, "");
  }
  await applied(db.prepare("UPDATE commerce_contracts SET document_accessed_at=COALESCE(document_accessed_at,?) WHERE order_id=?")
    .bind(now(), id), 1);
  return new Response(lines.join("\n"), { headers: {
    ...headers, "Content-Type": "text/plain; charset=utf-8",
    "Content-Disposition": 'attachment; filename="agent-shop-purchase-record.txt"',
  } });
}
