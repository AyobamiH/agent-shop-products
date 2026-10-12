# Launch closeout — 12 October 2026

This checkpoint supersedes older **current-status** paragraphs. Dated historical receipts remain evidence for their own revisions only.

## Authorised scope and observed state

The owner authorised autonomous implementation of the remaining launch work on 12 October. That covers the £9 one-off private kit, buyer documents, discovery, OneClick migration/Full Mode acceptance and recorded hindsight. It does not create missing identity facts or replace external release acceptance.

Agent Shop currently has 33 owned products and 990 external metadata listings (111 skills, 868 tools, 11 controls). External implementations and access rights are not being sold. The private archive remains outside this public repository.

The £9 Stripe sandbox checkout → real deployed webhook → durable order/entitlement → private archive → refund/revocation path passed on 10 October. See [acceptance](DEPLOYED_STRIPE_ACCEPTANCE_20261010.md). It is test evidence, not a live sale.

## Changes in this closeout

- Versioned pre-launch purchase, licence, refund and privacy pages. £9 once; original reference kit; 14-day full-refund policy including after download; 30-day bounded support; no promised upgrades.
- Private kit and policy pages included in the sitemap; kit, integrations, external registry and coding bugs linked in the footer.
- A source-controlled merchant-readiness gate prevents new live checkout while factual checks are missing or conflicting. Historic settlement and entitlement delivery remain independent.
- Commerce changes trigger CI; the old workflow path filters omitted the root commerce directory.
- Bug index records the tax-readiness inference and the missing commercial sitemap entry.
- Current commercial scope documented explicitly; stale frontend-only guidance is superseded for this bounded integration.

## Factual gates that remain open

| Gate | Observed 12 October | Required evidence |
| --- | --- | --- |
| Customer-facing business address | Approved public location only; no legitimate non-home full address supplied | Authorised address suitable for customer disclosure; never publish home address or UTR |
| Monitored support email | Proposed public email unverified; connected live merchant support-email field unset | Working monitored route and recovery procedure |
| Tax treatment | Owner states non-VAT-registered; connected live Stripe account has an active GB tax-registration setting | Resolve the factual mismatch before accepting live payment; do not silently change shared registrations |
| Merchant profile | Individual account; charges and payouts enabled; no currently due requirements; public phone matches; support address/email unset | Align verified public merchant details |
| Buyer record | Pre-launch documents published; retention schedule and durable per-order contract delivery still need completion | Actual saved contract/confirmation and supported recovery acceptance |
| Live commerce release | Remains closed | Verified merchant facts, versioned terms, exact live bindings and outside-in live readiness |

Provider account eligibility is not legal/tax readiness. Stripe automatic tax can complete with no tax collected; it is not proof that registrations are appropriate. The runtime gate does not expire, create or otherwise alter shared Stripe tax registrations.

## Discovery evidence

Search Console inspection on 12 October: homepage, /agents and /integration-services indexed; /capabilities discovered but not indexed; /private-kits and /coding-bugs unknown to Google. The query for 12 September–9 October returned one /shop impression and zero clicks. The settled-through probe timed out. This does not establish total traffic or imply a real purchase.

Search visibility, customer clicks, checkout creation, verified payment, fulfilled download and refund are distinct evidence stages. Never manufacture a buyer or run a real charge to improve the report. A sitemap submission does not guarantee indexing.

## OneClick continuity

Repositories are **AyobamiH/oneclickwebdesignfactory** (website/backend) and **AyobamiH/oneclick-chatgpt-plugin** (native app). Migration PR 17 feeds backend PR 18; native PR 13 is separate. These are different release surfaces from Agent Shop.

Observed source heads: backend b5f65b8a81cff50618fe6f3626e639699b696bee; native 8abe0ebdb0f51c2ee0f43957d295a4272b72012f. Both have successful CI and remain draft. PR descriptions still cited earlier heads; source and deployment claims must be reconciled separately.

Connected Full Mode readback on 12 October confirms trial_active, Full Mode enabled, 25 tickets, no automatic charge, and unavailable paid continuation in the isolated review installation. Two disposable saved projects are readable; the newer record retains its minimalist preset and HTTPS reference. This is actual connected review evidence, not publisher or production approval.

Production migration still requires source MFA administrator recovery, owned Google OAuth, actual mail/payment return, frozen customer reconciliation, live Stripe permissions and rollback. A fresh 12 October 18:37 UTC check confirms www DNS and the canonical redirect now pass. Canonical API JSON, backend health, OAuth discovery, consent and Full native MCP checks still fail. The canonical website still has its old hosting dependency until verified cutover. Do not publish the generated Lovable auth changes merely to gain the final footer credit.

## Hindsight rules

1. Record repository, exact revision, environment and public URL before declaring completion.
2. A green CI run, connected review app, account enabled for charges and indexed page each prove different things.
3. Preserve settlement and recovery while closing admission to new purchases.
4. Keep launch facts in versioned source; retain historical evidence without presenting it as current status.
5. Never infer legal registration from a provider configuration flag.
6. Keep operational changes to unrelated Post-Once processes out of this closeout.

## Implementation validation

Local production build, TypeScript, catalogue validators, unit tests and 13 guarded-release tests passed. ESLint has no errors; existing formatting warnings remain. The built Node preview passes the full outside-in inventory (33 owned products, 990 external listings, 22 coding bugs, 10 crawler identities), versioned legal routes, private-kit sitemap inclusion and unknown-policy 404. Live release requires the separate exact-head CI and deployed readback.
