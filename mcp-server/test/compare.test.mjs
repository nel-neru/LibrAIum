// Unit tests for the compare_repos matrix (lib/compare.js). The decision hints
// and the verbatim Reception (third-party signal) / Personal Notes (firsthand)
// sections are the contract: comparisons must carry the curated take, not just
// metadata. The section extractor itself is bodySection, unit-tested in store.test.
import test from "node:test";
import assert from "node:assert/strict";

import { compare, resolveSelector } from "../lib/compare.js";

function entry(fullName, { tags = [], stars = 0, status = "active", language, push, category = "ai-agent", notes = "- A note.", reception } = {}) {
  const slug = fullName.toLowerCase().replace("/", "-");
  const receptionBlock = reception ? `## Reception\n\n${reception}\n\n` : "";
  return {
    id: `${category}/${slug}`,
    path: `/fake/${slug}.md`,
    meta: {
      github_url: `https://github.com/${fullName}`,
      full_name: fullName,
      category,
      tags,
      stars,
      status,
      language,
      last_github_push: push,
    },
    body: `# ${fullName.split("/")[1]}\n\nA summary line.\n\n${receptionBlock}## Personal Notes\n\n${notes}\n`,
  };
}

test("resolveSelector matches by id, full_name, and GitHub URL — case-insensitively", () => {
  const entries = [entry("Acme/Tool", { tags: ["cli"] })];
  assert.ok(resolveSelector(entries, "ai-agent/acme-tool"));
  assert.ok(resolveSelector(entries, "acme/tool"));
  assert.ok(resolveSelector(entries, "https://github.com/Acme/Tool"));
  assert.equal(resolveSelector(entries, "no/such"), null);
});

test("compare: surfaces Reception verbatim alongside Personal Notes, null when a section is absent", () => {
  const a = entry("open/old", { reception: "- Issues cite slow cold-start.", notes: "- Firsthand: fine for prototypes." });
  const b = entry("graph/new");
  const m = compare([a, b]);
  assert.equal(m.entries[0].reception, "- Issues cite slow cold-start.");
  assert.equal(m.entries[0].personal_notes, "- Firsthand: fine for prototypes.");
  assert.equal(m.entries[1].reception, null, "no Reception section => null");
});

test("compare: matrix carries notes verbatim, tag analysis, and stale/star hints", () => {
  const a = entry("open/old", { tags: ["multi-agent", "python"], stars: 19000, status: "stale", push: "2025-03-11", notes: "- Superseded; use the graph one." });
  const b = entry("graph/new", { tags: ["multi-agent", "framework"], stars: 20000, status: "active", push: "2026-07-01" });
  const m = compare([a, b]);

  assert.equal(m.entries.length, 2);
  assert.equal(m.entries[0].personal_notes, "- Superseded; use the graph one.");
  assert.deepEqual(m.shared_tags, ["multi-agent"]);
  assert.deepEqual(m.unique_tags["open/old"], ["python"]);
  assert.deepEqual(m.unique_tags["graph/new"], ["framework"]);
  assert.ok(m.decision_hints.some((h) => h.includes("open/old is stale")));
  assert.ok(m.decision_hints.some((h) => h.includes("graph/new is the most-starred")));
  assert.ok(m.decision_hints.some((h) => h.includes("freshest push")));
});

test("compare: only-language hint appears at 3+ entries, never at 2", () => {
  const two = compare([
    entry("a/x", { language: "Rust", stars: 1 }),
    entry("b/y", { language: "Go", stars: 2 }),
  ]);
  assert.ok(!two.decision_hints.some((h) => h.includes("only")));

  const three = compare([
    entry("a/x", { language: "Rust", stars: 1 }),
    entry("b/y", { language: "Go", stars: 2 }),
    entry("c/z", { language: "Go", stars: 3 }),
  ]);
  assert.ok(three.decision_hints.some((h) => h === "a/x is the only Rust option in this comparison"));
});
