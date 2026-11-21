/** Validate one public offer at the browser boundary; the server remains payment authority. */
export const KIT_ID = "private-production-agent-operating-kit";

export type KitOffer = {
  id: string;
  title: string;
  summary: string;
  version: string;
  availability: "planned" | "purchase_available";
  mode?: string;
  currency?: string;
  unitAmountPence?: number;
  paymentModel?: string;
  termsVersion?: string;
  licenceVersion?: string;
  refundPolicyVersion?: string;
  termsUrl?: string;
  licenceUrl?: string;
  refundUrl?: string;
  buyerRequirements?: string[];
};

type VerifiedCatalogue = { offer: KitOffer; commerceActive: boolean };
const ORIGIN = "https://agents.proofandstate.com";
const APPROVED_LEGAL_VERSION = "2026-10-16.1";
const LEGAL = {
  termsUrl: ORIGIN + "/legal/kit-terms",
  licenceUrl: ORIGIN + "/legal/kit-licence",
  refundUrl: ORIGIN + "/legal/kit-refunds",
} as const;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseKitCatalogue(value: unknown): VerifiedCatalogue {
  if (
    !record(value) ||
    value["schemaVersion"] !== 1 ||
    typeof value["commerceActive"] !== "boolean" ||
    !Array.isArray(value["offers"]) ||
    value["offers"].length !== 1 ||
    !record(value["offers"][0])
  ) {
    throw Error("Invalid commerce availability response");
  }
  const entry = value["offers"][0];
  if (
    entry["id"] !== KIT_ID ||
    entry["version"] !== "2026.10.1" ||
    typeof entry["title"] !== "string" ||
    typeof entry["summary"] !== "string" ||
    !["planned", "purchase_available"].includes(String(entry["availability"]))
  ) {
    throw Error("Canonical private-kit offer is missing or invalid");
  }

  // An HTTP 200 is not proof of a safe price, policy or available checkout.
  // Unknown/malformed live terms must not be displayed as a confirmed closure.
  if (
    value["commerceActive"] &&
    (entry["availability"] !== "purchase_available" ||
      entry["mode"] !== "live" ||
      entry["currency"] !== "gbp" ||
      entry["unitAmountPence"] !== 900 ||
      entry["priceId"] !== undefined ||
      entry["paymentModel"] !== "managed_payments" ||
      ["termsVersion", "licenceVersion", "refundPolicyVersion"].some(
        (key) => entry[key] !== APPROVED_LEGAL_VERSION,
      ) ||
      Object.entries(LEGAL).some(([key, url]) => entry[key] !== url))
  ) {
    throw Error("Live private-kit offer terms are inconsistent");
  }
  return { commerceActive: value["commerceActive"], offer: entry as KitOffer };
}
