# Cross-product GA4 / Search Console via direct Google APIs

Owner-local, read-only measurement. This reuses the independently verified
Google OAuth / Analytics Admin / Analytics Data / Search Console integration
already used by Agent Shop. It does not call GSC Wizard, create a separate
Google consent client, require a subscription, edit Google configuration,
emit pixels, change Post-Once credentials or publish social posts.

## Run

Use the merged, clean Google operator checkout and existing owner-local
Google Desktop OAuth grant under ~/.config/agent-shop-google/:

    node scripts/google-operator.mjs inventory
    node scripts/google-operator.mjs portfolio-report \
      --start 2026-10-01 --end 2026-10-16 --gsc-end 2026-10-14 \
      --social-file /tmp/your-reviewed-social-receipt-summary.json

The optional input is owner-only JSON, schemaVersion 1, containing exact
approved project/campaign/provider, publication status and optional provider
permalink/impressions. The report never reads social tokens or writes social
state. An independent existing Post-Once process generates this public
social evidence. Output is private under
~/.config/agent-shop-google/portfolio-attribution.json, with a compact
status on stdout.

## Verified owner property/stream scopes

The checked-in scopes in scripts/google/portfolio-scopes.json came from
the owner's live Analytics Admin inventory on 17 October 2026.
Each cycle checks exact numeric property ID, stream ID, measurement ID,
web-stream origin and Google permission.

- Tail Wagging: property 501768556, stream 12047470834,
  measurement G-70BM3BDSEJ. Older property 470183466 duplicates the
  same site's traffic; never add them together.
- OpsTruth: property 558016559, G-55ENMEPB2Y.
- Proof & State and DoneState: property 559326765, G-FCN2PNH422.
  DoneState is just a specific page path on that shared host; do not
  attribute all its sessions to DoneState.
- Agent Shop: property 559055643, G-9LH3DJYS4B.
- One Click: property 558050749, G-ND2N8M7BF2.
- OneClickPostFactory: newly provisioned property 559372276, stream
  16146488615, measurement G-DWLNXGNBV6.
- GlobalBill: newly provisioned property 559374343, stream
  16146511219, measurement G-TBFMEGYPC7.
  Both properties/streams were owner-authorised, provisioned using the
  existing Google API, verified with privacy-first settings (enhanced
  measurement off, Signals disabled, two-month data retention, redaction).
  No site tag was installed by the Google resource creation step.
  Until a consent-bound tag is deployed and events genuinely arrive,
  website sessions are UNOBSERVED, not zero traffic.
  Public GitHub projects are external source links, not owned GA4 sites.

GSC site ownership is verified through the Search Console API. All GSC
results are checked against exact canonical hostname and URL-path rules,
so a broad GSC domain property does not misassign child subdomain traffic.
GSC reports only organic Google Search clicks/impressions and can omit data;
it is not Post-Once social reach or GA4 sessions.

## Processing / conversion boundaries

GA4 sessions are scoped to exact hostname, web-stream ID and campaign
via sessionCampaignName, sessionSourceMedium and sessionManualAdContent.
The last approximately 48 hours are preliminary. Missing exact campaign
rows are reported as websiteSessions=null, not fabricated zero conversions.

Key events registered in Analytics Admin are distinguished from observed
event counts. A recorded purchase, signup, enquiry or button click is NOT
proof a paying client exists, a Stripe charge settled or an agent task
completed. Only independent provider receipts, signed Tail Wagging
business-outcome evidence and matching customer records can prove that.

This operator is not loaded by any website Worker, Post-Once publisher,
timer, D1 or Stripe fulfilment engine. Consent, site instrumentation,
GA4 property/stream provisioning, key event configuration and data-retention
changes require their own bounded evidence-backed implementations.
