// L1 — makes LibrAIum's four read-mostly KnowledgeProvider guarantees explicit and testable:
// read-mostly (reads never mutate), no-data-copy (live reads, write-free read libs), fallback
// (a missing/empty library degrades, never crashes), and distinct-from-twin (the provider
// surface has no nel-os/nel-twin/nel-contracts coupling). See docs/knowledge-provider.md.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

import { listEntries, loadCategories, saveNewEntry } from "../lib/store.js";
import { searchRepos } from "../lib/search.js";
import { suggest } from "../lib/suggest.js";
import { overview } from "../lib/overview.js";
import { findByReception } from "../lib/reception.js";
import { getRelated } from "../lib/related.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const MCP_ROOT = join(HERE, ".."); // mcp-server/

// The read-only KnowledgeProvider libraries (add_repo's writer lives in store.js, not here).
const READ_LIBS = ["search.js", "suggest.js", "overview.js", "compare.js", "related.js", "reception.js"];
// A positive invariant beats a write-op blocklist: a read lib that imports no fs module at all
// cannot read OR write the store — it computes over already-loaded in-memory data. This catches
// every writer (writeFile, cpSync, renameSync, createWriteStream, …), not a hand-listed subset.
const FS_IMPORT = /(?:from\s*|require\(\s*)["'](?:node:)?fs(?:\/promises)?["']/;
const NEL_COUPLING = /nel[-_](os|twin|contracts)/i;

function snapshot(dir) {
  const out = {};
  (function walk(d, rel) {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const r = rel ? `${rel}/${name}` : name;
      if (statSync(p).isDirectory()) walk(p, r);
      else out[r] = readFileSync(p, "utf8");
    }
  })(dir, "");
  return out;
}

function seedLibrary() {
  const dir = mkdtempSync(join(tmpdir(), "libraium-l1-"));
  const meta = (fullName, category) => ({
    github_url: `https://github.com/${fullName}`,
    full_name: fullName,
    category,
    tags: ["rag"],
    stars: 10,
    status: "active",
    source: "manual",
  });
  saveNewEntry(dir, meta("a/one", "ai-agent"), "# One\n\nA vector database.\n\n## Reception\n\n- widely praised.");
  saveNewEntry(dir, meta("b/two", "web-app"), "# Two\n\nA web framework.");
  mkdirSync(join(dir, "master"), { recursive: true });
  writeFileSync(
    join(dir, "master", "categories.yaml"),
    "categories:\n  - id: ai-agent\n    name: AI Agent\n    order: 1\n  - id: web-app\n    name: Web App\n    order: 2\n"
  );
  return dir;
}

test("read-mostly: the read tools never mutate the library", () => {
  const dir = seedLibrary();
  try {
    const before = snapshot(dir);
    // The only reads that touch the data dir are listEntries/loadCategories/overview; the rest
    // compute over the returned in-memory data. Exercise them all, then prove nothing changed.
    const entries = listEntries(dir);
    const categories = loadCategories(dir);
    searchRepos(entries, categories, { query: "vector" });
    suggest(entries, categories, "I need a vector database", "", 5);
    overview(entries, categories, dir);
    findByReception(entries, { query: "praised" });
    getRelated(entries, entries[0]);
    assert.deepEqual(snapshot(dir), before, "no read tool may add, remove, or modify any file");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("no-data-copy: the read-tool libraries import no filesystem module (in-memory compute only)", () => {
  for (const lib of READ_LIBS) {
    const src = readFileSync(join(MCP_ROOT, "lib", lib), "utf8");
    assert.ok(
      !FS_IMPORT.test(src),
      `mcp-server/lib/${lib} must not import node:fs — read tools compute over already-loaded data, never touch the store`
    );
  }
});

test("fallback: a missing or empty library degrades, never crashes the provider", () => {
  const missing = join(tmpdir(), `libraium-absent-${process.pid}`);
  assert.deepEqual(listEntries(missing), [], "missing library => empty list, not a throw");
  assert.deepEqual(loadCategories(missing), [], "missing category master => empty, not a throw");
  // every read compute path tolerates an empty catalogue without throwing
  assert.doesNotThrow(() => searchRepos([], [], { query: "anything" }));
  assert.doesNotThrow(() => suggest([], [], "I need a database", "", 5));
  assert.doesNotThrow(() => overview([], [], missing));
  assert.doesNotThrow(() => findByReception([], { query: "x" }));
});

test("distinct-from-twin: the KnowledgeProvider surface has no kernel/twin coupling", () => {
  const surface = [
    join(MCP_ROOT, "index.js"),
    ...readdirSync(join(MCP_ROOT, "lib"))
      .filter((f) => extname(f) === ".js")
      .map((f) => join(MCP_ROOT, "lib", f)),
  ];
  for (const file of surface) {
    assert.ok(!NEL_COUPLING.test(readFileSync(file, "utf8")), `${file} must not couple to nel-os/nel-twin/nel-contracts`);
  }
  const pkg = JSON.parse(readFileSync(join(MCP_ROOT, "package.json"), "utf8"));
  for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
    assert.ok(!NEL_COUPLING.test(name), `dependency ${name} must not be a nel-* package`);
  }
});
