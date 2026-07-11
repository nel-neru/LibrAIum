// Unit tests for the get_related relationship graph (lib/related.js).
// Edges are authored one-directionally in frontmatter; this module derives the
// inverse (supersedes) and the symmetric pairs_with union at read time.
import test from "node:test";
import assert from "node:assert/strict";

import { getRelated, resolveNames } from "../lib/related.js";

function entry(fullName, { tags = [], stars = 0, status = "active", category = "ai-agent", superseded_by, pairs_with } = {}) {
  const slug = fullName.replace("/", "-");
  const meta = { github_url: `https://github.com/${fullName}`, full_name: fullName, category, tags, stars, status };
  if (superseded_by) meta.superseded_by = superseded_by;
  if (pairs_with) meta.pairs_with = pairs_with;
  return { id: `${category}/${slug}`, meta, body: `# ${fullName}\n\nA repo.\n` };
}

test("resolveNames: shelved targets summarize with shelved:true, unshelved come back bare", () => {
  const entries = [entry("langchain-ai/langgraph", { stars: 12_000 })];
  const out = resolveNames(entries, ["langchain-ai/langgraph", "not/shelved"]);
  assert.equal(out[0].shelved, true);
  assert.equal(out[0].full_name, "langchain-ai/langgraph");
  assert.equal(out[0].stars, 12_000);
  assert.deepEqual(out[1], { full_name: "not/shelved", shelved: false });
  // Case-insensitive resolution.
  assert.equal(resolveNames(entries, ["LangChain-AI/LangGraph"])[0].shelved, true);
  // Null/undefined input is an empty list, not a throw.
  assert.deepEqual(resolveNames(entries, undefined), []);
});

test("getRelated: forward superseded_by (shelved + unshelved) and derived reverse supersedes", () => {
  const swarm = entry("openai/swarm", { status: "stale", superseded_by: ["langchain-ai/langgraph", "not/shelved"] });
  const langgraph = entry("langchain-ai/langgraph", { stars: 12_000 });
  const rel = getRelated([swarm, langgraph], swarm);
  assert.deepEqual(
    rel.superseded_by.map((r) => [r.full_name, r.shelved]),
    [["langchain-ai/langgraph", true], ["not/shelved", false]]
  );
  assert.equal(rel.supersedes.length, 0);

  // The reverse edge is derived on the successor, never stored on it.
  const relBack = getRelated([swarm, langgraph], langgraph);
  assert.deepEqual(relBack.supersedes.map((r) => r.full_name), ["openai/swarm"]);
  assert.equal(relBack.superseded_by.length, 0);
});

test("getRelated: pairs_with is the symmetric union of both directions, deduped, minus self", () => {
  const qdrant = entry("qdrant/qdrant", { pairs_with: ["run-llama/llama_index"] });
  const llama = entry("run-llama/llama_index", { pairs_with: ["qdrant/qdrant"] }); // points back
  const chroma = entry("chroma/chroma", { pairs_with: ["qdrant/qdrant"] }); // one-directional
  const rel = getRelated([qdrant, llama, chroma], qdrant);
  const names = rel.pairs_with.map((r) => r.full_name).sort();
  assert.deepEqual(names, ["chroma/chroma", "run-llama/llama_index"]);
  assert.ok(!names.includes("qdrant/qdrant"), "never pairs with itself");
});
