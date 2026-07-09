// Unit tests for get_library_overview (lib/overview.js). The contract that
// matters: counts must reconcile (per-category sums = totals) and the tag
// vocabulary must be the exact filter vocabulary search_repos matches on.
import test from "node:test";
import assert from "node:assert/strict";

import { overview } from "../lib/overview.js";

function entry(fullName, { tags = [], status = "active", category = "a" } = {}) {
  return {
    id: `${category}/${fullName.replace("/", "-")}`,
    meta: { github_url: `https://github.com/${fullName}`, full_name: fullName, category, tags, status },
    body: "# x\n\nSummary.\n",
  };
}

const CATEGORIES = [
  { id: "a", name: "A", description: "first shelf", order: 1 },
  { id: "b", name: "B", description: "", order: 2 },
];

test("overview: totals reconcile with per-category counts and statuses", () => {
  const o = overview(
    [
      entry("x/one", { tags: ["rag", "rust"], category: "a" }),
      entry("x/two", { tags: ["rag"], category: "a", status: "stale" }),
      entry("x/three", { tags: ["cli"], category: "b", status: "archived" }),
    ],
    CATEGORIES,
    "/data"
  );
  assert.equal(o.totals.entries, 3);
  assert.equal(o.totals.stale, 1);
  assert.equal(o.totals.archived, 1);
  assert.equal(o.totals.categories, 2);
  assert.equal(o.categories.reduce((n, c) => n + c.entry_count, 0), o.totals.entries);
  const a = o.categories.find((c) => c.id === "a");
  assert.equal(a.entry_count, 2);
  assert.equal(a.stale_count, 1);
  assert.deepEqual(a.top_tags, ["rag", "rust"], "sorted by usage count, then name");
  assert.equal(o.categories.find((c) => c.id === "b").description, null, "empty description becomes null");
});

test("overview: tag vocabulary is lowercased, counted, sorted by usage", () => {
  const o = overview(
    [
      entry("x/one", { tags: ["RAG", "rust"] }),
      entry("x/two", { tags: ["rag", "cli"] }),
    ],
    CATEGORIES,
    "/data"
  );
  assert.deepEqual(o.tags, { rag: 2, cli: 1, rust: 1 });
});

test("overview: reception freshness counts missing (no date) and stale (>180d)", () => {
  const withRecep = (fullName, gathered) => {
    const e = entry(fullName);
    if (gathered !== undefined) e.meta.reception_gathered = gathered;
    return e;
  };
  const o = overview(
    [
      withRecep("x/fresh", "2999-01-01"), // far future → not stale
      withRecep("x/stale", "2000-01-01"), // ancient → stale
      withRecep("x/none"), // no gather date → missing
    ],
    CATEGORIES,
    "/data"
  );
  assert.equal(o.totals.reception_missing, 1);
  assert.equal(o.totals.reception_stale, 1);
});

test("overview: entries under a category id missing from the master are surfaced", () => {
  const o = overview([entry("x/lost", { category: "ghost" })], CATEGORIES, "/data");
  assert.deepEqual(o.orphaned_entries, ["ghost/x-lost"]);
  assert.equal(o.categories.reduce((n, c) => n + c.entry_count, 0), 0, "orphan is not silently absorbed");
});
