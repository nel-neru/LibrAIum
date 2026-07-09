// Unit tests for the pure data-layer functions in lib/store.js — the Node
// half of the dual-implemented format. Mirrors the Rust inline tests
// (frontmatter::tests, store::tests); slugify/normalizeGithubUrl are
// additionally corpus-checked against Rust by scripts/conformance.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import {
  splitFrontmatter,
  parseEntry,
  serializeEntry,
  fetchGithubRepo,
  findDuplicate,
  guardRedirectedDuplicate,
  listEntries,
  normalizeTags,
  saveNewEntry,
  firstSummaryLine,
  bodySection,
  loadCategories,
  resolveDataDir,
  summarize,
  computeStatus,
  today,
} from "../lib/store.js";

const SAMPLE =
  "---\ngithub_url: https://github.com/owner/repo\nfull_name: owner/repo\ncategory: ai-agent\ntags:\n  - vector-db\n  - rag\nstars: 8750\nlanguage: Python\nstatus: active\nsource: manual\n---\n\n# Repo\n\nSummary here.\n\n## Personal Notes\n- note\n";

test("parseEntry/serializeEntry roundtrip preserves meta and body", () => {
  const { meta, body } = parseEntry(SAMPLE);
  assert.equal(meta.full_name, "owner/repo");
  assert.equal(meta.stars, 8750);
  assert.deepEqual(meta.tags, ["vector-db", "rag"]);
  assert.ok(body.startsWith("# Repo"));

  const out = serializeEntry(meta, body);
  const again = parseEntry(out);
  assert.deepEqual(again.meta, meta);
  assert.equal(again.body.trimEnd(), body.trimEnd());
});

test("splitFrontmatter rejects malformed files like the Rust side", () => {
  assert.throws(() => splitFrontmatter("# just markdown\n"), /does not start with/);
  assert.throws(() => splitFrontmatter("---\nfoo: 1\n"), /unterminated/);
  assert.throws(() => splitFrontmatter(""), /does not start with/);
});

test("parseEntry rejects non-mapping frontmatter (empty block, scalar, sequence)", () => {
  assert.throws(() => parseEntry("---\n---\nbody\n"), /not a YAML mapping/);
  assert.throws(() => parseEntry("---\njust a string\n---\nbody\n"), /not a YAML mapping/);
  assert.throws(() => parseEntry("---\n- a\n- b\n---\nbody\n"), /not a YAML mapping/);
});

test("parseEntry mirrors Rust's typed schema: wrong types and missing required fields rejected", () => {
  const base = "github_url: https://github.com/a/b\nfull_name: a/b\ncategory: web-app";
  const doc = (yaml) => `---\n${yaml}\n---\nbody\n`;

  assert.throws(() => parseEntry(doc("category: web-app")), /'github_url' must be a string/);
  assert.throws(() => parseEntry(doc(`${base.replace("full_name: a/b", "full_name: 12345")}`)), /'full_name' must be a string/);
  assert.throws(() => parseEntry(doc(`${base}\nstars: "123"`)), /'stars' must be a non-negative integer/);
  assert.throws(() => parseEntry(doc(`${base}\nstars: -1`)), /'stars' must be a non-negative integer/);
  assert.throws(() => parseEntry(doc(`${base}\ntags: nope`)), /'tags' must be an array of strings/);
  assert.throws(() => parseEntry(doc(`${base}\nstatus: null`)), /'status' must be a string/);

  // Option<String> fields accept explicit null (serde None), and empty
  // strings are a data-level concern, not a parse error — same as Rust.
  assert.equal(parseEntry(doc(`${base}\nlanguage: null`)).meta.language, null);
  assert.equal(parseEntry(doc(base.replace("full_name: a/b", 'full_name: ""'))).meta.full_name, "");
});

test("CRLF input parses identically to LF (CRs never leak)", () => {
  const crlf = SAMPLE.replaceAll("\n", "\r\n");
  const { meta, body } = parseEntry(crlf);
  assert.equal(meta.source, "manual", "last frontmatter value must not keep \\r");
  assert.ok(!body.includes("\r"), "body must not contain CR");
  assert.deepEqual({ meta, body }, parseEntry(SAMPLE));
});

