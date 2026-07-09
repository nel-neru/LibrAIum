#!/usr/bin/env node
// Atomic tag rename across the whole library: every entry carrying <old> gets
// it replaced with <new> in one run — the apply mechanism for the
// near-synonym pairs curation-report.mjs surfaces.
//
//   node scripts/rename-tag.mjs <old> <new> [--merge] [--dry-run] [--data-dir <dir>]
//
// Only the frontmatter `tags:` line is rewritten (flow style reassembled —
// never a serializeEntry round-trip, which would reformat whole files). When
// an entry already carries <new>, the rename would create a duplicate: that
// requires --merge, which de-duplicates case-insensitively keeping order.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

import { listEntries, resolveDataDir } from "../mcp-server/lib/store.js";

// House kebab-case convention (entry-authoring skill) — deliberately stricter
// than validate-data's non-empty-string rule: renames are how drift gets
// FIXED, so the target must land on the convention.
const TAG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function renameTag(dataDir, oldTag, newTag, { merge = false, dryRun = false } = {}) {
  const oldLc = oldTag.toLowerCase();
  if (oldLc === newTag.toLowerCase()) {
    throw new Error(`refusing no-op rename: "${oldTag}" -> "${newTag}"`);
  }
  if (!TAG_RE.test(newTag)) {
    throw new Error(`"${newTag}" is not kebab-case ([a-z0-9] groups joined by '-') — the house tag convention`);
  }

  const entries = listEntries(dataDir);
  const affected = entries.filter((e) => (e.meta.tags ?? []).some((t) => t.toLowerCase() === oldLc));
  if (!affected.length) {
    throw new Error(
      `no entry carries tag "${oldTag}" — check the vocabulary via scripts/curation-report.mjs before renaming`
    );
  }

  // Pass 1 — validate every affected entry and stage its rewritten content.
  // NOTHING is written here: a refused run (a both-tag entry without --merge,
  // or a malformed frontmatter block) must leave the whole working tree
  // byte-identical, which is the "atomic … in one run" promise. Writing as we
  // go would half-rename the library up to the first conflict.
  const plan = [];
  for (const e of affected) {
    const tags = e.meta.tags ?? [];
    const hasNew = tags.some((t) => t.toLowerCase() === newTag.toLowerCase());
    if (hasNew && !merge) {
      throw new Error(
        `${e.id} already carries "${newTag}" — the rename would duplicate it. Re-run with --merge to de-duplicate.`
      );
    }
    const seen = new Set();
    const next = tags
      .map((t) => (t.toLowerCase() === oldLc ? newTag : t))
      .filter((t) => {
        const k = t.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    const lines = readFileSync(e.path, "utf8").split("\n");
    const open = lines.findIndex((l) => l.trimEnd() === "---");
    const close = lines.findIndex((l, i) => i > open && l.trimEnd() === "---");
    const idx = lines.findIndex((l, i) => i > open && i < close && l.startsWith("tags:"));
    if (open === -1 || close === -1 || idx === -1) {
      throw new Error(`${e.id}: no tags line inside the frontmatter block — refusing to touch the file`);
    }
    lines[idx] = `tags: [${next.join(", ")}]`;
    plan.push({ id: e.id, path: e.path, before: tags, after: next, content: lines.join("\n") });
  }

  // Pass 2 — flush. Reached only once the whole set validated.
  if (!dryRun) {
    for (const p of plan) writeFileSync(p.path, p.content);
  }
  return plan.map(({ id, path, before, after }) => ({ id, path, before, after }));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const argv = process.argv.slice(2);
  const KNOWN = ["--merge", "--dry-run", "--data-dir"];
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const bad = [...flags].filter((f) => !KNOWN.includes(f));
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--data-dir") {
      i++;
      continue;
    }
    if (argv[i].startsWith("--")) continue;
    positional.push(argv[i]);
  }
  const [oldTag, newTag] = positional;
  if (!oldTag || !newTag || positional.length !== 2 || bad.length) {
    console.error("usage: rename-tag.mjs <old> <new> [--merge] [--dry-run] [--data-dir <dir>]");
    process.exit(2);
  }
  const dryRun = flags.has("--dry-run");
  const dataDir = resolveDataDir();
  try {
    const touched = renameTag(dataDir, oldTag, newTag, { merge: flags.has("--merge"), dryRun });
    for (const t of touched) {
      console.log(`${t.id}: [${t.before.join(", ")}] -> [${t.after.join(", ")}]`);
    }
    console.log(`${touched.length} entrie(s) ${dryRun ? "would be " : ""}updated${dryRun ? " (dry run)" : ""}`);
    if (!dryRun) {
      // Script writes bypass the PostToolUse hook — validate explicitly.
      execFileSync(
        process.execPath,
        [join(dirname(fileURLToPath(import.meta.url)), "validate-data.mjs"), "--data-dir", dataDir],
        { stdio: "inherit" }
      );
    }
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
