# Current capability inventory

Captured on **8 October 2026**. The complete names-only authority is [catalog/capability-inventory.json](../catalog/capability-inventory.json).

| Surface | Count | Interpretation |
| --- | ---: | --- |
| Distinct skill names | 109 | Exact-name deduplication; implementations are external |
| Cloud skill entries | 94 | All catalogue pages enumerated |
| Executor skill entries | 88 | All catalogue pages enumerated |
| Combined skill surface entries | 182 | A name may occur on both surfaces |
| Advertised registry tools | 868 | Exact current tool names, not successful-call claims |
| Tool provider groups | 38 | Registry provenance or namespace grouping |
| Separate orchestration controls | 11 | Declared outside the advertised registry; not added to its count |

This snapshot describes one session. It does not enumerate unconnected remote MCP servers or every lifetime invocation. An advertised capability is not automatically installed, connected, authorised, tested or customer-ready. Names repeated across provider surfaces do not prove identical implementation.

## Tool provider groups

Every individual tool name is preserved in the JSON inventory. Only names and provider labels are published; instruction bodies, schemas containing privileged instructions, account identifiers and implementation files are excluded.

| Provider | Advertised tools |
| --- | ---: |
| Atlassian | 22 |
| Automations | 7 |
| Cloudflare Docs | 2 |
| Cloudinary | 23 |
| DoneState | 19 |
| DoneState Account Controls | 2 |
| Figma | 42 |
| GitHub | 89 |
| Gmail | 21 |
| Google Calendar | 15 |
| Google Drive | 45 |
| GSC Wizard | 125 |
| Health | 9 |
| HeyGen | 91 |
| Hotline | 1 |
| Image Generation | 1 |
| Linear | 74 |
| LinkedIn | 1 |
| Lovable | 41 |
| Metricool | 9 |
| One Click | 1 |
| One Click Review 1.0.1 | 1 |
| OpenAI Library | 11 |
| Outlook Email | 38 |
| Pages | 40 |
| Parallel Search | 2 |
| Personal Context | 1 |
| Pets | 11 |
| Plugin Management | 6 |
| Remote Desktop Commander | 31 |
| RUBE | 6 |
| Runtime | 8 |
| Safety Settings | 5 |
| Sites | 25 |
| Skills | 2 |
| Stripe | 11 |
| Supabase | 29 |
| Web Search | 1 |

RUBE remains excluded from execution under the owner's constraint. Metricool is outside the reviewed native LinkedIn campaign. Neither was invoked to create this inventory.

## Complete skill-name inventory

These are external dependencies, not 109 Agent Shop products. The shop publishes its own original reviewed procedures through its existing product contract.

