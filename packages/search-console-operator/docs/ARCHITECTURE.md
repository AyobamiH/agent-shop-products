# Architecture and reuse

## Package boundary

This package is an independent Search Console product inside the repository. Its MCP endpoint exposes reporting capabilities. It does not add a shopping MCP interface or change Agent Shop's CLI-first catalogue decision, catalogue records, commerce paths or existing Google operator commands.

The current target is one owner operating locally. There is no hosted account system, warehouse, continuous collector, GA4 connector, AI analysis, alert delivery or public multi-tenant service in this milestone.

## Request flow

| Layer | Responsibility |
| --- | --- |
| [CLI](../src/cli.mjs) and [MCP](../src/mcp.mjs) | Parse transport inputs and return the shared result or a bounded public error. |
| [Contracts](../src/contracts.mjs) | Define the twelve names, strict argument schemas, discovery metadata and side-effect annotations. |
| [Service](../src/service.mjs) | Resolve scope/windows, require current property access, dispatch reports and persist their results. |
| [Reporting](../src/reporting) | Request independent totals, daily/row views and position distributions; preserve status and units. |
| [Core](../src/core) | Validate canonical queries, page through Google responses and perform pure metric calculations. |
| [Authentication](../src/auth) | Bind consent and refresh to the expected owner; permit only approved Google endpoints and Search Console read operations. |
| [Storage](../src/storage) | Validate envelopes, canonicalise JSON, publish immutable files and verify replay integrity. |

The provider receives an injected `session.request(endpoint, {method, body, signal})`; it never opens a credential file. Pure arithmetic and date modules perform no network or storage operations. This boundary supports synthetic testing and later adapters without altering report calculations.

## Collection and metric evidence

Internal pages contain at most 1,000 rows. A canonical query permits up to 50,000 rows, with a defensive ceiling of 60 requests, 2,000,000 bytes per response and 32,000,000 captured response bytes per collection. Public tool limits are narrower. Exceeding a collection budget after valid rows returns a partial result; an initial failure returns a safe error.

Every collection records requests, requested offset/limit, returned count, exhaustion, continuation and reasons. A full page at the requested cap does not establish exhaustion. Duplicate ordered dimension tuples remain in the evidence and mark the collection partial; reporting does not silently sum them as reliable observations. Abort signals interrupt collection, and the service does not persist a cancelled report.

Raw provider CTR uses a fraction. The reporting boundary converts it once to a percentage; weighted aggregate CTR is calculated from total clicks and impressions. Position uses impression weights and becomes null when the available rows cannot establish it. Zero denominators and zero comparison baselines have explicit states.

Independent aggregate requests supply report totals. Page aggregation can differ from property aggregation, so the source aggregation type travels with each section. Query residual estimates require compatible known aggregation and an exhausted scan from offset zero. They do not recover hidden queries or establish complete search history. [Google documents these API limits and aggregation semantics](https://developers.google.com/webmaster-tools/v1/searchanalytics/query).

## Persistence and replay

The version-1 snapshot envelope includes original tool arguments, resolved result, capture time and calculation version. Canonical JSON produces a SHA-256 identifier. Saving publishes an owner-only immutable file; an existing digest is verified before reuse. Loading verifies the canonical bytes, schema, calculation version and digest. Corrupt or unsupported snapshots fail explicitly.

The store's default ceiling is 32 MiB per snapshot. Replay returns the stored calculation result, preserving gaps, partial collection reasons, source metadata and unknown values. It does not rerun a query, use today's date or apply a newer algorithm. Changing behaviour requires a deliberate calculation/schema version decision. Collection, snapshot and MCP output limits are independent; a result can fit one boundary and exceed another.

## Reuse and provenance

Owner authentication, bounded HTTP transport and private-file patterns were adapted from this repository's [direct Google operator](../../../scripts/google). The new package narrows fresh consent to Search Console reads and introduces its own service, collection and persistence modules. The existing operator remains separate.

The locked dependencies are the official [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) server/client packages, version 2.3.1, under Apache-2.0, and [Zod](https://github.com/colinhacks/zod), version 4.6.7, under MIT. Exact versions, integrity hashes and dependency licence metadata are recorded in [package-lock.json](../package-lock.json). The client SDK is a development dependency for transport verification.

GSC Wizard's public tool contracts informed the input/reference map at source revision [`0dbf49be0e2c8eb2f6a5e53c524ec1eb4e489284`](https://github.com/jbobbink/seo-gsc-wizard/tree/0dbf49be0e2c8eb2f6a5e53c524ec1eb4e489284). Its private implementation was not copied. [iannuttall/seo](https://github.com/iannuttall/seo) remains a potential Apache-2.0 reuse candidate; it is not a dependency and no component from it has been adopted in this milestone. Selecting a licence and preparing notices for public distribution remain release work.
