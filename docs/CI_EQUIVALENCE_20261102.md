# Owner-local CI equivalence under a verified GitHub billing lock

**Decision:** Scoped approval on 2 November 2026 to complete Agent Shop PR #69 through genuine verification, protected review and Cloudflare release. This does not authorise a paid CI purchase, a fake GitHub success, a change to the live seller/commerce policy or silent promotion.

## Why an alternate admission exists

The normal GitHub-hosted `Frontend CI` workflow remains authoritative when it runs successfully. On 2 November, PR-head job [41445411638](https://github.com/AyobamiH/agent-shop-products/actions/runs/41445411638) was **never started**: GitHub's first-party annotation was exactly `The job was not started because your account is locked due to a billing issue.` There were no source tests from that job. It remains a failed GitHub check.

The existing source-governed `scripts/owner-local-release.mjs` supports a narrowly guarded alternative only when every check below passes. The GitHub Actions production workflow and `scripts/check-release-ci.mjs` retain their original strict successful-push requirement. A local result must not be submitted as a synthetic green GitHub check.

## Owner-local alternative: complete evidence, not relaxed tests

1. **Explicit one-SHA approval:** set `AGENT_SHOP_APPROVED_FALLBACK_SHA` to the exact currently reviewed main commit. Without it, the original GitHub green-main gate still fails closed.
2. **Exact source authority:** the repository must be a clean `main` checkout matching current remote GitHub `main`. The exact commit must have a first-party GitHub verified signature. Its Git tree must match the owner-local receipt.
3. **Independent provider cause:** read GitHub's exact-main `push` workflow record, one failed `verify` job with zero executed steps, and the explicit billing-lock annotation from the check-run API. Test or code failures are **not eligible**.
4. **Actual full substitute matrix:** run frozen Bun installation; catalogue and capability validation; integration and credential-free release regressions; catalogue sync with diff parity; Cloudflare-targeted production build; Wrangler dry-run; TypeScript; lint; Vitest; pure discovery contract tests; exact pinned `design.md` lint; the actual Node preview build; and the full Playwright browser E2E sequence. Never mark a stage complete without a zero exit code.
5. **Owner-only reproducible evidence:** a date-stamped record `~/.local/share/agent-shop/ci-<sha-prefix>/equivalent-receipt.json` and individually hashed local logs, all mode 0600, prove which local commands exited successfully. The release checker rehashes every log and refuses a missing/altered/unexpected stage, a wrong SHA/tree or an observation older than 12 hours. The **source commit is cryptographically signed**; the private CI logs themselves are owner-local evidence, not an independent third-party attestation.
6. **Separate final release gates:** `owner-local-release.mjs` still checks exact main and the current Cloudflare 100% deployment identity before writes and again before promotion, builds and tests once more, checks live merchant-policy and D1/R2/ratelimiter identities, verifies an immutable preview, promotes one candidate once and performs independent production readback and identity-fenced rollback on failure.

An accepted local CI-equivalent result is explicitly named `OWNER_LOCAL_EQUIVALENT_PASS`; `githubHostedCiStatus` is `BLOCKED_BILLING`. It is *not* `PASS` for hosted Actions. The private receipt path is never committed to public Git or included in page content. Full checkout and production releases remain separate.

## Non-goals and future retirement

This exception does **not** enable new automated GitHub-hosted deployments, bypass a code failure, falsify CI, turn a passing local test into a CircleCI provider receipt, grant new commercial authority, or imply Google indexing or customer payment. It should only be used while an actual first-party GitHub admission-lock observation persists. Once the hosted account can run CI, return to the normal successful exact-main push path. Preserve the original failure and any outcome in the private release ledger.
