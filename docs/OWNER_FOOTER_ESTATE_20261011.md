# Owner footer rollout — 11 October 2026

The owner supplied the trading identity TAIL-WAGGING WEBSITES DESIGN FACTORY NORTHAMPTON, location Northampton, Northamptonshire, UK, NN4 6LZ, and public contact number 07402342694. The owner confirmed that this business is a sole trader and is not VAT registered.

The public builder credit is **Built by TAIL WAGGING WEBSITES DESIGN FACTORY NORTHAMPTON**, linked to https://tailwaggingwebdesign.com/. Phone links use tel:+447402342694. No UTR was retrieved or included in these changes.

## Scope and source

Twelve active site repositories were changed. Product branding and existing backend configuration were preserved. Shared application footers and applicable standalone public pages were updated. Archived repositories and unrelated third-party forks are outside this rollout.

| Repository | Merged PR | Footer source on main |
| --- | --- | --- |
| agent-shop-products | [43](https://github.com/AyobamiH/agent-shop-products/pull/43) | `289b773d3059c1b94cb870f1411f9ed3072f4d06` |
| proof-and-state-website | [31](https://github.com/AyobamiH/proof-and-state-website/pull/31) | `cf7e62f7e01e84297b3afed0d4532680ad180931` |
| wagging-web-wins | [114](https://github.com/AyobamiH/wagging-web-wins/pull/114) | `24b1c9d4002f44b193b5ea33aa816847ffb8e278` |
| oneclickpostfactory | [39](https://github.com/AyobamiH/oneclickpostfactory/pull/39) | `9478a2837697466feecc0db84064850797fe3c22` |
| oneclickwebdesignfactory | [19](https://github.com/AyobamiH/oneclickwebdesignfactory/pull/19) | `f0a8990cdc5f3fb3a518f622fd06bfa3188b77be` |
| ai-website-decoder | [10](https://github.com/AyobamiH/ai-website-decoder/pull/10) | `c48dceed9d29672d8bdaafcf74c71505c740aa4e` |
| wagging-websites-co | [8](https://github.com/AyobamiH/wagging-websites-co/pull/8) | `61ddb39758aace5e1669c920b862d8d512ade476` |
| poststeward | [195](https://github.com/AyobamiH/poststeward/pull/195) | `3d0e9ebaf961e3283217da5ec685f7db9aef3a88` |
| poststeward-showcase | [24](https://github.com/AyobamiH/poststeward-showcase/pull/24) | `cfe8da435427cbe425e4d5fdebe3cccf2771e891` |
| oneclick-chatgpt-plugin | [14](https://github.com/AyobamiH/oneclick-chatgpt-plugin/pull/14) | `f8a2b76341b212011e1e80d9f90ca6dce6246b1e` |
| global-bill-forge | [7](https://github.com/AyobamiH/global-bill-forge/pull/7) | `d65a245471c528a7bd30054e94b0808562e3f732` |
| opstruth | [22](https://github.com/AyobamiH/opstruth/pull/22) | `966b0489e2ca6ccfd284f914ef3a048a8564a839` |

PostSteward's existing protected production release was requested in [PR 196](https://github.com/AyobamiH/poststeward/pull/196), source `9fd549bea3c094abe38a75b331a3c60967fdad7b`; production workflow [38117419073](https://github.com/AyobamiH/poststeward/actions/runs/38117419073) succeeded.

One Click's Cloudflare Pages preview uses its existing `cloudflare-live` production branch. The tested shared footer was backported without changing the rest of that branch in [PR 20](https://github.com/AyobamiH/oneclickwebdesignfactory/pull/20), source `d268cc104b8d21115c97b48904df6e79729afd5f`. Cloudflare Pages reported successful production deployment at 2026-10-11T06:22:30Z. The canonical custom-domain homepage is hosted by Lovable, whose project reported synced main source `f0a8990cdc5f3fb3a518f622fd06bfa3188b77be`. A publication request through the existing Lovable host (deployment `0b72e010-e8f5-4765-ab70-d82442e10213`) returned pending; the public domain continued to show its previous deployment and old footer. An internal Lovable source read also returned the old footer, despite the external synced revision reported by project metadata. A host-local footer edit was prepared, but its actual diff additionally included generated Supabase auth/storage/type changes. Those changes were not authorised by the footer task, so this new edit was not published. The editing service then refused to restore the generated files, saying its History interface is required. No callable History restore operation was exposed. The canonical homepage therefore remains incomplete; the Cloudflare previews and /chatgpt surface are updated. Host-local edit `fe8d5a3c0e8b1482ee513f7a6d02d026e5fc4d58` is unpublished, and its fresh build after restoration is unverified. The main-branch update also covers the standalone /chatgpt pages.

One Click Post Factory's frontend deployment [38117114329](https://github.com/AyobamiH/oneclickpostfactory/actions/runs/38117114329) succeeded.

## Live verification

Fresh unauthenticated Chromium checks at 390 px and 1440 px passed 26 of 28 cases: 13 of 14 public surfaces. The canonical One Click homepage still shows its old footer and is blocked as described below. Every passing case returned HTTP 200 after any redirect; the exact linked credit, phone link and postcode were visible; the credit fitted within the viewport, was focusable, and the page had no horizontal overflow. Raw observations are in [owner-footer-20261011.json](evidence/owner-footer-20261011.json).

| Public surface | Mobile 390 px | Desktop 1440 px |
| --- | --- | --- |
| https://agents.proofandstate.com/ | Pass | Pass |
| https://proofandstate.com/ | Pass | Pass |
| https://tailwaggingwebdesign.com/ | Pass | Pass |
| https://tools.tailwaggingwebdesign.com/ | Pass | Pass |
| https://automation.tailwaggingwebdesign.com/ | Pass | Pass |
| https://bookings.tailwaggingwebdesign.com/ | Pass | Pass |
| https://oneclickwebsitedesignfactory.com/ | Blocked | Blocked |
| https://oneclickwebsitedesignfactory.com/chatgpt/ | Pass | Pass |
| https://globalbill.tailwaggingwebdesign.com/ | Pass | Pass |
| https://oneclickpostfactory.com/ | Pass | Pass |
| https://poststeward.com/ | Pass | Pass |
| https://app.poststeward.com/ | Pass | Pass |
| https://oneclick-chatgpt.woeinvests.workers.dev/ | Pass | Pass |
| https://opstruth.io/ | Pass | Pass |

The bookings hostname redirects to the automation bookings section. One Click Post Factory redirects to its www hostname.

## Checks and limits

All twelve implementation pull requests had passing checks on their reviewed heads before merging. PostSteward's production release request and One Click's production-branch backport also passed their checks.

Relevant builds and targeted footer checks passed. One Click's main branch retains unrelated existing whole-repository lint failures (86 errors and 65 warnings); the changed footer passed targeted lint. OpsTruth's completion checks passed with Git commit signing disabled only for isolated test fixtures; existing scanner warnings and ignored bare-import warnings remain recorded in its preflight evidence.

The shop's guarded candidate and production acceptance checks passed at source `289b773d3059c1b94cb870f1411f9ed3072f4d06`, version `7b3d16af-bb63-4ff1-bc2d-2c35c5be66d7`. Its 33 owned products, 990 external entries (111 skills, 868 tools, 11 controls), 20 coding-bug entries and 10 crawler-agent entries were retained. Commerce remains inactive. The owner-supplied seller facts were added to the private-kit terms draft; this did not activate payments or finalise the remaining draft terms.

This evidence update is documentation only. It does not imply a new deployment of the documentation commit.