| Skill | Advertised surfaces |
| --- | --- |
| `answers-charts` | executor |
| `answers-images` | executor |
| `answers-pronunciation` | executor |
| `answers-quizzes` | executor |
| `app-698c5319a3c8819180537c0c37cde979:build-with-one-click` | cloud, executor |
| `codex-security:assess-patch-risk` | cloud |
| `codex-security:attack-path-analysis` | cloud |
| `codex-security:deep-security-scan` | cloud |
| `codex-security:define-security-policy` | cloud |
| `codex-security:finding-discovery` | cloud |
| `codex-security:fix-finding` | cloud |
| `codex-security:propose-security-hardening` | cloud |
| `codex-security:security-diff-scan` | cloud |
| `codex-security:security-scan` | cloud |
| `codex-security:threat-model` | cloud |
| `codex-security:track-findings` | cloud |
| `codex-security:triage-finding` | cloud |
| `codex-security:validation` | cloud |
| `codex-security:verify-fix` | cloud |
| `codex-security:vulnerability-writeup` | cloud |
| `demos:answers-ask-user-input` | cloud, executor |
| `demos:onboarding-artifact-creation` | cloud |
| `demos:onboarding-email` | cloud |
| `demos:onboarding-learn-writing-style` | cloud |
| `demos:onboarding-messaging` | cloud |
| `demos:onboarding-parallel-research` | cloud |
| `demos:onboarding-setup-pet` | cloud, executor |
| `demos:onboarding-website-creation` | cloud |
| `documents` | executor |
| `figma:figma-code-connect` | cloud, executor |
| `figma:figma-create-new-file` | cloud, executor |
| `figma:figma-design-to-code` | cloud, executor |
| `figma:figma-generate-design` | cloud, executor |
| `figma:figma-generate-diagram` | cloud, executor |
| `figma:figma-generate-library` | cloud, executor |
| `figma:figma-generative-plugins` | cloud, executor |
| `figma:figma-implement-motion` | cloud, executor |
| `figma:figma-shaders` | cloud, executor |
| `figma:figma-swiftui` | cloud, executor |
| `figma:figma-use` | cloud, executor |
| `figma:figma-use-figjam` | cloud, executor |
| `figma:figma-use-motion` | cloud, executor |
| `figma:figma-use-slides` | cloud, executor |
| `google-drive:google-docs` | cloud, executor |
| `google-drive:google-drive` | cloud, executor |
| `google-drive:google-drive-comments` | cloud, executor |
| `google-drive:google-sheets` | cloud, executor |
| `google-drive:google-slides` | cloud, executor |
| `health:health` | cloud, executor |
| `heygen:heygen-workflows` | cloud, executor |
| `imagegen` | executor |
| `openai-docs` | executor |
| `openai-library:library` | cloud, executor |
| `opstruth:audit-repository` | cloud, executor |
| `opstruth:reconcile-agent-claims` | cloud, executor |
| `opstruth:review-change-safety` | cloud, executor |
| `opstruth:trace-application` | cloud, executor |
| `opstruth:verify-action-receipt` | cloud, executor |
| `opstruth:verify-release-readiness` | cloud, executor |
| `pages:maintain-space` | cloud, executor |
| `pages:manage-schedules` | cloud, executor |
| `pages:organize-space` | cloud, executor |
| `pages:write-page` | cloud, executor |
| `pdf` | executor |
| `personal-context` | executor |
| `plugin-management:plugin-management` | cloud, executor |
| `Presentations` | executor |
| `product-design:audit` | cloud, executor |
| `product-design:ideate` | cloud, executor |
| `product-design:image-to-code` | cloud, executor |
| `product-design:index` | cloud, executor |
| `product-design:url-to-code` | cloud, executor |
| `remotion:remotion-best-practices` | cloud, executor |
| `remotion:remotion-captions` | cloud, executor |
| `remotion:remotion-create` | cloud, executor |
| `remotion:remotion-docs` | cloud, executor |
| `remotion:remotion-interactivity` | cloud, executor |
| `remotion:remotion-maps` | cloud, executor |
| `remotion:remotion-markup` | cloud, executor |
| `remotion:remotion-multimedia` | cloud, executor |
| `remotion:remotion-render` | cloud, executor |
| `remotion:remotion-saas` | cloud, executor |
| `remotion:remotion-studio` | cloud, executor |
| `remotion:remotion-upgrade` | cloud, executor |
| `resolve-recipients` | executor |
| `sites:sites-building` | cloud, executor |
| `sites:sites-hosting` | cloud, executor |
| `sites:sites-mcp` | cloud, executor |
| `sites:sites-preview-troubleshooting` | cloud, executor |
| `skill-creator` | executor |
| `Spreadsheets` | executor |
| `stripe:connect-recommend` | cloud, executor |
| `stripe:connect-required-verification-information` | cloud, executor |
| `stripe:metronome` | cloud, executor |
| `stripe:stripe-apps` | cloud, executor |
| `stripe:stripe-best-practices` | cloud, executor |
| `stripe:stripe-directory` | cloud, executor |
| `stripe:stripe-docs` | cloud, executor |
| `stripe:stripe-pay` | cloud, executor |
| `stripe:stripe-projects` | cloud, executor |
| `stripe:upgrade-stripe` | cloud, executor |
| `supabase:supabase` | cloud, executor |
| `supabase:supabase-postgres-best-practices` | cloud, executor |
| `template-creator:template-creator` | cloud, executor |
| `visualize` | executor |
| `work-pets:create-pet` | cloud, executor |
| `work-pets:pets` | cloud, executor |
| `work-pets:update-pet` | cloud, executor |
| `writing-blocks` | executor |

## Orchestration controls

- `collaboration.followup_task`
- `collaboration.interrupt_agent`
- `collaboration.list_agents`
- `collaboration.send_message`
- `collaboration.spawn_agent`
- `collaboration.wait_agent`
- `functions.exec`
- `functions.request_user_input`
- `functions.wait`
- `mcp__cua_repl.js`
- `mcp__cua_repl.js_reset`

Control exposure is not permission to send messages, delegate work or operate a browser. Apply the current session's authorisation and relevant skill instructions.

## Known activation distinctions

The latest reviewed record establishes a public One Click owner connection and one synthetic brief result. The response indicates that no project was created or deployed. Its listing version and response-schema version are separate facts.

A separate OpsTruth draft passed provider ownership verification and discovered 21 tools. Those observations do not establish a published MCP integration or a standalone OpsTruth tool in this session registry. Six OpsTruth skills are advertised separately. Candidate repair, human review, runtime deployment, fresh scans and live review cases retain their own states.

Read [the latest work review](LATEST_WORK_REVIEW.md) for dated sources and limits. No activation action was taken by this extraction.

## Refresh procedure

Read every catalogue page, retain provider surfaces, enumerate the current registry and separate controls, update both this summary and the JSON, then run:

```sh
python3 scripts/validate_capability_inventory.py
python3 scripts/validate_catalog.py
```

A successful validator proves metadata consistency, not provider execution. The planned Agent Shop interface remains CLI-first.
