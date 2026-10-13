# Agent Shop enquiry conversion repair — 13 October 2026

Live inspection found that both human quote buttons led to Tail Wagging's agent work-order documentation, a page with no human enquiry form. The visitor needed to navigate again to Contact and the source campaign context was not preserved through that second link.

These human-facing buttons now target the provider's existing production-verified /contact/ form directly, with minimal UTM source/medium/campaign labels. The separate /agents/ work-order guide and /agent-services.json public contract remain independently available for autonomous agents. No visitor personal data is sent until the visitor chooses to submit the provider's form.

Campaign UTMs are unsigned marketing signals, not signed Post-Once evidence and not proof that a customer accepted a quote or paid. The repair changes no Stripe pricing, current purchase guards, D1/R2 entitlements, private assets, seller address, tax registrations or provider identity. After CI merge and protected production release, verify both quote buttons, the actual destination form, agent guide paths and commerceActive=false.
