# Agent Shop — independent search and assistant citation acceptance

## Objective (14 November 2026)

Agent Shop should be discovered through Google/Bing and cited as a relevant external
source in ChatGPT, Claude and other assistant answers. These are different outcomes.
Indexing, crawler accessibility, search impressions, AI citations, consented referral
sessions, qualified enquiries and sales must have separate evidence and denominators.

This is a one-shot acceptance procedure, not a second indexing watch, dashboard,
third-party subscription, paid model-evaluation service or automated citation claim.
The existing indexing monitor stays read-only; Search Console Operator supplies
the existing GSC and GA4 reporting capability.

## Dated baseline

- Official Google snapshot, 14 November 09:31 UTC: 52 live sitemap URLs;
  27 indexed, 3 discovered-not-indexed, 22 unknown, zero inspection errors.
- Public access probes on 14 November: robots, sitemap, agent discovery text,
  machine-readable catalogue and a sampled product Markdown returned HTTP 200;
  spoofed crawler user agents passed, not proof of real crawler visits.
- Agent Shop GA4, 15 October–11 November: four consent-observed sessions, two
  labelled Threads and two unattributed. No assistant-labelled sessions observed.
  Prior referrer suppression means this does not prove there were no AI referrals.
- Direct GSC for that period: 12 Agent Shop search impressions and zero clicks.
- Independently verified assistant citations: NOT YET MEASURED. No positive or
  zero citation claim can be made from the existing evidence.

## First independent, unbiased questions

Run these in separate clean, search-enabled ChatGPT and Claude sessions.
Do not include Agent Shop, the target URL or the expected product name in the
prompt. Do not force the models to cite the site.

| ID | Problem-led question | Published URL to evaluate |
| --- | --- | --- |
| coverage | How should a collector reconcile Google Search Console discovered-but-not-indexed states when punctuation changes? | /products/auditable-indexing-state-reconciliation |
| admission | How can I distinguish CI tests failing from a job that never started due to runner or billing admission? | /products/ci-admission-and-fallback-triage |
| lease | How can a durable agent prevent stale leases from allowing overlapping jobs after a crash? | /products/stale-lease-recovery-and-single-flight |
| effects | How do I verify that a production API repair actually took effect rather than only returning local success? | /products/evidence-first-live-diagnostic-repair |
| states | How should an agent distinguish configured, tested, deployed and independently observed outcomes? | /products/state-transition-evidence-contract |

## Citation acceptance

For every attempted question privately record provider, model/version, whether
search was enabled, exact question, observed UTC time, answer transcript or
screenshot digest, source links shown by the assistant and answer share URL if
available. Never publish private conversations or credentials to Git.

A VERIFIED citation requires independently examining the actual assistant answer
and confirming an exact canonical published Agent Shop sitemap URL appears as
an assistant-generated source responding to that question. A link supplied
in the prompt, a search snippet, or a referrer record is not a citation.
Mark a real answer without the link as NOT_CITED; unavailable or ambiguous
answers as UNKNOWN; unexamined screenshot assertions as UNVERIFIED.
The denominator is successfully inspected answers, not all attempted prompts.

## Conversions and reporting

Agent Shop now derives fixed assistant-domain campaign-source labels *after*
fresh optional consent (version 2026-11-14.1); full referring URLs are never
transmitted. The existing Search Console Operator get_ga4_llm_traffic operation
already recognises chatgpt.com, chat.openai.com, claude.ai, perplexity.ai,
copilot.microsoft.com, gemini.google.com and deepseek.com. Use its real GA4
data, scoped to the exact Agent Shop property and hostname, after deployment
and real consented visits. Keep operator diagnostics separate from demand.

An assistant referral is not proof of an assistant citation. Google's AI Mode
and AI Overviews do not expose distinct GA4 referrer sources. Qualified
enquiries, accepted quotes, payments and fulfilment require independent
provider-side evidence. No new monitor, billing, deployment or indexing
submission is authorised by this procedure.
