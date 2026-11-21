// The deployment gate must reject stale commercial copy, not merely test the source generator.
const obsoleteClaims = [
  "Agent Shop purchase and paid kit fulfilment: not available.",
  "Paid execution kits, bundles and install/buy/update CLI commands are not live.",
  "Enhanced private execution kits and curated bundles are proposed offers",
  "Agent Shop provides capability metadata only; it does not accept paid jobs",
];
const obsoleteBuyerCopy = [
  "Planned introductory price:",
  "A proposed private execution pack",
  "Once purchases open,",
];

export function verifyCommercialGuidance({
  agentsText, llmsText, privateKitHtml, canonicalOrigin,
}) {
  if (!/^https?:\/\/[a-z0-9.-]+(?::[0-9]{1,5})?$/i.test(canonicalOrigin)) {
    throw Error("INVALID_CANONICAL_ORIGIN");
  }
  const offersUrl = canonicalOrigin + "/api/v1/commerce/offers";
  const buyerUrl = canonicalOrigin + "/private-kits";
  for (const [name, content] of [
    ["agents.txt", agentsText], ["llms.txt", llmsText],
  ]) {
    if (typeof content !== "string" ||
      !content.includes(offersUrl) || !content.includes(buyerUrl)) {
      throw Error(name + ": MISSING_RUNTIME_OFFER_AUTHORITY");
    }
    if (obsoleteClaims.some((claim) => content.includes(claim))) {
      throw Error(name + ": STALE_COMMERCIAL_CLAIM");
    }
  }
  if (typeof privateKitHtml !== "string" ||
    obsoleteBuyerCopy.some((claim) => privateKitHtml.includes(claim))) {
    throw Error("private-kits: STALE_BUYER_COPY");
  }
  if (!privateKitHtml.includes("Checking current kit availability and price.")) {
    throw Error("private-kits: MISSING_NEUTRAL_AVAILABILITY_STATUS");
  }
  return { commercialGuidance: "PASS" };
}
