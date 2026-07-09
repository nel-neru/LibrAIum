// Unit tests for bulk-add's proposeCategory — the lexical scorer that drives
// the /bulk-add --from-stars category triage. Exercised only by live network
// runs otherwise, so a regression here would silently mis-shelf every
// harvested candidate.
import test from "node:test";
import assert from "node:assert/strict";

import { proposeCategory } from "../scripts/bulk-add.mjs";

const CATEGORIES = [
  { id: "ai-agent", name: "AI Agents", description: "vector databases, RAG pipelines, MCP servers, agent memory, LLM inference" },
  { id: "web-app", name: "Web Apps", description: "web application frameworks, server-side rendering" },
  { id: "design-ui", name: "Design UI", description: "design systems, component libraries, prototyping" },
];

const TAGS = new Map([
  ["ai-agent", new Set(["vector-db", "rag", "llm-inference"])],
  ["web-app", new Set(["react", "ssr"])],
  ["design-ui", new Set(["component-library", "tailwind", "design-system"])],
]);

test("proposeCategory routes a vector/RAG repo to ai-agent", () => {
  const r = {
    description: "A high-performance vector database for similarity search",
    language: "Rust",
    topics: ["vector-database", "rag"],
    full_name: "acme/vectorstore",
  };
  const { category } = proposeCategory(r, CATEGORIES, TAGS);
  assert.equal(category, "ai-agent");
});

test("proposeCategory distinguishes design-ui from web-app despite React", () => {
  const r = {
    description: "Accessible React UI components styled with Tailwind CSS",
    language: "TypeScript",
    topics: ["react", "components", "design-system"],
    full_name: "acme/ui",
  };
  const { category } = proposeCategory(r, CATEGORIES, TAGS);
  assert.equal(category, "design-ui", "tailwind + design-system tokens outweigh the lone react hit");
});

test("proposeCategory tokenizes hyphenated tags into the descriptor", () => {
  // With raw (un-tokenized) tags this scored 0 — 'vector-db' never matched the
  // hyphen-split haystack. The topic 'vector' must now hit the vector-db tag.
  const r = { description: "embeddings store", language: "Go", topics: ["vector"], full_name: "x/y" };
  const { category, score } = proposeCategory(r, CATEGORIES, TAGS);
  assert.equal(category, "ai-agent");
  assert.ok(score >= 1, "the vector-db tag contributes a match via its 'vector' token");
});

test("proposeCategory returns null for an unmatchable repo", () => {
  const r = { description: "A COBOL mainframe batch job scheduler", language: "COBOL", topics: [], full_name: "acme/cobol-batch" };
  assert.deepEqual(proposeCategory(r, CATEGORIES, TAGS), { category: null, score: 0 });
});

test("proposeCategory breaks ties by categories.yaml order (first shelf wins)", () => {
  // 'react' hits web-app, 'vector' hits ai-agent — one each. The category
  // listed first in the array must win the tie.
  const r = { description: "react vector", language: null, topics: [], full_name: "a/b" };
  const webFirst = [CATEGORIES[1], CATEGORIES[0], CATEGORIES[2]];
  assert.equal(proposeCategory(r, webFirst, TAGS).category, "web-app");
  const aiFirst = [CATEGORIES[0], CATEGORIES[1], CATEGORIES[2]];
  assert.equal(proposeCategory(r, aiFirst, TAGS).category, "ai-agent");
});
