import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio, StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { tools, parseToolArgs } from './contracts.mjs';
import { operationError, publicError } from './errors.mjs';

const outputSchema = z.object({}).catchall(z.unknown());
const MAX_RESULT_BYTES = 4 * 1024 * 1024;

function resultEnvelope(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw operationError('INTERNAL_ERROR');
  const text = JSON.stringify(value);
  if (new TextEncoder().encode(text).byteLength > MAX_RESULT_BYTES) throw operationError('TOOL_RESULT_TOO_LARGE');
  return { content: [{ type: 'text', text }], structuredContent: value, isError: value.status === 'failed' };
}

export function createSeoMcpServer(service) {
  if (!service || typeof service.callTool !== 'function') throw operationError('CONFIGURATION_REQUIRED');
  const server = new McpServer({
    name: 'search-console-operator', version: '0.1.0',
    description: 'Independent Search Console reports with explicit coverage and retained snapshots.',
  }, {
    capabilities: { tools: { listChanged: false } }, maxToolInputElements: 1024,
    instructions: 'Use list_sites to choose an accessible property. CTR is a percentage. Query rows may omit traffic; use independent aggregate totals and coverage. Reporting calls retain local snapshots. This version implements twelve tools and does not claim full GSC Wizard parity.',
  });
  for (const { name, ...definition } of tools) {
    server.registerTool(name, { ...definition, outputSchema }, async (input, context) => {
      try {
        const args = parseToolArgs(name, input);
        return resultEnvelope(await service.callTool(name, args, { signal: context.mcpReq.signal }));
      } catch (error) {
        const safe = publicError(error);
        return { ...resultEnvelope({ error: safe }), isError: true };
      }
    });
  }
  return server;
}

export function serveSeoMcp(service, { stderr = process.stderr } = {}) {
  return serveStdio(() => createSeoMcpServer(service), {
    transport: new StdioServerTransport(undefined, undefined, { maxBufferSize: 1024 * 1024 }),
    onerror: error => stderr.write(JSON.stringify({ error: publicError(error) }) + '\n'),
  });
}
