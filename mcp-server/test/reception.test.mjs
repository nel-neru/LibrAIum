// Unit tests for the find_by_reception query surface (lib/reception.js).
import test from "node:test";
import assert from "node:assert/strict";

import { findByReception, receptionBullets } from "../lib/reception.js";

function entry(fullName, bullets, { category = "ai-agent", status = "active" } = {}) {
  const body =
    `# ${fullName}\n\nA repo.\n\n## Reception\n\n<!-- Last gathered: 2026-07-09. -->\n\n` +
    bullets.map((b) => `- ${b}`).join("\n") +
    `\n`;
  return { id: `${category}/${fullName.replace("/", "-")}`, meta: { full_name: fullName, category, status }, body };
}

test("receptionBullets extracts only the '- ' bullets, dropping the provenance comment", () => {
  const e = entry("a/b", ["Adopters include Acme.", "Teams migrate to c/d."]);
  assert.deepEqual(receptionBullets(e), ["Adopters include Acme.", "Teams migrate to c/d."]);
  assert.deepEqual(receptionBullets({ body: "# x\n\nno reception here\n" }), []);
});

test("findByReception: free-text query matches bullets case-insensitively and returns the evidence", () => {
  const entries = [
    entry("a/one", ["Adopters include Netflix and Uber."]),
    entry("b/two", ["Fast, but the docs are thin."]),
  ];
  const r = findByReception(entries, { query: "netflix" });
  assert.equal(r.length, 1);
  assert.equal(r[0].full_name, "a/one");
  assert.deepEqual(r[0].matches, ["Adopters include Netflix and Uber."]);
});

test("findByReception: each signal filters to its cue set", () => {
  const entries = [
    entry("a/old", ["Teams commonly migrate to a/new for scale."], { status: "stale" }),
    entry("b/buggy", ["A known memory leak under load; treat it as a caveat."]),
    entry("c/pop", ["Adopted by several Fortune 500 companies."]),
    entry("d/plain", ["A solid, well-documented library."]),
  ];
  assert.deepEqual(findByReception(entries, { signal: "migration" }).map((r) => r.full_name), ["a/old"]);
  assert.deepEqual(findByReception(entries, { signal: "caution" }).map((r) => r.full_name), ["b/buggy"]);
  assert.deepEqual(findByReception(entries, { signal: "adopter" }).map((r) => r.full_name), ["c/pop"]);
});

test("findByReception: query AND signal must both hit the same bullet; neither criterion → []", () => {
  const entries = [
    entry("a/x", ["Migrate to a/y; also used by BigCo."]),
    entry("b/x", ["Migrate to b/y."]),
  ];
  assert.deepEqual(findByReception(entries, { query: "bigco", signal: "migration" }).map((x) => x.full_name), ["a/x"]);
  assert.deepEqual(findByReception(entries, {}), []);
});
