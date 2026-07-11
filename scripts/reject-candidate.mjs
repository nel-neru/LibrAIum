#!/usr/bin/env node
// Record a scouted-and-declined repo in data/master/rejected.yaml so it doesn't
// resurface in future /scout or bulk-add triage runs. Local-only, no network.
//
//   node scripts/reject-candidate.mjs <owner/repo> "<reason>" [--data-dir <dir>]
//
// Idempotent by full_name (re-running refreshes the reason/date). Refuses to
// reject a repo that is currently SHELVED — that would be a contradiction.
import { resolveDataDir, findDuplicate } from "../mcp-server/lib/store.js";
import { addRejected, findRejected } from "../mcp-server/lib/rejected.js";

const args = process.argv.slice(2);
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--data-dir") {
    i++; // consumed by resolveDataDir
    continue;
  }
  positional.push(args[i]);
}
const [fullName, reason] = positional;
if (!fullName) {
  console.error('usage: node scripts/reject-candidate.mjs <owner/repo> "<reason>" [--data-dir <dir>]');
  process.exit(2);
}

const dataDir = resolveDataDir();
const shelved = findDuplicate(dataDir, fullName);
if (shelved) {
  console.error(`✗ ${fullName} is already SHELVED (${shelved.id}) — a shelved repo can't be a rejected candidate.`);
  process.exit(1);
}

const already = findRejected(dataDir, fullName);
let rec;
try {
  rec = addRejected(dataDir, fullName, reason);
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(2);
}
console.log(
  `${already ? "updated" : "recorded"} rejection: ${rec.full_name} (${rec.date})${rec.reason ? ` — ${rec.reason}` : ""}`
);
