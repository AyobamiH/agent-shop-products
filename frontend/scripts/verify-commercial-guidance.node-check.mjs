import assert from "node:assert/strict";
import test from "node:test";
import { verifyCommercialGuidance } from "./verify-commercial-guidance.mjs";

const canonicalOrigin = "https://agents.proofandstate.com";
const offersUrl = canonicalOrigin + "/api/v1/commerce/offers";
const buyerUrl = canonicalOrigin + "/private-kits";
const valid = {
  canonicalOrigin,
  agentsText: `Private kit availability: ${offersUrl}; buyer path: ${buyerUrl}.
CLI buy/install/update are roadmap only. Private-kit checkout is a separate browser flow.`,
  llmsText: `Private kit purchase availability: ${offersUrl}.
Private kit buyer route: ${buyerUrl}. CLI buy/install/update remain unimplemented.`,
  privateKitHtml: "Checking current kit availability and price.",
};

test("accepts runtime-linked guidance without claiming a sale", () => {
  assert.deepEqual(verifyCommercialGuidance(valid), { commercialGuidance: "PASS" });
});

test("rejects stale machine claims even when valid links also exist", () => {
  assert.throws(() => verifyCommercialGuidance({
    ...valid, agentsText: valid.agentsText +
      " Agent Shop purchase and paid kit fulfilment: not available.",
  }), /STALE_COMMERCIAL_CLAIM/);
  assert.throws(() => verifyCommercialGuidance({
    ...valid, llmsText: valid.llmsText +
      " Paid execution kits, bundles and install/buy/update CLI commands are not live.",
  }), /STALE_COMMERCIAL_CLAIM/);
  assert.throws(() => verifyCommercialGuidance({
    ...valid, agentsText: valid.agentsText +
      " Agent Shop provides capability metadata only; it does not accept paid jobs",
  }), /STALE_COMMERCIAL_CLAIM/);
});

test("rejects missing live authority, buyer link and malformed origin", () => {
  assert.throws(() => verifyCommercialGuidance({
    ...valid, llmsText: "No buyer route",
  }), /MISSING_RUNTIME_OFFER_AUTHORITY/);
  assert.throws(() => verifyCommercialGuidance({
    ...valid, canonicalOrigin: "https://lookalike.test/path",
  }), /INVALID_CANONICAL_ORIGIN/);
});

test("rejects stale private-kit SSR even if the client would correct it later", () => {
  for (const phrase of ["Planned introductory price: 9 GBP",
    "A proposed private execution pack", "Once purchases open,"]) {
    assert.throws(() => verifyCommercialGuidance({
      ...valid, privateKitHtml: valid.privateKitHtml + phrase,
    }), /STALE_BUYER_COPY/);
  }
});

test("rejects a missing neutral SSR status despite plausible alternative copy", () => {
  for (const privateKitHtml of [
    "",
    "Private Production Agent Operating Kit — Online checkout is closed.",
  ]) {
    assert.throws(() => verifyCommercialGuidance({
      ...valid, privateKitHtml,
    }), /MISSING_NEUTRAL_AVAILABILITY_STATUS/);
  }
});
