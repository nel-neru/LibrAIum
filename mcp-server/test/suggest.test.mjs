// Unit tests for the suggest_for_new_project ranking (lib/suggest.js).
// The threshold behavior is the important contract here: relevance must come
// from query tokens — status/stars alone must never surface an entry
// (regression for the star-ranked-noise bug fixed in 2ff2291).
import test from "node:test";
import assert from "node:assert/strict";

import { tokenize, scoreEntry, suggest, extractNotes, alternativesFor } from "../lib/suggest.js";

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

test("tokenize strips sentence-final periods but keeps interior/leading dots", () => {
  // the last word of a sentence must still hit the exact language match
  assert.deepEqual(tokenize("A search engine in Rust."), ["search", "engine", "rust"]);
  assert.deepEqual(tokenize("Runs on node.js. Also .NET."), ["runs", "node.js", "also", ".net"]);
  // a dots-only fragment is noise, not a token
  assert.deepEqual(tokenize("wait... what"), ["wait", "what"]);
  // stripped tokens re-pass the stopword/length filter
  assert.deepEqual(tokenize("use it."), []);
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

test("scoreEntry: a tag embedded inside a longer token is not evidence", () => {
  // Regression: tok.includes(tag) turned short tags into wildcards once
  // single-word language tags (c, go) entered the taxonomy — "c" matched
  // "cobol" and "rag" matched "dragon", surfacing entries on garbage queries.
  const c = scoreEntry(entry("FFmpeg/FFmpeg", { tags: ["transcoding", "cli", "c"] }), ["cobol"], CATEGORIES);
  assert.equal(c.lexical, 0, '"c" must not match inside "cobol"');
  const rag = scoreEntry(entry("acme/rag-lib", { tags: ["rag"] }), ["dragon"], CATEGORIES);
  assert.equal(rag.lexical, 0, '"rag" must not match inside "dragon"');
  // exact and token-inside-compound-tag evidence still count
  assert.ok(scoreEntry(entry("x/y", { tags: ["cli"] }), ["cli"], CATEGORIES).lexical >= 8);
  assert.ok(scoreEntry(entry("x/z", { tags: ["vector-db"] }), ["vector"], CATEGORIES).lexical >= 8);
});

test("scoreEntry: stale/archived discount and warn even when relevant", () => {
  const stale = scoreEntry(entry("a/b", { tags: ["rag"], status: "stale" }), ["rag"], CATEGORIES);
  assert.ok(stale.reasons.some((r) => r.includes("stale")));
  const archived = scoreEntry(entry("a/c", { tags: ["rag"], status: "archived" }), ["rag"], CATEGORIES);
  assert.ok(archived.reasons.some((r) => r.includes("archived")));
  assert.ok(archived.score < stale.score, "archived must rank below stale at equal relevance");
});

test("extractNotes: token bullets outrank caution cues outrank body order, capped at 3", () => {
  const body = [
    "# x",
    "",
    "Summary.",
    "",
    "## Personal Notes",
    "",
    "- Plain first bullet.",
    "- Second bullet about latency.",
    "- Gotcha: breaks on empty input.",
    "- Fourth bullet, plain.",
    "",
  ].join("\n");
  const e = entry("a/b", { body });

  const noTok = extractNotes(e, []);
  assert.equal(noTok.length, 3, "capped at 3");
  assert.match(noTok[0], /^Gotcha/, "caution cue wins without token hits");
  assert.match(noTok[1], /^Plain first/, "remaining bullets keep body order");

  const tok = extractNotes(e, ["latency"]);
  assert.match(tok[0], /latency/, "a query-token bullet outranks the cue bullet");
});

test("extractNotes: placeholder stubs and missing section return null", () => {
  assert.equal(extractNotes(entry("a/b", { body: "# x\n\nSummary only.\n" }), []), null);
  assert.equal(extractNotes(entry("a/c", { body: "# x\n\n## Personal Notes\n- \n-   \n" }), []), null);
});

test("suggest: suggestions inline personal_notes from the entry body", () => {
  const entries = [
    entry("acme/rag-lib", {
      tags: ["rag"],
      body: "# rag-lib\n\nA lib.\n\n## Personal Notes\n- Watch memory on big corpora.\n",
    }),
  ];
  const res = suggest(entries, CATEGORIES, "a RAG pipeline");
  assert.deepEqual(res.suggestions[0].personal_notes, ["Watch memory on big corpora."]);
});

test("alternativesFor mirrors Rust suggest_alternatives: shared tag + active + same category", () => {
  // Fixture mirrors search.rs alternatives_share_tags_and_are_active.
  const entries = [
    entry("old/thing", { tags: ["vector-db"], stars: 50, status: "stale" }),
    entry("qdrant/qdrant", { tags: ["vector-db", "rag"], stars: 20_000 }),
    entry("unrelated/x", { tags: ["prompt"], stars: 90_000 }),
  ];
  const alts = alternativesFor(entries, entries[0], 3);
  assert.equal(alts.length, 1, "no shared tag = excluded regardless of stars");
  assert.equal(alts[0].meta.full_name, "qdrant/qdrant");

  // two shared tags outrank one, stars only break ties below the 999 cap
  const richer = [
    entries[0],
    entry("one/tag", { tags: ["vector-db"], stars: 999_999 }),
    entry("two/tags", { tags: ["vector-db", "rust"], stars: 10 }),
  ];
  const target = { ...entries[0], meta: { ...entries[0].meta, tags: ["vector-db", "rust"] } };
  const ranked = alternativesFor(richer, target, 3);
  assert.equal(ranked[0].meta.full_name, "two/tags", "tag overlap dominates stars (min 999 cap)");

  // different category never qualifies
  const otherCat = [entries[0], entry("web/kit", { tags: ["vector-db"], category: "web-app" })];
  assert.equal(alternativesFor(otherCat, entries[0], 3).length, 0);
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