test("leading BOMs are stripped — one or many — like Rust's trim_start_matches", () => {
  assert.deepEqual(parseEntry(`﻿${SAMPLE}`), parseEntry(SAMPLE));
  assert.deepEqual(parseEntry(`﻿﻿﻿${SAMPLE}`), parseEntry(SAMPLE));
});

test("body handling: leading blank lines stripped, bare --- kept as body text", () => {
  const { body } = splitFrontmatter("---\na: 1\n---\n\n\n\ntext\n---\nmore\n");
  assert.equal(body, "text\n---\nmore\n");
});

test("firstSummaryLine skips headings, blanks and horizontal rules", () => {
  assert.equal(firstSummaryLine("# H1\n\n---\n\nThe summary.\nSecond."), "The summary.");
  assert.equal(firstSummaryLine("\n\n# only headings\n"), "");
});

test("bodySection extracts a '## <heading>' block verbatim, case-insensitively, null when absent/empty", () => {
  const body =
    "# x\n\nSummary.\n\n## Reception\n\n- Issues cite slow cold-start.\n- Adopters include acme.\n\n## Personal Notes\n\n- Firsthand only.\n";
  // stops at the next level-1/2 heading, drops the heading line, trims
  assert.equal(bodySection(body, "reception"), "- Issues cite slow cold-start.\n- Adopters include acme.");
  assert.equal(bodySection(body, "personal notes"), "- Firsthand only.");
  // heading match is case-insensitive; deeper (###) sub-headings stay inside
  assert.equal(bodySection("# x\n\n## Reception\n\n### Complaints\n\n- slow.\n", "Reception"), "### Complaints\n\n- slow.");
  // absent section and an empty section both return null
  assert.equal(bodySection("# x\n\nSummary only.\n", "reception"), null);
  assert.equal(bodySection("# x\n\n## Reception\n\n\n", "reception"), null);
});

test("bodySection stays aligned when a length-expanding Unicode char precedes the heading", () => {
  // 'İ' (U+0130) lowercases to two code units; a lowercased-index-then-slice-
  // original approach would drift +1 per char and silently drop the section.
  const pre = "İ".repeat(40);
  const body = `# x\n\n${pre}\n\n## Reception\n\n- Real signal here.\n`;
  assert.equal(bodySection(body, "reception"), "- Real signal here.");
});

test("parseEntry rejects non-decimal integer forms for stars (parity with Rust)", () => {
  const doc = (stars) =>
    `---\ngithub_url: https://github.com/a/b\nfull_name: a/b\ncategory: web-app\nstars: ${stars}\n---\nbody\n`;
  // Both implementations reject every exotic form; the raw-token guard catches
  // most with "plain decimal integer", while a form the JS yaml lib parses to a
  // string (0b…) is caught one step earlier by the number-type check. Either
  // way it must throw — that's the parity contract conformance also pins.
  for (const bad of ["1e3", "1000.0", "0x3e8", "0o1750", "0b1000", "01750", "007"]) {
    assert.throws(() => parseEntry(doc(bad)), `stars: ${bad} must be rejected`);
  }
  for (const ok of ["0", "1000", "+1000"]) {
    assert.equal(parseEntry(doc(ok)).meta.stars >= 0, true, `stars: ${ok} must be accepted`);
  }
});

test("serializeEntry emits canonical flow tags and omits null optionals (byte-parity with Rust)", () => {
  const meta = {
    github_url: "https://github.com/a/b",
    full_name: "a/b",
    category: "web-app",
    tags: ["rag", "vector-db"],
    stars: 100,
    language: null,
    last_github_push: null,
    last_checked: "2026-07-08",
    status: "active",
    source: "mcp",
    added_date: null,
  };
  const out = serializeEntry(meta, "# b\n\nsummary");
  assert.match(out, /\ntags: \[rag, vector-db\]\n/, "tags must be flow style");
  assert.equal(/\nlanguage:/.test(out), false, "null optionals must be omitted, not written as null");
  assert.equal(/\nadded_date:/.test(out), false, "null added_date must be omitted");
  // empty tags render as flow []
  assert.match(serializeEntry({ ...meta, tags: [] }, "b"), /\ntags: \[\]\n/);
});

