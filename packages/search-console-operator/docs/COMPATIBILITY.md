# Compatibility and behaviour

## Supported scope

This milestone implements twelve names from the 131-tool discovery inventory. It uses an **independent response schema**, not GSC Wizard's private service, widget output or account/subscription model. Successful numerical equivalence against that service has not been established. All 119 other reference tools remain unimplemented in this milestone.

Nine reporting tools read Google and write a private local snapshot. Three metadata tools do not create report snapshots. Normal OAuth refresh/rotation can still maintain connection files.

| Tool | Implemented behaviour | Snapshot |
| --- | --- | --- |
| `get_account_info` | Verify the connected identity and report this package's capabilities. | No |
| `list_sites` | List actual Search Console property identities and permissions. | No |
| `get_filter_options` | Report supported filter syntax and explicitly unavailable selectors for an accessible property. | No |
| `get_site_summary` | Independent current/prior aggregates, comparison states and current daily rows. | Yes |
| `query_search_analytics` | Ordered dimensions, AND filters, search type and explicit row offset/limit. | Yes |
| `query_top_queries` | Named query rows with independent totals and coverage. | Yes |
| `query_top_pages` | Landing-page rows with separate aggregate totals. | Yes |
| `query_countries` | Country rows preserving provider alpha-3 codes. | Yes |
| `query_devices` | Device rows preserving provider labels. | Yes |
| `get_page_performance` | Date rows filtered to an exact page URL. | Yes |
| `get_query_performance` | Date rows for an exact query, optionally an exact page. | Yes |
| `get_position_distribution` | Period bands for query/page rows; daily mode uses distinct date/query tuples. | Yes |

Brand, content-group and topic-cluster selectors are recognised but explicitly refused with `FEATURE_NOT_IMPLEMENTED`. `get_filter_options` reports this limitation; it does not invent saved configuration. Hosted sharing, property activation and vendor subscription entitlements are absent. Property access is checked against the connected Google account.

## Date policy

Dates are inclusive calendar dates in `America/Los_Angeles`. With neither edge provided, the window is 28 days ending on Pacific today minus three days. This is labelled a **heuristic**; it is not proof of Google's latest settled date. Reports request `dataState: final`, and collection evidence retains any provider maturity metadata.

Both explicit edges win. With only `endDate`, the other edge is `endDate - days + 1`. With only `startDate`, it is `startDate + days - 1`. The duration defaults to 28; `get_site_summary` also accepts `days`. Explicit windows carry `cutoff: explicit_request`, not a claimed three-day lag. Invalid, reversed, future or longer-than-180-day ranges are refused.

Summary comparisons use the immediately preceding window of identical length. Missing daily rows remain absent. The reference documentation is inconsistent about a lone start edge; the rule above is the intentional local contract.

## Rows, order and limits

Raw queries accept date, query, page, country, device and search-appearance dimensions; duplicate dimensions are refused. Filters are ANDed. Omitted operators use `equals`. Exact page/query filters preserve case and text, while regex matching is delegated to Google's RE2 implementation.

The public raw-query limit is 25,000 rows per call; top-query/page/country wrappers allow 1,000 and default to 100. Position scans allow 25,000. Internal collection divides larger requests into bounded pages. A continuation offset is a possible next request, not proof that additional rows exist.

Google controls source ordering: clicks descending for ordinary rows and date ordering where applicable. Equal-click ordering is not stable. Pagination can therefore expose collisions; these remain explicit. A terminal page establishes exhaustion of that API response, not complete underlying data. Google can omit anonymised and other low-volume rows; increasing a limit cannot recover withheld data. See the [Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query).

## Numbers and result states

Provider-level CTR is fractional; public report CTR is a percentage. An anomalous provider rate above one is retained with a limitation rather than clipped. Coverage shares stay fractional, and comparison `percent` is percentage change. Position-band boundaries are `1..3`, `>3..10`, `>10..20` and `>20`, without rounding reported average positions. Missing/unusable positions stay unclassified. Distributions describe returned rows only.

Current and prior totals come from separate dimensionless provider queries. Report sections keep aggregation types and filters attached; page-row sums never replace property totals. A missing denominator or unknown baseline produces null values with an explicit comparison state. A successful empty aggregate is labelled `no_reported_data` with null totals; a returned zero-valued aggregate preserves those measured zeros. Both differ from a failed request. Absent daily observations are not filled with zero.

`complete` means the requested collection finished and observed response exhaustion. It does not guarantee every search event. `partial` preserves valid observations together with cap, collision or later-failure reasons. `failed` preserves an error state instead of invented activity. Query residual estimates are labelled estimates and require compatible known aggregation; they do not identify the undisclosed queries.

## Current release boundary

CLI and MCP call the same service and retain the same schema. CLI snapshot replay restores captured evidence without Google access. There is no HTTP API, hosted MCP, dashboard, warehouse, GA4 analysis, forecasting, crawling, link monitoring, scheduled alerts or billing integration yet. Functional and fixture tests are separate from fresh-account live acceptance and public release readiness. See the [architecture](ARCHITECTURE.md) for boundaries and provenance.
