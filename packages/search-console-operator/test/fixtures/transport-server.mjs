// Synthetic transport fixture only. No credential reads or provider requests.
import { serveSeoMcp } from '../../src/mcp.mjs';

const service = {
  async callTool(name, args, { signal } = {}) {
    if (args.query === 'known-error') throw Object.assign(new Error('synthetic-private-detail'), { code: 'PROPERTY_ACCESS_DENIED' });
    if (args.query === 'unknown-error') throw Object.assign(new Error('synthetic-secret-do-not-expose'), { code: 'SYNTHETIC_SECRET_CODE' });
    if (args.query === 'oversized') return { data: 'x'.repeat(4 * 1024 * 1024) };
    const status = args.siteUrl === 'sc-domain:failed.example' ? 'failed' : args.siteUrl === 'sc-domain:partial.example' ? 'partial' : 'complete';
    return { schemaVersion: 1, tool: name, status, received: args, signalReceived: signal instanceof AbortSignal,
      snapshot: { id: 'a'.repeat(64) }, evidence: { kind: 'synthetic_transport_test' } };
  },
};
serveSeoMcp(service);
