import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createSeoMcpServer } from '../src/mcp.mjs';

const fixture = fileURLToPath(new URL('./fixtures/transport-server.mjs', import.meta.url));
const bin = fileURLToPath(new URL('../bin/search-console-operator.mjs', import.meta.url));
const expectedTools = ['get_account_info', 'get_filter_options', 'get_page_performance', 'get_position_distribution',
  'get_query_performance', 'get_site_summary', 'list_sites', 'query_countries', 'query_devices',
  'query_search_analytics', 'query_top_pages', 'query_top_queries'];

async function stdio(t, args) {
  const transport = new StdioClientTransport({ command: process.execPath, args, stderr: 'pipe' });
  let stderr = '';
  transport.stderr.on('data', chunk => { stderr += chunk; });
  const client = new Client({ name: 'operator-acceptance-test', version: '1.0.0' });
  t.after(async () => { await client.close(); assert.equal(stderr, '', 'unexpected stderr from MCP process'); });
  await client.connect(transport);
  return { client, transport };
}

test('real stdio process advertises exactly the twelve implemented contracts and accurate effects', async t => {
  const { client } = await stdio(t, [fixture]);
  assert.equal(client.getServerVersion().name, 'search-console-operator');
  assert.equal(client.getServerCapabilities().tools.listChanged, false);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(tool => tool.name).sort(), expectedTools);
  assert.equal(tools.filter(tool => tool.annotations.readOnlyHint === false).length, 9);
  assert.equal(tools.filter(tool => tool.annotations.readOnlyHint === true).length, 3);
  for (const tool of tools) assert.equal(tool.inputSchema.additionalProperties, false);
  const query = tools.find(tool => tool.name === 'query_search_analytics');
  assert.equal(query.inputSchema.properties.rowLimit.maximum, 25000);
  const result = await client.callTool({ name: 'query_search_analytics', arguments: {
    siteUrl: 'sc-domain:example.com', dimensions: ['query'], rowLimit: 7,
  } });
  assert.equal(result.isError, false);
  assert.equal(result.structuredContent.received.rowLimit, 7);
  assert.equal(result.structuredContent.signalReceived, true);
  assert.equal(JSON.parse(result.content[0].text).tool, 'query_search_analytics');
});

test('real stdio rejects invalid inputs and remains usable after schema failures', async t => {
  const { client } = await stdio(t, [fixture]);
  const cases = [
    { startDate: '2026-02-30' }, { startDate: 'null' }, { startDate: null },
    { startDate: '2026-10-10', endDate: '2026-10-01' }, { dimensions: ['query', 'query'] },
    { dimensions: ['revenue'] }, { startRow: -1 }, { rowLimit: 25001 }, { rowLimit: 1.5 }, { unknownOption: true },
  ];
  for (const extra of cases) {
    const result = await client.callTool({ name: 'query_search_analytics', arguments: { siteUrl: 'sc-domain:example.com', ...extra } });
    assert.equal(result.isError, true, JSON.stringify(extra));
  }
  const valid = await client.callTool({ name: 'list_sites', arguments: {} });
  assert.equal(valid.isError, false);
});

test('tool failures are sanitised, bounded and distinguished from partial evidence', async t => {
  const { client } = await stdio(t, [fixture]);
  for (const [query, expected] of [['known-error', 'PROPERTY_ACCESS_DENIED'], ['unknown-error', 'INTERNAL_ERROR'], ['oversized', 'TOOL_RESULT_TOO_LARGE']]) {
    const result = await client.callTool({ name: 'get_query_performance', arguments: { siteUrl: 'sc-domain:example.com', query } });
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent.error.code, expected);
    assert.doesNotMatch(JSON.stringify(result), /synthetic-private-detail|synthetic-secret|SYNTHETIC_SECRET_CODE/);
  }
  const failed = await client.callTool({ name: 'get_site_summary', arguments: { siteUrl: 'sc-domain:failed.example' } });
  assert.equal(failed.isError, true);
  assert.equal(failed.structuredContent.snapshot.id, 'a'.repeat(64));
  const partial = await client.callTool({ name: 'get_site_summary', arguments: { siteUrl: 'sc-domain:partial.example' } });
  assert.equal(partial.isError, false);
  assert.equal(partial.structuredContent.status, 'partial');
});

test('current protocol SDK round trip validates the shared factory without a network socket', async t => {
  let calls = 0;
  const handler = createMcpHandler(() => createSeoMcpServer({
    async callTool(name, args, { signal }) { calls++; return { status: 'complete', tool: name, args, cancellable: signal instanceof AbortSignal }; },
  }));
  const client = new Client({ name: 'current-protocol-test', version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });
  t.after(async () => { await client.close(); await handler.close(); });
  await client.connect(new StreamableHTTPClientTransport(new URL('https://test.invalid/mcp'), {
    fetch: (url, init) => handler.fetch(new Request(url, init)),
  }));
  assert.ok(client.getDiscoverResult(), 'must exercise the current protocol discover path');
  const result = await client.callTool({ name: 'query_devices', arguments: { siteUrl: 'sc-domain:example.com' } });
  assert.equal(result.structuredContent.cancellable, true);
  const invalid = await client.callTool({ name: 'query_devices', arguments: { siteUrl: 'sc-domain:example.com', limit: 1 } });
  assert.equal(invalid.isError, true);
  assert.equal(calls, 1, 'schema failure must not invoke service');
});

test('real operator binary serves discovery without credentials and exits on client disconnect', async t => {
  const root = mkdtempSync(path.join(tmpdir(), 'operator-mcp-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const stateDir = path.join(root, 'absent-state');
  const { client, transport } = await stdio(t, [bin, 'serve', '--state-dir', stateDir]);
  assert.equal((await client.listTools()).tools.length, 12);
  assert.equal(existsSync(stateDir), false, 'discovery must not create credential or report storage');
  const pid = transport.pid;
  assert.ok(pid > 0);
  await client.close();
  assert.throws(() => process.kill(pid, 0), /ESRCH/);
});
