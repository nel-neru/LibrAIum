// Pins the rename-tag contract on a throwaway copy of the curation fixture
// library: only the tags line changes (byte-identical elsewhere), duplicates
// demand --merge, and the guard rails refuse junk.
import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
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

// A refused run must leave the working tree byte-identical — the atomicity
// promise. Regression for the non-atomic partial write: a non-conflicting
// carrier that sorts BEFORE the conflicting one used to be rewritten on disk
// before the conflict threw (the shared fixture masked it by ordering the
// conflicting entry first).
function entryFile(tags, name) {
  return `---\ngithub_url: https://github.com/x/${name}\nfull_name: x/${name}\ncategory: x\ntags: [${tags.join(", ")}]\nstars: 1\nstatus: active\nsource: manual\n---\n\n# ${name}\n\nSummary.\n`;
}

test("a refused (no --merge) rename leaves every non-conflicting file byte-identical", () => {
  const dir = mkdtempSync(join(tmpdir(), "libraium-rename-atomic-"));
  try {
    mkdirSync(join(dir, "entries", "x"), { recursive: true });
    mkdirSync(join(dir, "master"), { recursive: true });
    writeFileSync(join(dir, "master", "categories.yaml"), "categories:\n  - id: x\n    name: X\n    order: 1\n");
    // aaa (no conflict) sorts before zzz (carries both tags → conflict).
    const aaaPath = join(dir, "entries", "x", "aaa.md");
    const zzzPath = join(dir, "entries", "x", "zzz.md");
    writeFileSync(aaaPath, entryFile(["rag", "python"], "aaa"));
    writeFileSync(zzzPath, entryFile(["rag", "vector-db"], "zzz"));
    const aaaBefore = readFileSync(aaaPath, "utf8");
    const zzzBefore = readFileSync(zzzPath, "utf8");

    assert.throws(() => renameTag(dir, "rag", "vector-db"), /Re-run with --merge/);

    assert.equal(readFileSync(aaaPath, "utf8"), aaaBefore, "non-conflicting file must be untouched on a refused run");
    assert.equal(readFileSync(zzzPath, "utf8"), zzzBefore, "conflicting file untouched too");
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

test("block-style tags are refused (never corrupted) and the tree stays byte-identical", () => {
  const dir = freshCopy();
  try {
    // A block-style entry: validate-data accepts it (flow is convention, not
    // enforced), and parseEntry reads its tags fine, but a naive line rewrite
    // would swap only the header and orphan the `- item` lines into invalid YAML.
    const blockPath = join(dir, "entries", "alpha", "block.md");
    const block =
      "---\ngithub_url: https://github.com/blk/style\nfull_name: blk/style\ncategory: alpha\ntags:\n  - vectordb\n  - keep\nstars: 1\nstatus: active\nsource: manual\n---\n\n# style\n\nBody.\n";
    writeFileSync(blockPath, block);

    assert.throws(() => renameTag(dir, "vectordb", "vector-db"), /block style/);
    // Atomic refusal: the block entry AND the flow entry are both untouched.
    assert.equal(readFileSync(blockPath, "utf8"), block, "block-style file must be byte-identical");
    assert.equal(
      readFileSync(join(dir, "entries", "alpha", "syn.md"), "utf8").includes("tags: [vectordb]"),
      true,
      "the other carrier must not have been half-renamed"
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
