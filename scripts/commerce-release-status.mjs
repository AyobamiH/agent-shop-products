#!/usr/bin/env node
import { releaseStatus } from './commerce-release-policy.mjs';
if (process.argv.length !== 2) { console.error('Usage: node scripts/commerce-release-status.mjs'); process.exitCode = 2; }
else {
  try { console.log(JSON.stringify(releaseStatus())); }
  catch (error) { console.error(error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : 'RELEASE_POLICY_FAILED'); process.exitCode = 1; }
}
