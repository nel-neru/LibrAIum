// Unit tests for the compare_repos matrix (lib/compare.js). The decision
// hints and verbatim Personal Notes are the contract: comparisons must carry
// the owner's firsthand judgment, not just metadata.
import test from "node:test";
import assert from "node:assert/strict";

import { compare, resolveSelector, personalNotesSection } from "../lib/compare.js";

function entry(fullName, { tags = [], stars = 0, status = "active", language, push, category = "ai-agent", notes = "- A note." } = {}) {
  const slug = fullName.toLowerCase().replace("/", "-");
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
    body: `# ${fullName.split("/")[1]}\n\nA summary line.\n\n## Personal Notes\n\n${notes}\n`,
  };
}

test("resolveSelector matches by id, full_name, and GitHub URL — case-insensitively", () => {
  const entries = [entry("Acme/Tool", { tags: ["cli"] })];
  assert.ok(resolveSelector(entries, "ai-agent/acme-tool"));
  assert.ok(resolveSelector(entries, "acme/tool"));
  assert.ok(resolveSelector(entries, "https://github.com/Acme/Tool"));
  assert.equal(resolveSelector(entries, "no/such"), null);
});

test("personalNotesSection returns the verbatim section and null when absent", () => {
  const withNotes = "# x\n\nSummary.\n\n## Personal Notes\n\n- First.\n- Second.\n";
  assert.equal(personalNotesSection(withNotes), "- First.\n- Second.");
  assert.equal(personalNotesSection("# x\n\nSummary only.\n"), null);
  assert.equal(personalNotesSection("# x\n\n## Personal Notes\n\n\n"), null);
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
