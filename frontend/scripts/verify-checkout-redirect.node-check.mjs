import assert from "node:assert/strict";
import test from "node:test";
import { verifiedCheckoutRedirect } from "../src/features/commercial/kit-offer.ts";

test("permits only canonical HTTPS Stripe Checkout destinations", () => {
  const url = "https://checkout.stripe.com/c/pay/cs_live_abc?prefilled_email=example%40test.invalid";
  assert.equal(verifiedCheckoutRedirect(url).toString(), url);
});

test("rejects credential-bearing and alternate-port Checkout URLs", () => {
  for (const url of [
    "https://operator:password@checkout.stripe.com/c/pay/cs_live_abc",
    "https://checkout.stripe.com:8443/c/pay/cs_live_abc",
    "https://checkout.stripe.com.evil.invalid/c/pay/cs_live_abc",
    "https://checkout.stripe.com@evil.invalid/c/pay/cs_live_abc",
    "http://checkout.stripe.com/c/pay/cs_live_abc",
    "javascript:alert(1)",
    "//checkout.stripe.com/c/pay/cs_live_abc",
    null,
  ]) {
    assert.throws(() => verifiedCheckoutRedirect(url), /UNTRUSTED_CHECKOUT/);
  }
});