test("normalizeTags trims and drops empty tags like the desktop AddRepo path", () => {
  assert.deepEqual(normalizeTags([" rag ", "", "   ", "vector-db"]), ["rag", "vector-db"]);
  assert.deepEqual(normalizeTags(undefined), []);
  assert.deepEqual(normalizeTags([]), []);
});

test("parseEntry materializes the serde defaults like Rust (minimal entry)", () => {
  const { meta } = parseEntry(
    "---\ngithub_url: https://github.com/a/b\nfull_name: a/b\ncategory: web-app\n---\nbody\n"
  );
  // Absent fields must come back as VALUES, not undefined — the status filter
  // in search_repos and suggest's active bonus read them directly.
  assert.deepEqual(meta.tags, []);
  assert.equal(meta.stars, 0);
  assert.equal(meta.status, "active");
  assert.equal(meta.source, "manual");
});

test("summarize applies the schema defaults for absent optional fields", () => {
  const { meta, body } = parseEntry(
    "---\ngithub_url: https://github.com/a/b\nfull_name: a/b\ncategory: web-app\n---\nbody\n"
  );
  const s = summarize({ id: "web-app/a-b", meta, body });
  assert.deepEqual(s.tags, []);
  assert.equal(s.stars, 0);
  assert.equal(s.status, "active");
  assert.equal(s.language, null);
});

