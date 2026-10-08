# Measurement calibration cases

These examples test interpretation, not actual customer behaviour.

| Input | Required interpretation |
| --- | --- |
| Two retained legacy Analytics Engine rows with sample weights 5 and 10 | Two retained rows representing 15 events; no people count |
| New Analytics SQL API reports COUNT = 15 with automatic weighting | Do not multiply the aggregate by a sample weight again |
| Website analytics is blocked pending consent | Collection is blocked, not a measured zero audience |
| One success appears near a synthetic owner test without a correlation field | Consistent with the test; attribution is unestablished |
| Historical errors have no cause or test marker | Preserve uncertainty; do not invent causes or demand |
| Draft has a new privacy policy but no fresh scanner result | Policy repair exists; finding clearance is unconfirmed |
| Native queue accepts posts but one plugin has no tool connection | Scheduling proof and integration readiness are separate |
| Brief returns projectCreated=false and deployed=false | Brief generation succeeded; project creation and deployment did not occur |

Primary references checked 8 October 2026:

- [Legacy Workers Analytics Engine SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/) documents explicit sample weighting.
- [Analytics SQL API datasets](https://developers.cloudflare.com/analytics/sql-api/datasets/) documents the separate interface and automatic weighting.
- [Analytics SQL API functions](https://developers.cloudflare.com/analytics/sql-api/sql-reference/functions/) describes supported aggregates.
