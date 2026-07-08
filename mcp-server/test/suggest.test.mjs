// Unit tests for the suggest_for_new_project ranking (lib/suggest.js).
// The threshold behavior is the important contract here: relevance must come
// from query tokens — status/stars alone must never surface an entry
// (regression for the star-ranked-noise bug fixed in 2ff2291).
import test from "node:test";
import assert from "node:assert/strict";

import { tokenize, scoreEntry, suggest } from "../lib/suggest.js";

function entry(fullName, { tags = [], stars = 0, status = "active", language, category = "ai-agent", body = "" } = {}) {
  const slug = fullName.replace("/", "-");
  return {
    id: `${category}/${slug}`,
    meta: {
      github_url: `https://github.com/${fullName}`,
      full_name: fullName,
      category,
      tags,
      stars,
      status,
      language,
    },
    body: body || `# ${fullName}\n\nA repository.\n\n## Personal Notes\n- none\n`,
  };
}

const CATEGORIES = [
  { id: "ai-agent", name: "AI Agents", description: "LLM agent frameworks and tooling" },
  { id: "web-app", name: "Web Apps", description: "Frontend and full-stack frameworks" },
];

test("tokenize lowercases, drops stopwords/short tokens, dedupes, keeps + # .", () => {
  assert.deepEqual(tokenize("Build a new RAG app using Rust and RAG"), ["rag", "rust"]);
  assert.deepEqual(tokenize("C++ C# node.js"), ["c++", "c#", "node.js"]);
  assert.deepEqual(tokenize(""), []);
  assert.deepEqual(tokenize(null), []);
});

test("scoreEntry: lexical evidence is tracked separately from status/stars", () => {
  const e = entry("acme/vector-store", { tags: ["vector-db"], stars: 10_000, status: "active" });

  const hit = scoreEntry(e, ["vector-db"], CATEGORIES);
  assert.ok(hit.lexical >= 8, `tag hit must count as lexical, got ${hit.lexical}`);
  assert.ok(hit.reasons.some((r) => r.startsWith("tags match")));

  // High stars + active status, but ZERO query evidence.
  const miss = scoreEntry(e, ["cobol"], CATEGORIES);
  assert.equal(miss.lexical, 0);
  assert.ok(miss.score > 3, "baseline still clears the old threshold — which is why lexical must gate");
});

test("scoreEntry: stale/archived discount and warn even when relevant", () => {
  const stale = scoreEntry(entry("a/b", { tags: ["rag"], status: "stale" }), ["rag"], CATEGORIES);
  assert.ok(stale.reasons.some((r) => r.includes("stale")));
  const archived = scoreEntry(entry("a/c", { tags: ["rag"], status: "archived" }), ["rag"], CATEGORIES);
  assert.ok(archived.reasons.some((r) => r.includes("archived")));
  assert.ok(archived.score < stale.score, "archived must rank below stale at equal relevance");
});

test("suggest: irrelevant query returns ZERO suggestions despite active high-star entries", () => {
  const entries = [
    entry("popular/repo", { tags: ["llm"], stars: 100_000 }),
    entry("famous/tool", { tags: ["cli"], stars: 50_000 }),
  ];
  const res = suggest(entries, CATEGORIES, "underwater basket weaving simulator in COBOL");
  assert.deepEqual(res.suggestions, []);
});

test("suggest: relevant entries come back ranked, reasoned, capped at maxResults", () => {
  const entries = [
    entry("acme/agent-kit", { tags: ["llm", "agent"], stars: 5000 }),
    entry("acme/rag-lib", { tags: ["rag"], stars: 100 }),
    entry("acme/unrelated", { tags: ["css"], stars: 90_000, category: "web-app" }),
  ];
  const res = suggest(entries, CATEGORIES, "an LLM agent that does RAG", "", 2);

  assert.equal(res.suggestions.length, 2);
  assert.equal(res.suggestions[0].full_name, "acme/agent-kit", "two tag hits must outrank one");
  assert.ok(res.suggestions.every((s) => s.why.length > 0), "every suggestion must carry reasons");
  assert.ok(res.suggestions.every((s) => s.how_to_adopt.length > 0));
  assert.ok(!res.suggestions.some((s) => s.full_name === "acme/unrelated"));
});