test("saveNewEntry + findDuplicate: case-insensitive dup detection, duplicate create refused", () => {
  const dir = mkdtempSync(join(tmpdir(), "libraium-store-test-"));
  try {
    const meta = {
      github_url: "https://github.com/owner/repo",
      full_name: "owner/repo",
      category: "ai-agent",
      tags: ["rag"],
      stars: 1,
      status: "active",
      source: "mcp",
    };
    const saved = saveNewEntry(dir, meta, "# Repo\n\nSummary.");
    assert.equal(saved.id, "ai-agent/owner-repo");

    assert.ok(findDuplicate(dir, "OWNER/REPO"), "duplicate check must ignore case");
    assert.equal(findDuplicate(dir, "other/repo"), null);
    assert.throws(() => saveNewEntry(dir, meta, ""), /duplicate entry/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("listEntries skips an unreadable category dir instead of failing the whole library", (t) => {
  // chmod 000 is a no-op for root, so the EACCES this test relies on never fires.
  if (process.getuid?.() === 0) return t.skip("running as root");
  const dir = mkdtempSync(join(tmpdir(), "libraium-eacces-test-"));
  const lockedDir = join(dir, "entries", "web-app");
  try {
    const meta = (fullName, category) => ({
      github_url: `https://github.com/${fullName}`,
      full_name: fullName,
      category,
      tags: [],
      stars: 1,
      status: "active",
      source: "mcp",
    });
    saveNewEntry(dir, meta("a/b", "ai-agent"), "# A\n\nS.");
    saveNewEntry(dir, meta("c/d", "web-app"), "# C\n\nS.");
    chmodSync(lockedDir, 0o000);

    // Mirrors Rust scan_entries: degrade to the readable rest, never throw.
    const got = listEntries(dir);
    assert.deepEqual(got.map((e) => e.id), ["ai-agent/a-b"]);
  } finally {
    try {
      chmodSync(lockedDir, 0o755);
    } catch {}
    rmSync(dir, { recursive: true, force: true });
  }
});

test("guardRedirectedDuplicate refuses a rename onto a shelved repo (mirrors Rust)", () => {
  const dir = mkdtempSync(join(tmpdir(), "libraium-redirect-test-"));
  try {
    saveNewEntry(
      dir,
      {
        github_url: "https://github.com/new-owner/repo",
        full_name: "new-owner/repo",
        category: "ai-agent",
        tags: [],
        stars: 1,
        status: "active",
        source: "mcp",
      },
      "# Repo\n\nSummary."
    );

    // no redirect (same name in any casing): nothing to re-check
    guardRedirectedDuplicate(dir, "new-owner/repo", "new-owner/repo");
    guardRedirectedDuplicate(dir, "New-Owner/Repo", "new-owner/repo");

    // redirected onto an already-shelved repo: refuse, naming the entry
    assert.throws(
      () => guardRedirectedDuplicate(dir, "old-owner/repo", "new-owner/repo"),
      /already registered as ai-agent\/new-owner-repo.*renamed/
    );

    // redirected to a name not in the library: fine
    guardRedirectedDuplicate(dir, "old-owner/repo", "fresh-owner/repo");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadCategories: absent => [], corrupt/malformed => actionable error naming the file", () => {
  const dir = mkdtempSync(join(tmpdir(), "libraium-cats-test-"));
  try {
    assert.deepEqual(loadCategories(dir), []);

    mkdirSync(join(dir, "master"), { recursive: true });
    writeFileSync(join(dir, "master", "categories.yaml"), "categories: [unclosed");
    assert.throws(() => loadCategories(dir), /invalid YAML.*categories\.yaml|categories\.yaml.*invalid YAML/s);

    writeFileSync(join(dir, "master", "categories.yaml"), "categories: not-a-list\n");
    assert.throws(() => loadCategories(dir), /'categories' must be a list/);

    // Fail CLOSED on a malformed root, matching Rust categories::load (which
    // errors when the required `categories` field is missing/null/non-mapping)
    // instead of the old silent `?? []` that served zero categories.
    for (const malformed of ["title: hello\n", "categories: null\n", "- a\n- b\n", "\n"]) {
      writeFileSync(join(dir, "master", "categories.yaml"), malformed);
      assert.throws(() => loadCategories(dir), /malformed/, `root ${JSON.stringify(malformed)} must fail closed`);
    }
    // …but a valid empty list is fine.
    writeFileSync(join(dir, "master", "categories.yaml"), "categories: []\n");
    assert.deepEqual(loadCategories(dir), []);
    // order must also be a plain decimal token (parity with Rust i64 + stars).
    writeFileSync(join(dir, "master", "categories.yaml"), "categories:\n  - id: x\n    name: X\n    order: 1e3\n");
    assert.throws(() => loadCategories(dir), /plain decimal integer/);

    // A hand-edit slip inside a valid list (trailing '-' → null item, or a
    // bare string) must fail closed naming the file — not crash the sort
    // comparator with a raw TypeError (Rust's typed serde also rejects these).
    writeFileSync(join(dir, "master", "categories.yaml"), "categories:\n  - id: a\n    name: A\n    order: 1\n  -\n");
    assert.throws(() => loadCategories(dir), /item 2 is not a category mapping.*fix or remove/);
    writeFileSync(join(dir, "master", "categories.yaml"), "categories:\n  - just-a-string\n");
    assert.throws(() => loadCategories(dir), /item 1 is not a category mapping/);

    // scalar strictness mirrors Rust's Category schema: bare numeric id,
    // quoted numeric order, and non-string optional scalars all fail closed
    writeFileSync(join(dir, "master", "categories.yaml"), "categories:\n  - id: 2048\n    name: X\n");
    assert.throws(() => loadCategories(dir), /needs a string 'id' \(got 2048\)/);
    writeFileSync(join(dir, "master", "categories.yaml"), "categories:\n  - id: x\n    name: X\n    order: \"3\"\n");
    assert.throws(() => loadCategories(dir), /'order' must be an integer \(got "3"\)/);
    writeFileSync(join(dir, "master", "categories.yaml"), "categories:\n  - id: x\n    name: X\n    order: 3.5\n");
    assert.throws(() => loadCategories(dir), /'order' must be an integer \(got 3\.5\)/);
    writeFileSync(join(dir, "master", "categories.yaml"), "categories:\n  - id: x\n    name: X\n    color: 123\n");
    assert.throws(() => loadCategories(dir), /'color' must be a string/);
    writeFileSync(join(dir, "master", "categories.yaml"), "categories:\n  - id: x\n");
    assert.throws(() => loadCategories(dir), /needs a string 'name'/);

    writeFileSync(join(dir, "master", "categories.yaml"), "categories:\n  - id: b\n    name: B\n    order: 2\n  - id: a\n    name: A\n    order: 1\n");
    assert.deepEqual(loadCategories(dir).map((c) => c.id), ["a", "b"], "sorted by order");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("saveNewEntry rejects traversal-shaped categories before touching the fs", () => {
  const dir = mkdtempSync(join(tmpdir(), "libraium-cat-test-"));
  try {
    const meta = {
      github_url: "https://github.com/a/b",
      full_name: "a/b",
      category: "../../evil",
      tags: [],
      stars: 0,
      status: "active",
      source: "mcp",
    };
    assert.throws(() => saveNewEntry(dir, meta, "x"), /invalid category/);
    assert.throws(
      () => saveNewEntry(dir, { ...meta, category: "Weird Cat!" }, "x"),
      /invalid category/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("computeStatus mirrors Rust: archived wins, exclusive stale boundary, unknown date = active", () => {
  const daysAgo = (n) => new Date(Date.parse(`${today()}T00:00:00Z`) - n * 86_400_000).toISOString();
  assert.equal(computeStatus(true, daysAgo(1)), "archived");
  assert.equal(computeStatus(false, daysAgo(1)), "active");
  assert.equal(computeStatus(false, daysAgo(180), 180), "active", "exactly staleDays stays active");
  assert.equal(computeStatus(false, daysAgo(181), 180), "stale", "one day over flips to stale");
  assert.equal(computeStatus(false, null), "active", "no push date => active, not stale");
  assert.equal(computeStatus(false, "garbage"), "active", "unparseable date => active");
});

test("fetchGithubRepo: 429 gets the rate-limit hint, timeouts get a clear message", async () => {
  await assert.rejects(
    fetchGithubRepo("a/b", async () => ({ ok: false, status: 429 })),
    /429 \(rate limited — set GITHUB_TOKEN\)/
  );
  await assert.rejects(
    fetchGithubRepo("a/b", async () => ({ ok: false, status: 404 })),
    /404 \(not found\)/
  );
  const timeoutErr = new Error("aborted");
  timeoutErr.name = "TimeoutError";
  await assert.rejects(
    fetchGithubRepo("a/b", async () => {
      throw timeoutErr;
    }),
    /timed out after 10s/
  );
});

test("resolveDataDir precedence: --data-dir flag outranks LIBRAIUM_DATA_DIR", () => {
  // env is injected (like the Rust testable core) — no process.env mutation.
  const env = { LIBRAIUM_DATA_DIR: "/tmp/from-env" };
  assert.equal(
    resolveDataDir(["node", "x", "--data-dir", "/tmp/from-flag"], env),
    resolve("/tmp/from-flag")
  );
  assert.equal(resolveDataDir(["node", "x"], env), resolve("/tmp/from-env"));
});

test("resolveDataDir trims values and falls through on whitespace-only (mirrors Rust)", () => {
  // padded values are trimmed, never resolved verbatim into garbage paths
  assert.equal(
    resolveDataDir(["node", "x", "--data-dir", "  /tmp/flagged "], {}),
    resolve("/tmp/flagged")
  );
  assert.equal(
    resolveDataDir(["node", "x"], { LIBRAIUM_DATA_DIR: " /tmp/enved  " }),
    resolve("/tmp/enved")
  );
  // whitespace-only values fall through to the next tier
  assert.equal(
    resolveDataDir(["node", "x", "--data-dir", "   "], { LIBRAIUM_DATA_DIR: "/tmp/enved" }),
    resolve("/tmp/enved")
  );
  assert.equal(
    resolveDataDir(["node", "x"], { LIBRAIUM_DATA_DIR: "   " }),
    resolveDataDir(["node", "x"], {})
  );
});
