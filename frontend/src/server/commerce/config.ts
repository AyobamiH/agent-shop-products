import source from "../../../../commerce/offers.json";

export type D1Result = { meta?: { changes?: number }; success?: boolean };
export type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
};
export type CommerceD1 = {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<D1Result[]>;
};
export type PrivateObject = { body?: ReadableStream<Uint8Array>; size?: number };
export type PrivateBucket = {
  head(key: string): Promise<unknown | null>;
  get(key: string): Promise<PrivateObject | null>;
};
export type CommerceEnv = {
  COMMERCE_ENABLED?: string;
  COMMERCE_MODE?: string;
  COMMERCE_LIVE_APPROVED?: string;
  COMMERCE_OFFER_APPROVAL?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  COMMERCE_DB?: CommerceD1;
  PRIVATE_KITS?: PrivateBucket;
  COMMERCE_RATE_LIMITER?: { limit(input: { key: string }): Promise<{ success: boolean }> };
};

export type SourceOffer = {
  id: string; productId: string; title: string; summary: string;
  version: string; assetKey: string; status: string;
  deliverableType: string; fulfilment: string; currency: string;
  buyerRequirements: string[];
};
export type ApprovedOffer = SourceOffer & {
  priceId: string; unitAmountPence: number; termsVersion: string;
  licenceVersion: string; refundPolicyVersion: string;
  commercialDecisionId: string; mode: "test" | "live";
  termsUrl: string; licenceUrl: string; refundUrl: string;
};

export const EXPECTED_ORIGIN = "https://agents.proofandstate.com";
const offers = source.offers as SourceOffer[];
const pricePattern = /^price_[A-Za-z0-9]{8,100}$/;
const versionPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/;
function approvedLegalUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 512) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      !url.search && !url.hash && url.port === "" &&
      ["agents.proofandstate.com", "proofandstate.com"].includes(url.hostname) &&
      /^\/legal\/[a-z0-9-]+$/.test(url.pathname);
  } catch { return false; }
}

export function publicOffers(env: CommerceEnv): Record<string, unknown>[] {
  return offers.map((offer) => {
    const active = approvedOffer(env, offer.id);
    const base = {
      id: offer.id, productId: offer.productId, title: offer.title,
      summary: offer.summary, version: offer.version, currency: offer.currency,
      fulfilment: "private_versioned_kit", buyerRequirements: offer.buyerRequirements,
    };
    return active
      ? { ...base, availability: "purchase_available", unitAmountPence: active.unitAmountPence,
          termsVersion: active.termsVersion, licenceVersion: active.licenceVersion,
          refundPolicyVersion: active.refundPolicyVersion,
          termsUrl: active.termsUrl, licenceUrl: active.licenceUrl, refundUrl: active.refundUrl }
      : { ...base, availability: "planned", commerceStatus: "awaiting_approved_terms_price_and_private_delivery" };
  });
}

// A public source record NEVER turns into a live offer just because it has a price-looking field.
// The complete merchant-approved record lives in an owner-controlled runtime setting.
export function approvedOffer(env: CommerceEnv, id: string): ApprovedOffer | null {
  const entry = offers.find((o) => o.id === id && o.status === "planned");
  if (!entry || env.COMMERCE_ENABLED !== "true" || !env.COMMERCE_OFFER_APPROVAL) return null;
  let value: Record<string, unknown>;
  try {
    value = JSON.parse(env.COMMERCE_OFFER_APPROVAL) as Record<string, unknown>;
  } catch {
    return null;
  }
  const mode = env.COMMERCE_MODE;
  if (
    value["offerId"] !== entry.id || value["version"] !== entry.version ||
    !pricePattern.test(String(value["priceId"] || "")) ||
    !Number.isSafeInteger(value["unitAmountPence"]) ||
    Number(value["unitAmountPence"]) < 100 ||
    Number(value["unitAmountPence"]) > 1_000_000 ||
    value["currency"] !== "gbp" ||
    !versionPattern.test(String(value["termsVersion"] || "")) ||
    !versionPattern.test(String(value["licenceVersion"] || "")) ||
    !versionPattern.test(String(value["refundPolicyVersion"] || "")) ||
    !versionPattern.test(String(value["commercialDecisionId"] || "")) ||
    !approvedLegalUrl(value["termsUrl"]) ||
    !approvedLegalUrl(value["licenceUrl"]) ||
    !approvedLegalUrl(value["refundUrl"]) ||
    (mode !== "test" && mode !== "live") ||
    (mode === "test" && !env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) ||
    (mode === "live" &&
      (!env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ||
       env.COMMERCE_LIVE_APPROVED !== "yes:" + value["commercialDecisionId"])) ||
    !env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_") ||
    !env.COMMERCE_DB?.prepare || !env.COMMERCE_DB.batch ||
    !env.PRIVATE_KITS?.head || !env.PRIVATE_KITS?.get ||
    !env.COMMERCE_RATE_LIMITER?.limit
  ) return null;
  return {
    ...entry, priceId: String(value["priceId"]),
    unitAmountPence: Number(value["unitAmountPence"]),
    termsVersion: String(value["termsVersion"]),
    licenceVersion: String(value["licenceVersion"]),
    refundPolicyVersion: String(value["refundPolicyVersion"]),
    commercialDecisionId: String(value["commercialDecisionId"]), mode,
    termsUrl: String(value["termsUrl"]),
    licenceUrl: String(value["licenceUrl"]),
    refundUrl: String(value["refundUrl"]),
  };
}

export function rejectUnknownOffer(): never {
  throw new CommerceFailure("OFFER_UNAVAILABLE", 409);
}
export class CommerceFailure extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly retryable = false,
  ) {
    super(code);
    this.name = "CommerceFailure";
  }
}
