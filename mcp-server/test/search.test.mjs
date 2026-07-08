// Unit tests for the search_repos v2 pipeline (lib/search.js): the new
// filters and, above all, the zero-result diagnostics contract — a bare
// {count: 0} is the failure mode this module exists to kill.
import test from "node:test";
import assert from "node:assert/strict";

import { searchRepos } from "../lib/search.js";

function entry(fullName, { tags = [], stars = 0, status = "active", language, push, added, category = "ai-agent", body } = {}) {
  return {
    id: `${category}/${fullName.replace("/", "-")}`,
    meta: {
      github_url: `https://github.com/${fullName}`,
      full_name: fullName,
      category,
      tags,
      stars,
      status,
      language,
      last_github_push: push,
      added_date: added,
    },
    body: body ?? `# ${fullName.split("/")[1]}\n\nA summary.\n`,
  };
}

const CATEGORIES = [
  { id: "ai-agent", name: "AI", description: "", order: 1 },
  { id: "web-app", name: "Web", description: "", order: 2 },
];

const LIB = [
  entry("a/vec", { tags: ["vector-db", "rag"], stars: 100, language: "Rust", push: "2026-07-01", added: "2026-01-01" }),
  entry("b/llm", { tags: ["rag"], stars: 300, language: "Python", push: "2026-05-01", added: "2026-03-01" }),
  entry("c/mcp", { tags: ["mcp-server"], stars: 200, language: "TypeScript", push: "2026-06-01", added: "2026-02-01" }),
];

test("any_tags is OR while tags stays AND", () => {
  const or = searchRepos(LIB, CATEGORIES, { any_tags: ["rag", "mcp-server"] });
  assert.equal(or.count, 3);
  const and = searchRepos(LIB, CATEGORIES, { tags: ["rag", "vector-db"] });
  assert.equal(and.count, 1);
  assert.equal(and.results[0].full_name, "a/vec");
});

test("language filter is exact and case-insensitive", () => {
  const r = searchRepos(LIB, CATEGORIES, { language: "rust" });
  assert.equal(r.count, 1);
  assert.equal(r.results[0].full_name, "a/vec");
  assert.equal(searchRepos(LIB, CATEGORIES, { language: "Rus" }).count, 0, "no substring matching");
});

test("updated_within_days filters on push date; entries without a push date drop", () => {
  const lib = [...LIB, entry("d/nopush", { tags: ["rag"] })];
  const r = searchRepos(lib, CATEGORIES, { updated_within_days: 45, today: "2026-07-09" });
  assert.deepEqual(r.results.map((x) => x.full_name), ["c/mcp", "a/vec"], "default sort is stars desc");
});

test("sort: freshness and added order by their dates, missing dates sink", () => {
  const fresh = searchRepos(LIB, CATEGORIES, { sort: "freshness" });
  assert.deepEqual(fresh.results.map((x) => x.full_name), ["a/vec", "c/mcp", "b/llm"]);
  const added = searchRepos(LIB, CATEGORIES, { sort: "added" });
  assert.deepEqual(added.results.map((x) => x.full_name), ["b/llm", "c/mcp", "a/vec"]);
});

test("'-token' negation excludes matches", () => {
  const r = searchRepos(LIB, CATEGORIES, { query: "summary -rust" });
  assert.ok(r.results.every((x) => x.full_name !== "a/vec"));
  assert.ok(r.count >= 1);
});

test("zero results: unknown tag suggests the closest real tags", () => {
  // The "c" tag must NOT surface for "vectordb" — short-tag containment noise.
  const lib = [...LIB, entry("e/clang", { tags: ["c"] })];
  const r = searchRepos(lib, CATEGORIES, { tags: ["vectordb"] });
  assert.equal(r.count, 0);
  assert.deepEqual(r.diagnostics.tag_suggestions.vectordb, ["vector-db"]);
  assert.match(r.note, /vector-db/);
});

test("zero results: dead query tokens and unknown categories are named", () => {
  const r = searchRepos(LIB, CATEGORIES, { query: "quantum blockchain rag" });
  assert.equal(r.count, 0);
  assert.deepEqual(r.diagnostics.unmatched_query_tokens, ["quantum", "blockchain"]);

  const cat = searchRepos(LIB, CATEGORIES, { category: "aiagent" });
  assert.equal(cat.count, 0);
  assert.deepEqual(cat.diagnostics.valid_categories, ["ai-agent", "web-app"]);

  const combo = searchRepos(LIB, CATEGORIES, { tags: ["rag"], min_stars: 100_000 });
  assert.match(combo.note, /combination matches nothing/);
});
