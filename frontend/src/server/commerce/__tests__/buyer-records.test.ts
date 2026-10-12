import { afterEach, describe, expect, it } from "vitest";
import { buyerFixture } from "./buyer-fixture";
import { recoverOrderAccess } from "../recovery";
import { financialReviewDate } from "../contracts";
import { runRetention } from "../retention";

const fixtures: ReturnType<typeof buyerFixture>[] = [];
const setup = () => { const f = buyerFixture(); fixtures.push(f); return f; };
afterEach(() => { for (const f of fixtures.splice(0)) f.native.close(); });
describe("Durable buyer records and recovery against real SQLite", () => {
  it("freezes terms atomically, delivers the exact paid amount and preserves the record after refund", async () => {
    const f = setup(), order = await f.create();
    expect((await f.request("purchase-record/" + order.orderId, order.claimToken))?.status).toBe(409);
    expect(() => f.native.prepare("UPDATE commerce_contracts SET body='changed' WHERE order_id=?").run(order.orderId))
      .toThrow("immutable");
    expect((await f.event())?.status).toBe(200);
    expect((await f.request("download/" + order.orderId, order.claimToken))?.status).toBe(409);
    const record = await f.request("purchase-record/" + order.orderId, order.claimToken);
    expect(record?.status).toBe(200);
    const text = await record!.text();
    expect(text).toContain("Total paid: £10.80");
    expect(text).toContain("Tax: £1.80");
    expect(text).toContain("14-day refund");
    expect(record?.headers.get("cache-control")).toContain("no-store");
    expect((await f.request("download/" + order.orderId, order.claimToken))?.status).toBe(200);
    expect((await f.event("charge.refunded"))?.status).toBe(200);
    expect((await f.request("download/" + order.orderId, order.claimToken))?.status).toBe(409);
    expect(await (await f.request("purchase-record/" + order.orderId, order.claimToken))!.text()).toContain("Current order status: revoked");
  });
  it("does not leave an order or call Stripe if the immutable snapshot cannot be persisted", async () => {
    const f = setup();
    f.native.exec("CREATE TRIGGER reject_contract BEFORE INSERT ON commerce_contracts BEGIN SELECT RAISE(ABORT,'disk failure'); END");
    await expect(f.create()).rejects.toThrow("COMMERCE_DEPENDENCY_ERROR");
    expect(f.native.prepare("SELECT COUNT(*) AS count FROM commerce_orders").get()?.["count"]).toBe(0);
  });
  it("rotates a verified buyer claim once, invalidates the old claim and rejects wrong identities or refunds", async () => {
    const f = setup(), order = await f.create();
    const evidence = { requestId: crypto.randomUUID(), orderId: order.orderId,
      customerEmail: "buyer@example.invalid", verifiedCustomerControl: true as const };
    await expect(recoverOrderAccess(f.env, evidence, f.provider)).rejects.toMatchObject({ code: "RECOVERY_UNAVAILABLE" });
    await f.event();
    await expect(recoverOrderAccess(f.env, { ...evidence, customerEmail: "other@example.invalid" }, f.provider))
      .rejects.toMatchObject({ code: "RECOVERY_IDENTITY_MISMATCH" });
    const recovered = await recoverOrderAccess(f.env, evidence, f.provider);
    expect(recovered.claimToken).not.toBe(order.claimToken);
    expect((await f.request("orders/" + order.orderId, order.claimToken))?.status).toBe(404);
    expect((await f.request("orders/" + order.orderId, recovered.claimToken))?.status).toBe(200);
    await expect(recoverOrderAccess(f.env, evidence, f.provider)).rejects.toMatchObject({ code: "RECOVERY_ALREADY_APPLIED" });
    expect(f.native.prepare("SELECT COUNT(*) AS count FROM commerce_recovery_events").get()?.["count"]).toBe(1);
    await f.event("charge.refunded");
    await expect(recoverOrderAccess(f.env, { ...evidence, requestId: crypto.randomUUID() }, f.provider))
      .rejects.toMatchObject({ code: "RECOVERY_UNAVAILABLE" });
  });
  it("does not rotate a claim if a refund races recovery", async () => {
    const f = setup(), order = await f.create(); await f.event();
    const racingProvider = (async (...args: Parameters<typeof fetch>) => {
      const response = await f.provider(...args);
      await f.event("charge.refunded");
      return response;
    }) as typeof fetch;
    await expect(recoverOrderAccess(f.env, { requestId: crypto.randomUUID(), orderId: order.orderId,
      customerEmail: "buyer@example.invalid", verifiedCustomerControl: true }, racingProvider))
      .rejects.toMatchObject({ code: "RECOVERY_CONFLICT" });
    expect(f.native.prepare("SELECT COUNT(*) AS count FROM commerce_recovery_events").get()?.["count"]).toBe(0);
  });
  it("limits cleanup to expired technical data and preserves paid rights and legal holds", async () => {
    const f = setup(), paid = await f.create(); await f.event();
    const failed = await f.create();
    const held = await f.create();
    f.native.prepare("UPDATE commerce_orders SET updated_at='2020-01-01T00:00:00.000Z'").run();
    for (const id of [failed.orderId, held.orderId]) {
      f.native.prepare("UPDATE commerce_orders SET state='failed',checkout_session_id=NULL,payment_intent_id=NULL WHERE id=?").run(id);
    }
    f.native.prepare("UPDATE commerce_contracts SET legal_hold=1 WHERE order_id=?").run(held.orderId);
    f.native.prepare("INSERT INTO commerce_refunds VALUES ('pi_protected','evt_protected','2020-01-01')").run();
    await runRetention(f.db);
    expect(f.native.prepare("SELECT id FROM commerce_orders WHERE id=?").get(failed.orderId)).toBeUndefined();
    expect(f.native.prepare("SELECT id FROM commerce_orders WHERE id=?").get(held.orderId)).toBeTruthy();
    expect(f.native.prepare("SELECT state,checkout_url FROM commerce_orders WHERE id=?").get(paid.orderId))
      .toMatchObject({ state: "paid", checkout_url: null });
    expect(f.native.prepare("SELECT state FROM commerce_entitlements WHERE order_id=?").get(paid.orderId)?.["state"]).toBe("active");
    expect(f.native.prepare("SELECT payment_intent_id FROM commerce_refunds WHERE payment_intent_id='pi_protected'").get()).toBeTruthy();
  });
  it("rolls back cleanup as one transaction if a delete fails", async () => {
    const f = setup(), order = await f.create();
    f.native.prepare("UPDATE commerce_orders SET state='failed',checkout_session_id=NULL,updated_at='2020-01-01' WHERE id=?").run(order.orderId);
    f.native.exec("CREATE TRIGGER reject_cleanup BEFORE DELETE ON commerce_orders BEGIN SELECT RAISE(ABORT,'blocked'); END");
    await expect(runRetention(f.db)).rejects.toThrow("blocked");
    expect(f.native.prepare("SELECT order_id FROM commerce_contracts WHERE order_id=?").get(order.orderId)).toBeTruthy();
  });
  it("uses the correct tax-year boundary for the financial-record review date", () => {
    expect(financialReviewDate("2026-04-05T12:00:00Z")).toBe("2032-02-01T00:00:00.000Z");
    expect(financialReviewDate("2026-04-05T23:30:00Z")).toBe("2033-02-01T00:00:00.000Z");
    expect(financialReviewDate("2026-04-06T12:00:00Z")).toBe("2033-02-01T00:00:00.000Z");
  });
});
