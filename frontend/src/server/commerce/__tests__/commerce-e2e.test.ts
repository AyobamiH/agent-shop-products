import { describe, expect, it } from "vitest";
import type { CommerceD1, CommerceD1 as Database, CommerceEnv } from "../config";
import { handleCommerceRequest } from "../handler";

const KIT = "private-production-agent-operating-kit";
const API = "https://agents.proofandstate.com/api/v1/commerce/";
const SESSION = "cs_test_123456789012345";
const INTENT = "pi_123456789012345";
type Row = { state?: unknown; idempotency_key?: unknown; checkout_session_id?: unknown; checkout_url?: unknown; payment_intent_id?: unknown; last_download_at?: unknown; [key: string]: unknown };

function fixture({ preventEntitlementInsert = false,
  stripeCommittedButTimedOut = false, tamperRecoverySession = false } = {}) {
  const orders = new Map<string, Row>();
  const entitlements = new Map<string, Row>();
  const events = new Set<string>();
  const refunds = new Set<string>();
  let currentOrderId = "";
  class Statement {
    values: unknown[] = [];
    constructor(readonly sql: string) {}
    bind(...values: unknown[]) { this.values = values; return this; }
    async first<T>() {
      const sql = this.sql, v = this.values;
      let value: Row | null = null;
      if (sql.startsWith("SELECT event_id")) value = events.has(String(v[0])) ? { event_id: v[0] } : null;
      else if (sql.startsWith("SELECT * FROM commerce_orders WHERE checkout_session_id")) {
        value = [...orders.values()].find((o) => o.checkout_session_id === v[0]) || null;
      } else if (sql.startsWith("SELECT * FROM commerce_orders WHERE id")) {
        value = orders.get(String(v[0])) || null;
      } else if (sql.startsWith("SELECT id,state FROM commerce_orders")) {
        value = orders.get(String(v[0])) || null;
      } else if (sql.startsWith("SELECT state,object_key FROM commerce_entitlements")) {
        value = entitlements.get(String(v[0])) || null;
      } else if (sql.startsWith("SELECT payment_intent_id FROM commerce_refunds")) {
        value = refunds.has(String(v[0])) ? { payment_intent_id: v[0] } : null;
      } else throw new Error("Unexpected fake D1 read: " + sql);
      return value as T | null;
    }
    async run() {
      const s = this.sql, v = this.values;
      if (s.startsWith("INSERT INTO commerce_orders")) {
        const [id,offer_id,offer_version,currency,amount_pence,terms_version,state,claim_token_hash,idempotency_key,created_at,updated_at] = v;
        if ([...orders.values()].some(o=>o.idempotency_key===idempotency_key)) throw Error("UNIQUE constraint");
        orders.set(String(id),{ id,offer_id,offer_version,currency,amount_pence,terms_version,state,
          claim_token_hash,idempotency_key,created_at,updated_at,checkout_session_id:null,payment_intent_id:null });
        currentOrderId=String(id);
      } else if (s.includes("SET state='checkout_open'") && s.includes("checkout_session_id IS NULL")) {
        const row = orders.get(String(v[2]));
        if (row?.state === "creating" && !row.checkout_session_id) {
          row.state = "checkout_open"; row.checkout_session_id = v[0];
        }
      } else if (s.includes("SET state='checkout_open'")) {
        const row=orders.get(String(v[3]))!; row.state="checkout_open";row.checkout_session_id=v[0];row.checkout_url=v[1];
      } else if (s.includes("SET state='failed'")) {
        const row=orders.get(String(v[1]));if(row?.state==="checkout_open"||row?.state==="creating")row.state="failed";
      } else if (s.includes("SET state='paid'")) {
        const row=orders.get(String(v[2]));
        if(row && ["paid","checkout_open"].includes(String(row.state))&&!refunds.has(String(v[3]))) {
          row.state="paid";row.payment_intent_id=v[0];
        }
      } else if (s.startsWith("INSERT OR IGNORE INTO commerce_entitlements")) {
        const row=orders.get(String(v[0]));
        if(!preventEntitlementInsert && row?.state==="paid"&&!refunds.has(String(v[5]))&&!entitlements.has(String(v[0])))
          entitlements.set(String(v[0]),{state:"active",object_key:v[3]});
      } else if (s.startsWith("INSERT OR IGNORE INTO commerce_webhook_events")) {
        events.add(String(v[0]));
      } else if (s.startsWith("INSERT OR IGNORE INTO commerce_refunds")) {
        refunds.add(String(v[0]));
      } else if (s.includes("SET state='revoked'") && s.includes("UPDATE commerce_orders")) {
        if (s.includes("WHERE id=?")) {
          const row = orders.get(String(v[2]));
          if (row && ["checkout_open", "paid", "revoked"].includes(String(row.state))) {
            row.state = "revoked";
            row.payment_intent_id = v[0];
          }
        } else {
          for (const row of orders.values()) if(row.payment_intent_id===v[1])row.state="revoked";
        }
      } else if (s.includes("SET state='revoked'") && s.includes("UPDATE commerce_entitlements")) {
        if (s.includes("WHERE order_id=?")) {
          const entitlement=entitlements.get(String(v[1]));
          if (entitlement?.state === "active") entitlement.state = "revoked";
        } else {
          for(const [id, row] of orders) if(row.payment_intent_id===v[1]) {
            const ent=entitlements.get(id);if(ent)ent.state="revoked";
          }
        }
      } else if (s.startsWith("UPDATE commerce_entitlements SET last_download_at")) {
        const ent=entitlements.get(String(v[1]));if(ent)ent.last_download_at=v[0];
      } else throw new Error("Unexpected fake D1 write: "+s);
      return { success: true, meta: { changes: 1 } };
    }
  }
  const db: CommerceD1 = {
    prepare(sql: string) { return new Statement(sql) as Database["prepare"] extends (sql:string)=>infer S?S:never; },
    async batch(statements) { const results=[];for(const s of statements)results.push(await s.run());return results; },
  };
  const env: CommerceEnv = {
    COMMERCE_ENABLED: "true", COMMERCE_MODE: "test",
    COMMERCE_OFFER_APPROVAL: JSON.stringify({
      offerId:KIT,version:"2026.10.1",priceId:"price_123456789012",
      unitAmountPence:4900,currency:"gbp",termsVersion:"terms.v1",
      licenceVersion:"licence.v1",refundPolicyVersion:"refund.v1",commercialDecisionId:"approval.v1",
      termsUrl:"https://agents.proofandstate.com/legal/kit-terms",
      licenceUrl:"https://agents.proofandstate.com/legal/kit-licence",
      refundUrl:"https://agents.proofandstate.com/legal/kit-refunds",
    }),
    STRIPE_SECRET_KEY:"sk_test_synthetic",
    STRIPE_WEBHOOK_SECRET:"whsec_test_synthetic",
    COMMERCE_DB:db,
    PRIVATE_KITS:{
      async head(key){return key.includes("private-kits/")?{key}:null;},
      async get(key) {return {body:new ReadableStream({start(c){c.enqueue(new TextEncoder().encode("private fixture bytes"));c.close();}})};},
    },
    COMMERCE_RATE_LIMITER:{async limit(){return {success:true};}},
  };
  const fakeStripe = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url=new URL(String(input));
    if(url.pathname.endsWith("/prices/price_123456789012")) {
      return new Response(JSON.stringify({id:"price_123456789012",active:true,
        currency:"gbp",unit_amount:4900,type:"one_time",tax_behavior:"exclusive",recurring:null,livemode:false}),{status:200});
    }
    if(url.pathname.endsWith("/checkout/sessions")&&init?.method==="POST"){
      const body=new URLSearchParams(String(init.body));
      if(body.get("automatic_tax[enabled]") !== "true") throw Error("Stripe Tax must be active");
      if (stripeCommittedButTimedOut) throw new Error("synthetic Stripe transport loss after session commit");
      return new Response(JSON.stringify({id:SESSION,url:"https://checkout.stripe.com/pay/"+SESSION,
        livemode:false,mode:"payment",client_reference_id:body.get("client_reference_id")}),{status:200});
    }
    if(url.pathname.endsWith("/checkout/sessions/"+SESSION))return new Response(JSON.stringify({
      id:SESSION,livemode:false,mode:"payment",payment_status:"paid",
      amount_subtotal:4900, amount_total:5880, total_details:{amount_tax:980,amount_discount:0,amount_shipping:0},
      currency:"gbp",payment_intent:INTENT,client_reference_id:currentOrderId,
      metadata:{agent_shop_order_id:currentOrderId,offer_id:KIT,offer_version:"2026.10.1"},
      line_items:{data:[{price:{id:tamperRecoverySession?"price_999999999999":"price_123456789012"},quantity:1}]},
    }),{status:200});
    return new Response(JSON.stringify({error:"unexpected"}),{status:500});
  };
  async function signedEvent(type:string,id:string,object:Record<string,unknown>){
    const raw=JSON.stringify({id,type,livemode:false,data:{object}});
    const t=Math.floor(Date.now()/1000);
    const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET!),{
      name:"HMAC",hash:"SHA-256"},false,["sign"]);
    const sig=await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(t+"."+raw));
    const hex=Array.from(new Uint8Array(sig),x=>x.toString(16).padStart(2,"0")).join("");
    return new Request(API+"stripe-webhook",{method:"POST",
      headers:{"stripe-signature":"t="+t+",v1="+hex},body:raw});
  }
  return {env,orders,entitlements,events,refunds,fakeStripe:fakeStripe as typeof fetch,signedEvent};
}

