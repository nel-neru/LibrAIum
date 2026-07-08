// Pins the rename-tag contract on a throwaway copy of the curation fixture
// library: only the tags line changes (byte-identical elsewhere), duplicates
// demand --merge, and the guard rails refuse junk.
import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renameTag } from "../scripts/rename-tag.mjs";
import { listEntries } from "../mcp-server/lib/store.js";

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "curation-lib");

function freshCopy() {
  const dir = mkdtempSync(join(tmpdir(), "libraium-rename-"));
  cpSync(FIXTURE, dir, { recursive: true });
  return dir;
}

test("rename touches every carrier, changes ONLY the tags line", () => {
  const dir = freshCopy();
  try {
    const synPath = join(dir, "entries", "alpha", "syn.md");
    const before = readFileSync(synPath, "utf8");

    const touched = renameTag(dir, "vectordb", "vector-db");
    assert.deepEqual(touched.map((t) => t.id), ["alpha/syn"]);

    const after = readFileSync(synPath, "utf8");
    const beforeLines = before.split("\n");
    const afterLines = after.split("\n");
    assert.equal(beforeLines.length, afterLines.length);
    const diffs = beforeLines.map((l, i) => [l, afterLines[i]]).filter(([a, b]) => a !== b);
    assert.deepEqual(diffs, [["tags: [vectordb]", "tags: [vector-db]"]], "exactly one line changes");

    // library still parses and the tag is unified
    const tags = listEntries(dir).flatMap((e) => e.meta.tags);
    assert.ok(!tags.includes("vectordb"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("duplicate-producing rename demands --merge, then de-duplicates keeping order", () => {
  const dir = freshCopy();
  try {
    // fresh-active carries [vector-db, rag]: rag -> vector-db would duplicate
    assert.throws(() => renameTag(dir, "rag", "vector-db"), /--merge/);

    const touched = renameTag(dir, "rag", "vector-db", { merge: true });
    const fresh = touched.find((t) => t.id === "alpha/fresh-active");
    assert.deepEqual(fresh.after, ["vector-db"]);
    const solo = touched.find((t) => t.id === "beta/solo");
    assert.deepEqual(solo.after, ["vector-db"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("guard rails: no-op, unknown tag, non-kebab target, dry-run writes nothing", () => {
  const dir = freshCopy();
  try {
    assert.throws(() => renameTag(dir, "rag", "RAG"), /no-op/);
    assert.throws(() => renameTag(dir, "never-existed", "rag2"), /no entry carries/);
    assert.throws(() => renameTag(dir, "rag", "Bad Tag!"), /kebab-case/);

    const synPath = join(dir, "entries", "alpha", "syn.md");
    const before = readFileSync(synPath, "utf8");
    const touched = renameTag(dir, "vectordb", "vector-db", { dryRun: true });
    assert.equal(touched.length, 1);
    assert.equal(readFileSync(synPath, "utf8"), before, "dry run must not write");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
