import { parseArgs } from 'node:util';
import path from 'node:path';
import { describeTools, parseToolArgs } from './contracts.mjs';
import { operationError, publicError } from './errors.mjs';

const HELP = `Independent Search Console operator (Node 24+)

tools
call TOOL [--args JSON]
serve
status
snapshots [--limit 20]
replay SNAPSHOT_ID
auth --client-file ABSOLUTE_PATH --expected-email EMAIL [--port 8775]

Global options: --state-dir ABSOLUTE_PATH
Existing independent owner grant: --owner-credentials-dir ABSOLUTE_PATH
The owner credential option is never selected automatically and cannot be used with auth.
Report calls access Google read-only and retain private local snapshots.
Snapshots and replay use retained data; they do not refresh it from Google.
In serve mode stdout carries MCP messages only.
`;
const options = Object.freeze({
  args: { type: 'string' }, 'state-dir': { type: 'string' }, 'owner-credentials-dir': { type: 'string' },
  limit: { type: 'string' }, 'client-file': { type: 'string' }, 'expected-email': { type: 'string' },
  port: { type: 'string' }, help: { type: 'boolean' },
});
const commandOptions = Object.freeze({ tools: [], call: ['args'], serve: [], status: [],
  snapshots: ['limit'], replay: [], auth: ['client-file', 'expected-email', 'port'] });

function integer(value, min, max) {
  if (!/^(0|[1-9]\d*)$/.test(value ?? '')) throw operationError('INVALID_ARGUMENT');
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) throw operationError('INVALID_ARGUMENT');
  return number;
}

function parseCommand(argv) {
  let parsed;
  try { parsed = parseArgs({ args: argv, options, allowPositionals: true, strict: true, tokens: true }); }
  catch { throw operationError('INVALID_ARGUMENT'); }
  const { values, positionals, tokens } = parsed;
  const seen = new Set();
  for (const token of tokens.filter(token => token.kind === 'option')) {
    if (seen.has(token.name)) throw operationError('INVALID_ARGUMENT');
    seen.add(token.name);
  }
  const command = positionals[0] ?? 'help';
  if (values.help || command === 'help') return { command: 'help' };
  if (!Object.hasOwn(commandOptions, command)) throw operationError('UNKNOWN_COMMAND');
  if (positionals.length !== (['call', 'replay'].includes(command) ? 2 : 1)) throw operationError('INVALID_ARGUMENT');
  const allowed = new Set([...commandOptions[command], 'state-dir', 'owner-credentials-dir']);
  if (Object.keys(values).some(key => !allowed.has(key))) throw operationError('INVALID_ARGUMENT');
  const runtime = {};
  for (const [flag, key] of [['state-dir', 'stateDir'], ['owner-credentials-dir', 'ownerCredentialsDir']]) {
    if (values[flag] !== undefined) {
      if (!path.isAbsolute(values[flag]) || values[flag].includes('\0')) throw operationError('INVALID_ARGUMENT');
      runtime[key] = values[flag];
    }
  }
  return { command, values, operand: positionals[1], runtime };
}

async function authorise(bootstrap, values, runtime, write, signals) {
  if (runtime.ownerCredentialsDir || !path.isAbsolute(values['client-file'] ?? '') ||
      values['client-file'].includes('\0') || !/^[^\s@]+@[^\s@]+$/.test(values['expected-email'] ?? '')) {
    throw operationError('INVALID_ARGUMENT');
  }
  const port = values.port === undefined ? 8775 : integer(values.port, 1024, 65535);
  const pending = await bootstrap.runAuth({ ...runtime, clientFile: values['client-file'], expectedEmail: values['expected-email'], port });
  const close = () => { void pending.close().catch(() => {}); };
  signals.once('SIGINT', close); signals.once('SIGTERM', close);
  try {
    write({ status: 'awaiting_google_consent', connectUrl: pending.connectUrl, expiresAt: pending.expiresAt, requestedScopes: pending.requestedScopes });
    const outcome = await pending.done;
    const warning = outcome.warning ? publicError({ code: outcome.warning }) : undefined;
    if (outcome.status === 'connected') { write({ status: 'connected', ...(warning ? { warning } : {}) }); return 0; }
    const error = publicError(typeof outcome.error === 'string' ? { code: outcome.error } : outcome.error);
    write({ status: 'failed', error, ...(warning ? { warning } : {}) });
    return 1;
  } finally {
    signals.removeListener('SIGINT', close); signals.removeListener('SIGTERM', close);
    await pending.close();
  }
}

export async function main(argv = process.argv.slice(2), dependencies = {}) {
  const stdout = dependencies.stdout ?? process.stdout, stderr = dependencies.stderr ?? process.stderr;
  const write = value => stdout.write(JSON.stringify(value) + '\n');
  try {
    const { command, values, operand, runtime } = parseCommand(argv);
    if (command === 'help') { stdout.write(HELP); return 0; }
    if (command === 'tools') { write({ schemaVersion: 1, tools: describeTools() }); return 0; }
    let input;
    if (command === 'call') {
      try { input = JSON.parse(values.args ?? '{}'); } catch { throw operationError('INVALID_ARGUMENT'); }
      input = parseToolArgs(operand, input);
    }
    const limit = command === 'snapshots' ? integer(values.limit ?? '20', 1, 100) : undefined;
    if (command === 'replay' && !/^[a-f0-9]{64}$/.test(operand)) throw operationError('SNAPSHOT_INVALID_ID');
    const bootstrap = dependencies.bootstrap ?? await import('./bootstrap.mjs');
    if (command === 'auth') return await authorise(bootstrap, values, runtime, write, dependencies.signals ?? process);
    if (command === 'status') { write(await bootstrap.getStatus(runtime)); return 0; }
    const service = dependencies.service ?? await bootstrap.createDefaultService(runtime);
    if (command === 'serve') {
      const { serveSeoMcp } = await import('./mcp.mjs');
      const handle = serveSeoMcp(service, { stderr });
      const signals = dependencies.signals ?? process;
      const close = () => { void handle.close().catch(error => stderr.write(JSON.stringify({ error: publicError(error) }) + '\n')); };
      signals.once('SIGINT', close); signals.once('SIGTERM', close);
      return 0;
    }
    if (command === 'snapshots') { write(await service.listSnapshots({ limit })); return 0; }
    if (command === 'replay') {
      const replayed = await service.replay(operand);
      write(replayed);
      return replayed.status === 'failed' ? 1 : 0;
    }
    const result = await service.callTool(operand, input, {});
    write(result);
    return result.status === 'failed' ? 1 : 0;
  } catch (error) {
    stderr.write(JSON.stringify({ error: publicError(error) }) + '\n');
    return 1;
  }
}