describe("Stripe-hosted private-kit integration without live customer effects", () => {
  it("fails closed until paid, rejects stolen claims, fulfils once, revokes on refund and rejects replays", async () => {
    const f=fixture();
    const attempt=new Request(API+"checkout",{method:"POST",headers:{
      origin:"https://agents.proofandstate.com", "Content-Type":"application/json",
      "Idempotency-Key":crypto.randomUUID()},body:JSON.stringify({offerId:KIT})});
    const checkout=await handleCommerceRequest(attempt,f.env,f.fakeStripe);
    expect(checkout?.status).toBe(201);
    const data=await checkout!.json() as {orderId:string;claimToken:string;checkoutUrl:string};
    expect(data.checkoutUrl.startsWith("https://checkout.stripe.com/")).toBe(true);
    expect(data.checkoutUrl).not.toContain(data.claimToken);
    expect(f.orders.get(data.orderId)?.state).toBe("checkout_open");
    const headers={Authorization:"Bearer "+data.claimToken};
    const statusBefore=await handleCommerceRequest(new Request(API+"orders/"+data.orderId,{headers}),f.env);
    expect((await statusBefore!.json()).fulfilment).toBe("unavailable");
    const denied=await handleCommerceRequest(new Request(API+"download/"+data.orderId,{headers}),f.env);
    expect(denied?.status).toBe(409);
    const webhook=await f.signedEvent("checkout.session.completed","evt_purchase123456",{id:SESSION,client_reference_id:data.orderId});
    expect((await handleCommerceRequest(webhook,f.env,f.fakeStripe))?.status).toBe(200);
    expect(f.orders.get(data.orderId)?.state).toBe("paid");
    expect(f.entitlements.get(data.orderId)?.state).toBe("active");
    const wrong=await handleCommerceRequest(new Request(API+"download/"+data.orderId,{headers:{
      Authorization:"Bearer "+("A".repeat(data.claimToken.length))}}),f.env);
    expect(wrong?.status).toBe(404);
    const delivered=await handleCommerceRequest(new Request(API+"download/"+data.orderId,{headers}),f.env);
    expect(delivered?.status).toBe(200);
    expect(await delivered?.text()).toBe("private fixture bytes");
    const refund=await f.signedEvent("charge.refunded","evt_refund123456",{payment_intent:INTENT});
    expect((await handleCommerceRequest(refund,f.env,f.fakeStripe))?.status).toBe(200);
    expect(f.orders.get(data.orderId)?.state).toBe("revoked");
    const revoked=await handleCommerceRequest(new Request(API+"download/"+data.orderId,{headers}),f.env);
    expect(revoked?.status).toBe(409);
    expect((await handleCommerceRequest(await f.signedEvent("checkout.session.completed","evt_late123456",{
      id:SESSION,client_reference_id:data.orderId}),f.env,f.fakeStripe))?.status).toBe(200);
    expect(f.orders.get(data.orderId)?.state).toBe("revoked");
    expect(f.entitlements.get(data.orderId)?.state).toBe("revoked");
  });
  it("does not acknowledge paid events when D1 entitlement issuance silently changes zero rows", async () => {
    const f = fixture({ preventEntitlementInsert: true });
    const request = new Request(API + "checkout", { method: "POST", headers: {
      origin: "https://agents.proofandstate.com", "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    }, body: JSON.stringify({ offerId: KIT }) });
    const checkout = await handleCommerceRequest(request, f.env, f.fakeStripe);
    expect(checkout?.status).toBe(201);
    const receipt = await checkout!.json() as { orderId: string };
    const callback = await f.signedEvent("checkout.session.completed", "evt_nogrant123456", {
      id: SESSION, client_reference_id: receipt.orderId,
    });
    const outcome = await handleCommerceRequest(callback, f.env, f.fakeStripe);
    expect(outcome?.status).toBe(503);
    expect(f.orders.get(receipt.orderId)?.state).toBe("paid");
    expect(f.entitlements.has(receipt.orderId)).toBe(false);
    expect(f.events.size).toBe(0);
  });
  it("records a refund before a delayed paid event without ever granting private access", async () => {
    const f = fixture();
    const orderAttempt = new Request(API + "checkout", { method: "POST", headers: {
      origin: "https://agents.proofandstate.com", "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    }, body: JSON.stringify({ offerId: KIT }) });
    const session = await handleCommerceRequest(orderAttempt, f.env, f.fakeStripe);
    expect(session?.status).toBe(201);
    const { orderId, claimToken } = await session!.json() as { orderId: string; claimToken: string };
    const refund = await f.signedEvent("charge.refunded", "evt_refundfirst123456", { payment_intent: INTENT });
    expect((await handleCommerceRequest(refund, f.env, f.fakeStripe))?.status).toBe(200);
    expect(f.orders.get(orderId)?.state).toBe("checkout_open");
    const paid = await f.signedEvent("checkout.session.completed", "evt_paidlate123456", {
      id: SESSION, client_reference_id: orderId,
    });
    expect((await handleCommerceRequest(paid, f.env, f.fakeStripe))?.status).toBe(200);
    expect(f.orders.get(orderId)?.state).toBe("revoked");
    expect(f.entitlements.get(orderId)?.state).not.toBe("active");
    const denied = await handleCommerceRequest(new Request(API + "download/" + orderId, {
      headers: { Authorization: "Bearer " + claimToken },
    }), f.env);
    expect(denied?.status).toBe(409);
    expect(f.events.size).toBe(2);
  });
  it("does not acknowledge an unproven early webhook while checkout is still creating", async () => {
    const f=fixture();
    const id=crypto.randomUUID();
    f.orders.set(id,{id,state:"creating"});
    const response=await handleCommerceRequest(await f.signedEvent("checkout.session.completed",
      "evt_early123456",{id:SESSION,client_reference_id:id}),f.env,f.fakeStripe);
    expect(response?.status).toBe(409);
    expect(f.events.size).toBe(0);
  });

  it("recovers an ambiguous Stripe session POST after it committed, using only signed and server-read evidence", async () => {
    const f = fixture({stripeCommittedButTimedOut:true});
    const browser = new Request(API+"checkout",{method:"POST",headers:{
      origin:"https://agents.proofandstate.com", "Content-Type":"application/json",
      "Idempotency-Key":crypto.randomUUID()},body:JSON.stringify({offerId:KIT})});
    const checkout = await handleCommerceRequest(browser, f.env, f.fakeStripe);
    expect(checkout?.status).toBe(503);
    expect((await checkout!.json()).error).toBe("PAYMENT_PROVIDER_UNAVAILABLE");
    const order = [...f.orders.values()][0]!;
    expect(order.state).toBe("creating");
    expect(order.checkout_session_id).toBeNull();
    const callback = await f.signedEvent("checkout.session.completed", "evt_recovery123456", {
      id:SESSION, client_reference_id:order["id"],
    });
    expect((await handleCommerceRequest(callback,f.env,f.fakeStripe))?.status).toBe(200);
    expect(order.state).toBe("paid");
    expect(order.checkout_session_id).toBe(SESSION);
    expect(f.entitlements.get(String(order["id"]))?.state).toBe("active");
    expect(f.events.size).toBe(1);
  });

  it("rejects forged recovery mismatched against Stripe's authoritative price", async () => {
    const f = fixture({stripeCommittedButTimedOut:true,tamperRecoverySession:true});
    const browser = new Request(API+"checkout",{method:"POST",headers:{
      origin:"https://agents.proofandstate.com", "Content-Type":"application/json",
      "Idempotency-Key":crypto.randomUUID()},body:JSON.stringify({offerId:KIT})});
    expect((await handleCommerceRequest(browser,f.env,f.fakeStripe))?.status).toBe(503);
    const order = [...f.orders.values()][0]!;
    const forged = await f.signedEvent("checkout.session.completed", "evt_badrecover123456", {
      id:SESSION,client_reference_id:order["id"],
    });
    expect((await handleCommerceRequest(forged,f.env,f.fakeStripe))?.status).toBe(409);
    expect(order.state).toBe("creating");
    expect(f.entitlements.size).toBe(0);
    expect(f.events.size).toBe(0);
  });
});
