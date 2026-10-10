# Deployed Stripe webhook acceptance — 10 October 2026

**PASS at 13:33:49 UTC**, using application source `67aea5877f2ad49e8041957d1b21f8bb8b64d49b`.

The earlier joined acceptance used Stripe CLI forwarding and a Wrangler remote-preview proxy. This second acceptance deployed the actual production commerce handler to a dedicated, temporary Cloudflare Worker and registered its HTTPS webhook endpoint directly with the verified Stripe **test-mode** merchant.

## Direct endpoint acceptance

- Actual application-created Checkout used the independently verified tax-exclusive GBP **£9** test Price.
- Stripe's supported `tok_visa` test-card token completed that exact Session. Stripe sent the authentic paid callback directly to the deployed HTTPS Worker, without a local listener or forwarding relay.
- The application issued the exact remote EU D1 entitlement and authorised private EU R2 download. The 3,967-byte archive matched SHA-256 `d1a23812ab4a80ccaaa28978b90b0e71f3f035063b4745f61b56bf76c51f19d7`.
- A genuine Stripe test refund caused the matching direct callback to revoke order and entitlement. Independent D1 readback confirmed exactly one revoked entitlement, amount 900 pence, and the exact Stripe paid event ID processed once.
- The genuine declined-card test remained unpaid with `card_declined`, no fulfilment and HTTP 409 for download.
- Prepayment delivery, wrong claims and forged signatures were denied. Idempotent Checkout and webhook replay passed; paid replay after refund did not restore access.
- Deliberate replay tests serialised the authentic Stripe event and **locally signed the replay** using the isolated endpoint's signing secret. Those replays are separate from the original callback delivered by Stripe.

Only the webhook route was public; other sandbox routes required an independent high-entropy operator header in addition to ordinary order claims. Credentials were stored through Wrangler secret bulk from private process input, never in Git or public output. Dedicated sandbox D1/R2 were used; production commerce state was not mutated.

The temporary Stripe endpoint and test Worker were removed after the acceptance. Stripe endpoint readback returned 404; the temporary local secret file was removed. This proves the deployed endpoint path but does not claim a permanent production payment endpoint is active.

Private machine evidence: `~/.config/woe-ops/agent-shop-sandbox-20261010/deployed-20261010/acceptance.json`, with private Session, refund and endpoint records beside it. The private repeatable harness is `deployed-acceptance.py` in the parent directory.

## Independent production release

Merged PR #41 passed exact-head CI and main CI run [38055902691](https://github.com/AyobamiH/agent-shop-products/actions/runs/38055902691). The owner-local guarded release independently accepted a candidate and promoted source `67aea5877f2ad49e8041957d1b21f8bb8b64d49b` at 13:33:29 UTC:

- Worker version: `a7d13988-525c-491e-be8e-5ebf788b09e2`.
- Deployment: `eca82177-0aef-4518-a9fd-0099514f2d58`.
- Production and candidate readbacks: **33 original products, 990 external capabilities, 20 coding bugs, ten crawler identities**, expected machine-readable surfaces, canonical HTTPS origin.
- Public private-kit offer remained `planned`, commerce disabled. No live money, buyer, conversion or sale claimed.

Remaining commercial work is recorded concretely in [the launch terms draft](PRIVATE_KIT_LAUNCH_TERMS_DRAFT.md). Payment-test success does not supply an approved public non-home seller address, working support channel, tax assessment or approved purchase commitments.
