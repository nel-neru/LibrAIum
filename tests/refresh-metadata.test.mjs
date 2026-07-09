// Unit tests for refresh-metadata's frontmatter rewriters. These run on
// --write, so a bug here corrupts real entries: the critical property is that
// only the targeted scalar lines change and the flow-style `tags: [...]` line
// (which a YAML round-trip would reformat to block style) is left byte-identical.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { setScalar, rewriteEntry } from "../scripts/refresh-metadata.mjs";

test("setScalar replaces an existing line, reports no-op, inserts in field order", () => {
  const fm = ["github_url: https://github.com/o/r", "full_name: o/r", "category: ai-agent", "tags: [a, b]", "stars: 10"];

  assert.equal(setScalar(fm, "stars", 42), true);
  assert.equal(fm[4], "stars: 42");

  assert.equal(setScalar(fm, "stars", 42), false, "same value is a no-op");

  // last_checked is absent; field order puts it after last_github_push/language/stars,
  // before status/source — here after stars (the nearest preceding present key).
  assert.equal(setScalar(fm, "last_checked", "2026-07-09"), true);
  assert.equal(fm[fm.indexOf("stars: 42") + 1], "last_checked: 2026-07-09");
});

test("rewriteEntry changes only targeted scalars, leaves the flow-style tags line intact", () => {
  const dir = mkdtempSync(join(tmpdir(), "libraium-refresh-"));
  try {
    const path = join(dir, "entry.md");
    const original = [
      "---",
      "github_url: https://github.com/o/r",
      "full_name: o/r",
      "category: ai-agent",
      "tags: [vector-db, rag, rust]",
      "stars: 10",
      "language: Rust",
      "last_github_push: 2025-01-01",
      "status: active",
      "source: manual",
      "added_date: 2025-01-01",
      "---",
      "",
      "# r",
      "",
      "Summary line.",
      "",
    ].join("\n");
    writeFileSync(path, original);

    const changed = rewriteEntry(path, { stars: 999, last_github_push: "2026-07-09", last_checked: "2026-07-09" });
    assert.equal(changed, true);

    const after = readFileSync(path, "utf8");
    assert.match(after, /^stars: 999$/m);
    assert.match(after, /^last_github_push: 2026-07-09$/m);
    assert.match(after, /^last_checked: 2026-07-09$/m, "missing scalar inserted");
    assert.match(after, /^tags: \[vector-db, rag, rust\]$/m, "flow-style tags line untouched");
    assert.match(after, /^# r$/m, "body preserved");

    // Idempotent: re-applying the same values writes nothing.
    assert.equal(rewriteEntry(path, { stars: 999 }), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rewriteEntry throws on a file without a frontmatter block", () => {
  const dir = mkdtempSync(join(tmpdir(), "libraium-refresh-"));
  try {
    const path = join(dir, "bad.md");
    writeFileSync(path, "# no frontmatter here\n");
    assert.throws(() => rewriteEntry(path, { stars: 1 }), /no frontmatter block/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
