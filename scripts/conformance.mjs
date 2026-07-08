#!/usr/bin/env node
// Rust ⇔ Node format conformance harness.
//
// The LibrAIum data format (YAML frontmatter + Markdown body) is dual-implemented:
//   - Rust: src-tauri/src/frontmatter.rs (+ models.rs EntryMeta)
//   - Node: mcp-server/lib/store.js (parseEntry)
// Both implementations must accept/reject/produce identical results. This script
// feeds the same files to both parsers and fails on any divergence:
//   - tests/fixtures/format/valid/*.md   → both must parse AND agree on meta+body
//   - tests/fixtures/format/invalid/*.md → both must REJECT (agreement on rejection
//                                          is part of the contract)
//   - data/entries/**/*.md              → treated as valid (real library data)
//
// Exit 0 when every file agrees; exit 1 on any mismatch.

import { execSync, execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_TAURI = join(ROOT, "src-tauri");
const BIN = join(SRC_TAURI, "target", "debug", "dump_entries");

const { parseEntry, slugify, normalizeGithubUrl } = await import(
  join(ROOT, "mcp-server", "lib", "store.js")
);

// ---------------------------------------------------------------------------
// 1. Collect input files
// ---------------------------------------------------------------------------

function mdFilesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(dir, f))
    .sort();
}

function mdFilesRecursive(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...mdFilesRecursive(p));
    else if (name.endsWith(".md")) out.push(p);
  }
  return out;
}

// dump_entries links libraium_lib, whose generate_context! embeds dist/ at
// compile time — fail with instructions instead of a cryptic cargo error.
if (!existsSync(join(ROOT, "dist"))) {
  console.error("✗ dist/ not found — run `npm run build` first (Tauri's generate_context! embeds it).");
  process.exit(1);
}

const fixturesRoot = join(ROOT, "tests", "fixtures", "format");
if (!existsSync(fixturesRoot)) {
  console.log(`note: ${relative(ROOT, fixturesRoot)} not found — skipping fixtures, scanning data/entries only`);
}
const validFiles = mdFilesIn(join(fixturesRoot, "valid"));
const invalidFiles = mdFilesIn(join(fixturesRoot, "invalid"));
const entryFiles = mdFilesRecursive(join(ROOT, "data", "entries"));

// invalid/ files must be rejected by both sides; everything else must parse identically.
const invalidSet = new Set(invalidFiles);
const allFiles = [...validFiles, ...invalidFiles, ...entryFiles];

