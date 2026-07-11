// Rejected-candidates memory: repos evaluated during curation (via /scout or
// bulk triage) and consciously NOT shelved — recorded so they don't resurface
// and get re-judged every run. Curator-side and Node-only: the desktop app's
// manual add is a deliberate human choice and does not consult this list, so
// there is no Rust twin (kept out of the parity-watched store.js, like
// related.js/overview.js). Local-only, no network.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

import { today } from "./store.js";

const OWNER_REPO_RE = /^[^/\s]+\/[^/\s]+$/;

// Re-emitted verbatim on every write so the file keeps its self-description
// (YAML.stringify drops comments). MUST byte-match data/master/rejected.yaml's
// header so the first write doesn't churn the seeded file.
const HEADER = `# Rejected candidates — repos evaluated during curation (via /scout or bulk
# triage) and consciously NOT shelved, recorded so they don't resurface and get
# re-judged every run. Managed by \`scripts/reject-candidate.mjs\`; read by
# bulk-add's --from-stars triage and by /scout to dedup discovery.
# Each entry: { full_name: owner/repo, date: YYYY-MM-DD, reason: one line }.
`;

function rejectedPath(dataDir) {
  return join(dataDir, "master", "rejected.yaml");
}

// The rejected list: [{ full_name, date, reason }]. Missing file or empty list
// ⇒ []. Malformed ⇒ a clear error naming the file (mirrors loadCategories).
export function loadRejected(dataDir) {
  const path = rejectedPath(dataDir);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf8");
  let parsed;
  try {
    parsed = YAML.parse(text);
  } catch (e) {
    throw new Error(`rejected list ${path} is not valid YAML: ${e.message} — fix or remove it`);
  }
  if (parsed == null) return [];
  if (typeof parsed !== "object" || !Array.isArray(parsed.rejected)) {
    throw new Error(`rejected list ${path} must have a top-level 'rejected:' array`);
  }
  return parsed.rejected;
}

// Case-insensitive lookup by full_name; returns the record or null.
export function findRejected(dataDir, fullName) {
  const needle = String(fullName).toLowerCase();
  return loadRejected(dataDir).find((r) => String(r?.full_name).toLowerCase() === needle) ?? null;
}

// Append a rejection, idempotent by full_name (re-rejecting refreshes the
// reason/date). Returns the stored record. Validation of the owner/repo shape is
// the caller's guard against writing garbage into the memory file.
export function addRejected(dataDir, fullName, reason, date = today()) {
  const clean = String(fullName).trim();
  if (!OWNER_REPO_RE.test(clean)) {
    throw new Error(`'${fullName}' is not a valid owner/repo full_name`);
  }
  const list = loadRejected(dataDir);
  const rec = { full_name: clean, date, reason: reason ?? "" };
  const existing = list.find((r) => String(r?.full_name).toLowerCase() === clean.toLowerCase());
  if (existing) {
    existing.date = rec.date;
    existing.reason = rec.reason;
  } else {
    list.push(rec);
  }
  writeFileSync(rejectedPath(dataDir), HEADER + YAML.stringify({ rejected: list }));
  return existing ?? rec;
}
