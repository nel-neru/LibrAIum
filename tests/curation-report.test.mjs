// Pins the curation-report contract over a fixture library
// (tests/fixtures/curation-lib): freshness buckets, thin shelves, tag drift,
// and stale/archived succession coverage.
import test from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildReport } from "../scripts/curation-report.mjs";
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
