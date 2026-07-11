// Pins the curation-report contract over a fixture library
// (tests/fixtures/curation-lib): freshness buckets, thin shelves, tag drift,
// and stale/archived succession coverage.
import test from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildReport, snapshotOf, appendSnapshot, formatTrend } from "../scripts/curation-report.mjs";
import { listEntries, loadCategories } from "../mcp-server/lib/store.js";

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "curation-lib");
const report = buildReport(listEntries(FIXTURE), loadCategories(FIXTURE), { today: "2026-07-09" });

test("freshness buckets by last_checked age, missing surfaced", () => {
  assert.deepEqual(report.freshness.fresh.sort(), ["alpha/fresh-active", "beta/solo"]);
  assert.deepEqual(report.freshness.d30, ["alpha/syn"]);
  assert.deepEqual(report.freshness.d90, ["alpha/old-stale"]);
  assert.deepEqual(report.freshness.missing, ["alpha/dead-archived"]);
});

test("status and source counts", () => {
  assert.deepEqual(report.status_counts, { active: 3, stale: 1, archived: 1 });
  assert.deepEqual(report.source_counts, { manual: 4, mcp: 1 });
});

test("thin shelves are those under 3 entries", () => {
  assert.deepEqual(report.thin_shelves, [{ id: "beta", entry_count: 1 }]);
});

test("tag drift: singletons and near-synonym pairs (short tags never pair)", () => {
  assert.deepEqual(report.singleton_tags.sort(), ["unique-one", "vectordb"].sort());
  assert.deepEqual(report.near_synonym_pairs, [["vector-db", "vectordb"]]);
});

test("succession: stale covered by shared-tag active sibling, archived uncovered", () => {
  assert.deepEqual(report.succession.covered, [
    { id: "alpha/old-stale", alternatives: ["alpha/fresh-active"] },
  ]);
  assert.deepEqual(report.succession.uncovered, ["alpha/dead-archived"]);
});

test("reception coverage passes through, null when not supplied", () => {
  assert.equal(report.reception_review, null, "absent tracker => null");
  const withCoverage = buildReport(listEntries(FIXTURE), loadCategories(FIXTURE), {
    today: "2026-07-09",
    receptionReview: { gathered: 2, total: 43 },
  });
  assert.deepEqual(withCoverage.reception_review, { gathered: 2, total: 43 });
});

test("snapshotOf reduces the report to scalar counts", () => {
  const snap = snapshotOf(report);
  assert.equal(snap.date, "2026-07-09");
  assert.equal(snap.entries, 5);
  assert.equal(snap.thin_shelves, 1);
  assert.equal(snap.succession_uncovered, 1);
  assert.equal(snap.stale, 1);
  assert.equal(snap.archived, 1);
  assert.equal(snap.singleton_tags, 2);
  assert.equal(snap.near_synonyms, 1);
});

test("appendSnapshot keeps one snapshot per date and preserves unparseable lines", () => {
  let log = appendSnapshot("", { date: "2026-07-01", entries: 40, thin_shelves: 15 });
  log = appendSnapshot(log, { date: "2026-07-08", entries: 43, thin_shelves: 12 });
  assert.equal(log.trim().split("\n").length, 2);
  // a same-date rerun replaces its line, not appends
  log = appendSnapshot(log, { date: "2026-07-08", entries: 43, thin_shelves: 11 });
  const rows = log.trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(rows.length, 2);
  assert.equal(rows.find((r) => r.date === "2026-07-08").thin_shelves, 11);
  // a corrupt line is kept, never silently dropped
  assert.ok(appendSnapshot("not json\n" + log, { date: "2026-07-09", entries: 43 }).includes("not json"));
});

test("formatTrend renders rows with a delta; empty log gives guidance", () => {
  assert.match(formatTrend([]), /no snapshots yet/);
  const snaps = [
    { date: "2026-07-01", entries: 40, thin_shelves: 15, singleton_tags: 8, near_synonyms: 3, succession_uncovered: 2, reception_missing: 10, reception_stale: 0 },
    { date: "2026-07-08", entries: 43, thin_shelves: 12, singleton_tags: 6, near_synonyms: 2, succession_uncovered: 1, reception_missing: 0, reception_stale: 0 },
  ];
  const out = formatTrend(snaps);
  assert.match(out, /2026-07-01/);
  assert.match(out, /2026-07-08/);
  assert.match(out, /thin_shelves -3/); // 15 -> 12
});
