import { readFileSync, openSync, writeFileSync, fsyncSync, closeSync } from 'node:fs';
import { prepareRequest } from './integration/request.mjs';

try {
  if (process.argv.length !== 4) throw new Error('usage');
  const inventory = JSON.parse(readFileSync(new URL('../catalog/capability-inventory.json', import.meta.url), 'utf8'));
  const policy = JSON.parse(readFileSync(new URL('../catalog/capability-acquisition.json', import.meta.url), 'utf8'));
  const request = prepareRequest(JSON.parse(readFileSync(process.argv[2], 'utf8')), inventory, policy);
  const fd = openSync(process.argv[3], 'wx', 0o600);
  try { writeFileSync(fd, JSON.stringify(request, null, 2) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
  console.log(JSON.stringify({ prepared: true, submitted: false, acceptedJob: false, endpoint: policy.requestEndpoint }));
} catch (error) {
  const code = /^[a-z_]+$/.test(error.message) ? error.message : 'input_or_output_error';
  console.error(JSON.stringify({ prepared: false, code, usage: 'node scripts/integration-request.mjs INPUT.json NEW_PRIVATE_OUTPUT.json' }));
  process.exitCode = 1;
}
