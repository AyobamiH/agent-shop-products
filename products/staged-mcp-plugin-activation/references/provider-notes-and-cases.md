# Provider notes and acceptance cases

Checked 8 October 2026. Recheck before a later submission.

[OpenAI submission guidance](https://developers.openai.com/plugins/deploy/submission) currently requires MCP in the initial package when used. Adding it to a published skills-only plugin is unsupported. Initial MCP review needs exactly five positive and three negative cases executed on the test account, plus an accessible video walkthrough. Skills-only submissions have different requirements. An upload may accept incomplete review material; this does not establish submission readiness.

[MCP annotation guidance](https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/) treats annotations as behavioural hints. They do not enforce permission or make external output trustworthy.

| Acceptance case | Evidence required |
| --- | --- |
| Package references | Inspect exact archive, included resources and manifest links |
| Ownership | Provider verification readback on the canonical host |
| Discovery | Actual tools/list output with expected schemas and annotations |
| Allowed migration | Historical fixture preserved; only named fields differ |
| Positive behaviour | Actual supported tool results for every required scenario |
| Negative behaviour | Actual safe refusal, clarification or bounded fallback |
| Privacy repair | Code/policy reconciliation and fresh provider finding state |
| Public owner test | Exact public listing, actual connection and minimal result |
| Independent acceptance | A separate clean-account result where required |

Do not mark a case executed merely because this checklist exists.
