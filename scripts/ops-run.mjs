#!/usr/bin/env node
/**
 * Run a protected ksa-doctor-ops job.
 * Usage: node scripts/ops-run.mjs <health|backup|alert>
 */
import fs from 'node:fs';

const job = process.argv[2] || 'health';
if (!['health', 'backup', 'alert'].includes(job)) {
  console.error('Usage: node scripts/ops-run.mjs <health|backup|alert>');
  process.exit(2);
}
const token = process.env.OPS_TRIGGER_TOKEN || fs.readFileSync('.secrets/ops.env', 'utf8').trim();
const res = await fetch(`https://ksa-doctor-ops.asmaayl-net.workers.dev/run?job=${encodeURIComponent(job)}`, {
  headers: { authorization: `Bearer ${token}` }
});
const body = await res.text();
console.log(body);
if (!res.ok) process.exit(1);
