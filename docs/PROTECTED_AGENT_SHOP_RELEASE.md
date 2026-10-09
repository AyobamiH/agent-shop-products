# Agent Shop protected production release — v1

This is the release source of truth for `agents.proofandstate.com`. Public catalogue and machine discovery are **not** evidence of a purchased private kit.

## Admission and operator authority

The `production` GitHub Environment exists and permits deployment **only from the exact `main` branch**. A manual dispatch must point to current `refs/heads/main`. The release job checks that its exact `github.sha` still equals the latest remote `main` and that a completed, successful `push` run of `frontend-ci.yml` has that exact head. This check is repeated immediately before production mutation. CI and Cloudflare credentials are completely separate; `actions/checkout@v6` persists no token. The environment variable `CLOUDFLARE_ACCOUNT_ID` must match the specific authorised Cloudflare account. The environment secret `CLOUDFLARE_API_TOKEN` must be an explicit, scoped, validated token **owned by the operator**, not the local minting/bootstrap authority. Never print or commit it. Branch restriction does not, by itself, require human reviewers; owner approvals for commercial terms and real money are a different gate.

Until GitHub Environment secret custody is configured, this workflow fails closed **before any upload**. The previous independent, locally-authorised Cloudflare API promotion of product-source SHA `1307359a8585290324b33049c337d3450231168e` remains a separate historical release and must not be called an Actions deployment. The workflow itself does not change DNS, submit indexing requests, create checkouts or invent a sale.

## Exactly reviewed deployment sequence

1. Require verified account and token presence (no values logged).
2. Require current main and passing exact-head push CI; unit-test CI and rollback contracts.
3. Install frozen Bun lockfile, build with exact `VITE_SITE_ORIGIN=https://agents.proofandstate.com`, run typecheck, lint and Wrangler dry-run.
4. Upload one immutable, SHA-tagged Worker Version. Do **not** promote. Parse exactly one version ID and exactly one matching Cloudflare version URL. Reject alias-domain substitution or ambiguous version IDs.
5. Independently read back the version URL using source canonical origin, real 33 owned products, 990 advertised external capabilities, 20 coding bugs, ten crawlers, sitemap, raw metadata and disabled private-kit commerce. Any HTTP 503 aborts **before promotion**.
6. Verify the candidate Cloudflare version's SHA tag and exact D1, private EU R2 and rate-limiter binding identities; refuse any `COMMERCE_ENABLED=true` setting.
7. Reconfirm current exact-main CI immediately before mutation; compare previous active 100%-traffic version with control plane; refuse traffic splits or unexplained drift.
8. Promote once via Cloudflare Worker Deployments REST API. If POST times out, re-read control-plane active version before considering another mutation. Do **not** blindly retry POST.
9. After bounded edge-convergence retries, independently check production again. If the candidate is still active but readback fails, roll back **only that candidate** to the captured prior Worker version and confirm rollback from the control plane. If a different operator has since promoted a different version, never roll that newer version back.
10. Record evidence in GitHub Actions summary: SHA, deployment/version IDs, observed outside-in acceptance and rollback verdict; no tokens, customer details or credential data.

## Commercial controls and exceptions

The current protected release enforces **commerce disabled**: the one private execution kit is `planned`, without a public price, active Buy button or entitlement. Paid activation requires independently approved owner commercial terms, seller identity, GBP tax-exclusive Price, licence/refund/support conditions, exact verified EU private deliverable, Stripe test-mode end-to-end/replay/refund acceptance and a separately reviewed workflow policy change. A successful version upload or D1 migration does not satisfy those merchant gates.

Cloudflare Worker Versions do not roll back D1 or R2 state; preserve order/event/refund tombstones during any Worker rollback. The safe rollback pointer is an exact previously deployed Worker version, never an unspecified `latest`. GitHub workflow status, version upload, active deployment, independent public readback, Google indexing and paid real customer effects must be reported separately.

## Recovery cases

* Missing environment token/invalid account: abort before candidate upload; use approved owner token broker to create narrowly scoped deployment authority, then authorise environment secret custody. Do not paste bootstrap/root tokens into GitHub.
* Missing postmerge CI/stale `main`: abort without mutation; fix actual CI or review new HEAD, then dispatch a new run.
* Cloudflare candidate HTTP 503: inspect Nitro inner-worker env handling and candidate binding identities; never make the acceptance status optimistic.
* Ambiguous Cloudflare deployment response: independently reconcile active deployment instead of repeating a failed `POST` blindly.
* Public readback timeout/404 during convergence: bounded retries, then candidate-specific rollback, evidence and alert; don't turn the gate off.
* GitHub runner/browser dependency drift: `ubuntu-24.04` pinned; upgrade in tested PR rather than silently inheriting `ubuntu-latest` changes.
* Commercial D1 / R2 failure: fail closed, do not accept or acknowledge paid delivery without verified entitlement and available private asset.

References: Cloudflare Workers versions and deployments, Cloudflare Worker Deployments REST API, GitHub Actions deployment environments, Stripe Checkout and webhook fulfilment documentation.