if (allFiles.length === 0) {
  console.log("note: no input files found (no fixtures, no data/entries) — nothing to check");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 2. Rust side: build the dump_entries bin once, run it once over all files
// ---------------------------------------------------------------------------

execSync("export PATH=/opt/homebrew/bin:$PATH; cargo build --quiet --locked --bin dump_entries", {
  cwd: SRC_TAURI,
  stdio: ["ignore", "inherit", "inherit"],
});

const rustRaw = execFileSync(BIN, ["--files", ...allFiles], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const rustByPath = new Map(JSON.parse(rustRaw).map((r) => [r.path, r]));

// ---------------------------------------------------------------------------
// 3. Node side + comparison
// ---------------------------------------------------------------------------

// The 11 EntryMeta fields (models.rs / store.js contract), normalized ONLY so
// that absent and null Option fields compare equal (undefined→null — serde's
// skip_serializing_if omits None). Deliberately NO default filling and NO type
// coercion: both parsers materialize the serde defaults themselves (models.rs
// default fns ⇔ parseEntry), and filling or coercing here would mask a
// divergence — it DID mask the Node missing-defaults drift until iter-42.
function normalizeMeta(meta) {
  const m = meta ?? {};
  const val = (k) => (m[k] === undefined || m[k] === null ? null : m[k]);
  return {
    github_url: val("github_url"),
    full_name: val("full_name"),
    category: val("category"),
    tags: val("tags"),
    stars: val("stars"),
    language: val("language"),
    last_github_push: val("last_github_push"),
    last_checked: val("last_checked"),
    status: val("status"),
    source: val("source"),
    added_date: val("added_date"),
  };
}

function fieldDiffs(rustMeta, nodeMeta) {
  const a = normalizeMeta(rustMeta);
  const b = normalizeMeta(nodeMeta);
  const diffs = [];
  for (const key of Object.keys(a)) {
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
      diffs.push(`    meta.${key}: rust=${JSON.stringify(a[key])} node=${JSON.stringify(b[key])}`);
    }
  }
  return diffs;
}

let mismatches = 0;
let validAgreed = 0;
let rejectedByBoth = 0;

for (const path of allFiles) {
  const rel = relative(ROOT, path);
  const rust = rustByPath.get(path);
  if (!rust) {
    mismatches++;
    console.log(`MISMATCH ${rel}\n    dump_entries returned no result for this file`);
    continue;
  }

  let node = null;
  let nodeError = null;
  try {
    node = parseEntry(readFileSync(path, "utf8"));
  } catch (e) {
    nodeError = e.message ?? String(e);
  }

  if (invalidSet.has(path)) {
    // Contract: invalid inputs must be rejected by BOTH implementations.
    if (!rust.ok && nodeError !== null) {
      rejectedByBoth++;
      console.log(`OK       ${rel} (rejected by both)`);
    } else {
      mismatches++;
      const lines = [`MISMATCH ${rel} (expected both to reject)`];
      lines.push(rust.ok ? "    rust: ACCEPTED" : `    rust: rejected (${rust.error})`);
      lines.push(nodeError === null ? "    node: ACCEPTED" : `    node: rejected (${nodeError})`);
      console.log(lines.join("\n"));
    }
    continue;
  }

  // Valid file: both must succeed and agree.
  if (!rust.ok || nodeError !== null) {
    mismatches++;
    const lines = [`MISMATCH ${rel} (expected both to parse)`];
    lines.push(rust.ok ? "    rust: parsed" : `    rust: REJECTED (${rust.error})`);
    lines.push(nodeError === null ? "    node: parsed" : `    node: REJECTED (${nodeError})`);
    console.log(lines.join("\n"));
    continue;
  }

  const diffs = fieldDiffs(rust.meta, node.meta);
  // Both serializers always terminate the file with a single trailing newline
  // (serialize()/serializeEntry() emit `...${body.trimEnd()}\n`), so trailing
  // whitespace is not semantic — compare bodies with trimEnd() equality.
  if (rust.body.trimEnd() !== node.body.trimEnd()) {
    diffs.push(
      `    body: differs (rust ${rust.body.trimEnd().length} chars vs node ${node.body.trimEnd().length} chars after trimEnd)`
    );
  }

  if (diffs.length > 0) {
    mismatches++;
    console.log(`MISMATCH ${rel}\n${diffs.join("\n")}`);
  } else {
    validAgreed++;
    console.log(`OK       ${rel}`);
  }
}

// ---------------------------------------------------------------------------
// 4. Function-level conformance: slugify + normalize_github_url are also
//    dual-implemented (CLAUDE.md contract) — compare them over a shared corpus.
// ---------------------------------------------------------------------------

let fnAgreed = 0;
const fnCorpusPath = join(fixturesRoot, "functions.json");
if (existsSync(fnCorpusPath)) {
  const corpus = JSON.parse(readFileSync(fnCorpusPath, "utf8"));

  const rustSlugs = JSON.parse(
    execFileSync(BIN, ["--slugify", ...corpus.slugify], { encoding: "utf8" })
  );
  corpus.slugify.forEach((input, i) => {
    const node = slugify(input);
    if (rustSlugs[i] === node) {
      fnAgreed++;
    } else {
      mismatches++;
      console.log(
        `MISMATCH slugify(${JSON.stringify(input)})\n    rust=${JSON.stringify(rustSlugs[i])} node=${JSON.stringify(node)}`
      );
    }
  });

  const rustUrls = JSON.parse(
    execFileSync(BIN, ["--normalize-url", ...corpus.normalize_url], { encoding: "utf8" })
  );
  corpus.normalize_url.forEach((input, i) => {
    const rust = rustUrls[i];
    let node = null;
    let nodeError = null;
    try {
      node = normalizeGithubUrl(input);
    } catch (e) {
      nodeError = e.message ?? String(e);
    }
    const agree = rust.ok
      ? node !== null && rust.full_name === node.fullName && rust.canonical === node.canonical
      : node === null;
    if (agree) {
      fnAgreed++;
    } else {
      mismatches++;
      const lines = [`MISMATCH normalize_github_url(${JSON.stringify(input)})`];
      lines.push(rust.ok ? `    rust: accepted (${rust.full_name})` : `    rust: rejected (${rust.error})`);
      lines.push(node !== null ? `    node: accepted (${node.fullName})` : `    node: rejected (${nodeError})`);
      console.log(lines.join("\n"));
    }
  });
} else {
  console.log(`note: ${relative(ROOT, fnCorpusPath)} not found — skipping function-level conformance`);
}

// ---------------------------------------------------------------------------
// 5. Verdict
// ---------------------------------------------------------------------------

if (mismatches > 0) {
  console.error(`\n✗ conformance: ${mismatches} mismatches between Rust and Node (files + function corpus)`);
  process.exit(1);
}
console.log(
  `\n✓ conformance: ${allFiles.length} files agree (${validAgreed} valid, ${rejectedByBoth} rejected by both) + ${fnAgreed} function cases agree`
);
