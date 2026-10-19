# Search Console Operator

An independent, local Google Search Console reporting package with a shared CLI and MCP service. It connects directly to your Google account, calculates reports with explicit coverage, and retains private snapshots for reproducible readback. There is no GSC Wizard service or subscription dependency.

This is the first implementation milestone: twelve tool names, an independent response schema and local operation. The remaining 119 tools in the reference inventory are not implemented here. The package is currently `private: true`; public release and the package's own licence decision remain pending. See [compatibility](docs/COMPATIBILITY.md) and [architecture and reuse](docs/ARCHITECTURE.md).

The [verification record](docs/VERIFICATION.md) documents 74 passing automated checks and an authorised live run of all twelve tools, direct totals comparison and ten identical snapshot replays.

## Start locally

Use Node.js 24 or later. From the repository root:

```bash
cd packages/search-console-operator
npm ci
node bin/search-console-operator.mjs tools
node bin/search-console-operator.mjs status
```

`tools` prints the current machine-readable contracts. `status` checks the local connection record; a stored credential is not proof of current Google access.

For a fresh connection, enable the Search Console API in your Google Cloud project and download a **Desktop app** OAuth client JSON. Google's [desktop OAuth guide](https://developers.google.com/identity/protocols/oauth2/native-app) covers client creation and consent configuration. Use your own account and an OAuth project whose consent configuration permits it.

Replace the example file path and email below. On Linux/WSL, make the downloaded client file readable only by its owner:

```bash
chmod 600 /absolute/path/to/google-desktop-client.json
node bin/search-console-operator.mjs auth \
  --client-file /absolute/path/to/google-desktop-client.json \
  --expected-email you@example.com
```

Open the printed `connectUrl` on the machine running the command. The temporary listener uses `127.0.0.1:8775`; `--port` can select another port. The flow uses PKCE and state validation and requests only `openid`, email identity and `webmasters.readonly`. It checks the returned account against `--expected-email` before saving the connection.

## Read a property

```bash
node bin/search-console-operator.mjs call list_sites
node bin/search-console-operator.mjs call get_account_info
node bin/search-console-operator.mjs call get_site_summary \
  --args '{"siteUrl":"sc-domain:example.com"}'
node bin/search-console-operator.mjs call query_top_queries \
  --args '{"siteUrl":"sc-domain:example.com","limit":50}'
```

Replace `sc-domain:example.com` with an exact `siteUrl` returned for your account. Unverified or inaccessible properties are refused. Google API enablement, consent and property permission are required independently of this package.

Reports contain `status`, scope, resolved dates, units, source/collection evidence and a snapshot ID. Inspect `partial` results before using their row totals: a cap, a repeated key or a later request failure can leave a useful but incomplete result. The CLI exits non-zero for a failed report or command; partial reports retain a zero exit code and require inspection of their status.

## Retain and replay

```bash
node bin/search-console-operator.mjs snapshots --limit 10
node bin/search-console-operator.mjs replay SNAPSHOT_ID
```

Replace `SNAPSHOT_ID` with the returned 64-character digest. Replay validates and returns the captured result without contacting Google or recalculating it with newer data. Snapshot listing is ordered by digest, not capture time.

Default state is `~/.config/search-console-operator/`, with `auth/` and `snapshots/` beneath it. `--state-dir /absolute/private/path` selects a separate state directory. Snapshot files are immutable, owner-only JSON with a 32 MiB size ceiling. Keep this directory private: reports can contain search queries, page URLs and account information.

## Reuse an existing independent owner connection

The existing Agent Shop direct Google operator's compatible credential directory can be selected explicitly:

```bash
node bin/search-console-operator.mjs call list_sites \
  --owner-credentials-dir /absolute/path/to/agent-shop-google
```

This mode accepts the existing grant's broader scopes while restricting actual provider requests to Search Console reads. It never selects that directory automatically and cannot be combined with `auth`. Normal refresh can replace a rotated refresh token in the selected original store; report snapshots still use this package's state directory. Use an independent grant that you own.

## Connect a stdio MCP client

For a client accepting command/argument server definitions, use an absolute entry-point path:

```json
{
  "mcpServers": {
    "search-console-operator": {
      "command": "node",
      "args": [
        "/absolute/path/to/agent-shop-products/packages/search-console-operator/bin/search-console-operator.mjs",
        "serve",
        "--state-dir",
        "/absolute/path/to/private/search-console-operator"
      ]
    }
  }
}
```

Connect the account in that same state directory first. Standard output is reserved for MCP messages. Both MCP and CLI reports save snapshots; listing and replay are CLI commands. MCP results are limited to 4 MiB, so request smaller pages for large reports. A snapshot may already have been saved when the MCP output-size check rejects its result.

## Development

Run `npm test`. Tests use synthetic fixtures; a test result does not establish live Google acceptance. The implementation, current tool definitions and tests are in [src](src), [contracts.mjs](src/contracts.mjs) and [test](test).

After connecting your own account, opt in to the live acceptance runner for an exact accessible property:

```bash
node scripts/verify-live.mjs --site sc-domain:example.com
```

The runner accepts the same `--state-dir` and `--owner-credentials-dir` options. It calls all twelve tools when the property supplies a query and page to inspect, exercises both position-distribution modes, compares totals with a separate Google request, and replays every saved report without selecting credentials. It saves `live-acceptance.json` in the private state directory. Exit codes are 0 for passed, 1 for failed and 2 for limited evidence, such as a property with no query rows. It is excluded from ordinary tests and CI.
