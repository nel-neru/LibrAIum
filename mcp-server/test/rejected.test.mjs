// Unit tests for the rejected-candidates memory (lib/rejected.js).
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { loadRejected, findRejected, addRejected } from "../lib/rejected.js";

function tmpDataDir() {
  const dir = mkdtempSync(join(tmpdir(), "libraium-rejected-"));
  mkdirSync(join(dir, "master"), { recursive: true });
  return dir;
}

test("loadRejected: missing file and seeded-empty both return []", () => {
  const dir = tmpDataDir();
  try {
    assert.deepEqual(loadRejected(dir), []);
    writeFileSync(join(dir, "master", "rejected.yaml"), "rejected: []\n");
    assert.deepEqual(loadRejected(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("addRejected + findRejected: append, case-insensitive lookup, idempotent refresh", () => {
  const dir = tmpDataDir();
  try {
    addRejected(dir, "foo/bar", "too niche", "2026-07-11");
    const hit = findRejected(dir, "FOO/BAR");
    assert.equal(hit.full_name, "foo/bar");
    assert.equal(hit.reason, "too niche");
    assert.equal(hit.date, "2026-07-11");
    assert.equal(findRejected(dir, "nope/none"), null);

    // Re-rejecting refreshes reason/date without duplicating.
    addRejected(dir, "foo/bar", "superseded", "2026-07-12");
    const all = loadRejected(dir);
    assert.equal(all.length, 1);
    assert.equal(all[0].reason, "superseded");
    assert.equal(all[0].date, "2026-07-12");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("addRejected rejects a malformed full_name", () => {
  const dir = tmpDataDir();
  try {
    assert.throws(() => addRejected(dir, "not-a-full-name", "x"), /valid owner\/repo/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadRejected: a malformed file gives a clear, file-naming error", () => {
  const dir = tmpDataDir();
  try {
    writeFileSync(join(dir, "master", "rejected.yaml"), "rejected: not-an-array\n");
    assert.throws(() => loadRejected(dir), /top-level 'rejected:' array/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
