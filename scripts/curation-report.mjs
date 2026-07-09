#!/usr/bin/env node
// Deterministic library health report feeding /curate-review: the audit
// checks that used to be re-invented as ad-hoc greps every session, computed
// offline in one pass. Human-readable sections by default, --json for
// tooling. Read-only, no network.
//
//   node scripts/curation-report.mjs [--json] [--data-dir <dir>]
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { listEntries, loadCategories, resolveDataDir, today } from "../mcp-server/lib/store.js";
import { alternativesFor } from "../mcp-server/lib/suggest.js";
import { editDistance } from "../mcp-server/lib/search.js";

export function buildReport(entries, categories, { today: todayStr = today(), receptionReview = null } = {}) {
  const ageDays = (d) => (Date.parse(`${todayStr}T00:00:00Z`) - Date.parse(`${d}T00:00:00Z`)) / 86_400_000;

  const freshness = { fresh: [], d30: [], d90: [], missing: [] };
  for (const e of entries) {
    const lc = e.meta.last_checked;
    if (!lc) freshness.missing.push(e.id);
    else {
      const a = ageDays(lc);
      (a < 30 ? freshness.fresh : a < 90 ? freshness.d30 : freshness.d90).push(e.id);
    }
  }

  const count = (fn) =>
    entries.reduce((m, e) => {
      const k = fn(e);
      m[k] = (m[k] ?? 0) + 1;
      return m;
    }, {});
  const status_counts = count((e) => e.meta.status ?? "active");
  const source_counts = count((e) => e.meta.source ?? "manual");

  const thin_shelves = categories
    .map((c) => ({ id: c.id, entry_count: entries.filter((e) => e.meta.category === c.id).length }))
    .filter((c) => c.entry_count < 3);

  const tagCounts = {};
  for (const e of entries) {
    for (const t of e.meta.tags ?? []) {
      const k = t.toLowerCase();
      tagCounts[k] = (tagCounts[k] ?? 0) + 1;
    }
  }
  const vocab = Object.keys(tagCounts).sort();
  const singleton_tags = vocab.filter((t) => tagCounts[t] === 1);

  // Near-synonym candidates, lexical only. Containment needs the contained
  // side >= 3 chars, edit distance needs BOTH sides >= 4 — short language
  // tags ("c", "go", "cpp"/"cli") otherwise pair with everything.
  const contains = (outer, inner) => inner.length >= 3 && outer.includes(inner);
  const near_synonym_pairs = [];
  for (let i = 0; i < vocab.length; i++) {
    for (let j = i + 1; j < vocab.length; j++) {
      const [a, b] = [vocab[i], vocab[j]];
      if (contains(a, b) || contains(b, a) || (a.length >= 4 && b.length >= 4 && editDistance(a, b) <= 2)) {
        near_synonym_pairs.push([a, b]);
      }
    }
  }

  // Succession: every stale/archived entry either has an active shared-tag
  // alternative on the same shelf (covered) or is a hole (uncovered).
  const succession = { covered: [], uncovered: [] };
  for (const e of entries.filter((e) => e.meta.status === "stale" || e.meta.status === "archived")) {
    const alts = alternativesFor(entries, e, 3);
    if (alts.length) succession.covered.push({ id: e.id, alternatives: alts.map((a) => a.id) });
    else succession.uncovered.push(e.id);
  }

  return {
    generated_for: todayStr,
    totals: { entries: entries.length, categories: categories.length },
    freshness,
    status_counts,
    source_counts,
    thin_shelves,
    singleton_tags,
    near_synonym_pairs,
    succession,
    reception_review: receptionReview,
  };
}

function printHuman(r) {
  const ids = (xs) => (xs.length ? xs.join(", ") : "(none)");
  console.log(`LibrAIum curation report — ${r.generated_for} (${r.totals.entries} entries, ${r.totals.categories} categories)\n`);
  console.log(
    `freshness (last_checked): ${r.freshness.fresh.length} fresh | ${r.freshness.d30.length} 30d+ | ${r.freshness.d90.length} 90d+ | ${r.freshness.missing.length} missing`
  );
  if (r.freshness.d30.length) console.log(`  30d+   : ${ids(r.freshness.d30)}`);
  if (r.freshness.d90.length) console.log(`  90d+   : ${ids(r.freshness.d90)}`);
  if (r.freshness.missing.length) console.log(`  missing: ${ids(r.freshness.missing)}`);
  const fmt = (o) => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(" | ");
  console.log(`status: ${fmt(r.status_counts)}`);
  console.log(`source: ${fmt(r.source_counts)}`);
  console.log(`thin shelves (<3 entries): ${ids(r.thin_shelves.map((t) => `${t.id}(${t.entry_count})`))}`);
  console.log(`singleton tags (${r.singleton_tags.length}): ${ids(r.singleton_tags)}`);
  console.log(`near-synonym candidates: ${ids(r.near_synonym_pairs.map(([a, b]) => `${a} ~ ${b}`))}`);
  console.log("succession (stale/archived):");
  for (const c of r.succession.covered) console.log(`  covered  : ${c.id} -> ${c.alternatives.join(", ")}`);
  for (const u of r.succession.uncovered) console.log(`  UNCOVERED: ${u} — shelf hole, no active shared-tag alternative`);
  if (!r.succession.covered.length && !r.succession.uncovered.length) console.log("  (no stale/archived entries)");
  console.log(
    `reception: ${r.reception_review ? `${r.reception_review.gathered}/${r.reception_review.total} gathered` : "n/a (.claude/reception-review.md not found)"}`
  );
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const dataDir = resolveDataDir();
  const entries = listEntries(dataDir);
  const categories = loadCategories(dataDir);
  const trackerPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".claude", "reception-review.md");
  let receptionReview = null;
  if (existsSync(trackerPath)) {
    const txt = readFileSync(trackerPath, "utf8");
    receptionReview = {
      gathered: (txt.match(/^- \[x\]/gim) ?? []).length,
      total: (txt.match(/^- \[[ x]\]/gim) ?? []).length,
    };
  }
  const report = buildReport(entries, categories, { receptionReview });
  if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else printHuman(report);
}
