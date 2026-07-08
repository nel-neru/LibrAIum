---
description: Mirror a data-format change across the Rust and Node implementations, prove conformance, and add a fixture
---

The LibrAIum data format is **deliberately dual-implemented**: the Rust core (desktop app) and the Node MCP server each parse, validate, and serialize the same files. After ANY change to the entry format, slugify, URL normalization, duplicate detection, or category master shape, run this synchronization procedure.

## 1. Identify what changed and mirror it

Walk this mapping and make the counterpart change on the other side:

| Concern | Rust | Node |
| --- | --- | --- |
| Frontmatter schema, field defaults (`status: active`, `source: manual`, `stars: 0`, optional-field omission) | `src-tauri/src/models.rs` (`EntryMeta`) | `mcp-server/lib/store.js` (`parseEntry` consumers, `summarize` defaults) |
| Frontmatter split/parse/serialize (BOM handling, `---` fences, body trimming, trailing newline) | `src-tauri/src/frontmatter.rs` | `mcp-server/lib/store.js` (`splitFrontmatter`, `parseEntry`, `serializeEntry`) |
| `slugify` (allowed charset `[a-z0-9-_.]`, `/` → `-`, lowercase, trim `-`) | `src-tauri/src/store.rs` (`slugify`) | `mcp-server/lib/store.js` (`slugify`) |
| GitHub URL normalization (http/https/bare/`git@` forms, `.git`, trailing `/`, `/tree/...`) | `src-tauri/src/store.rs` (`normalize_github_url`) | `mcp-server/lib/store.js` (`normalizeGithubUrl`) |
| Duplicate detection (case-insensitive `full_name`) and entry id (`<category>/<slug>`) | `src-tauri/src/store.rs` (`find_duplicate`, `list_entries`) | `mcp-server/lib/store.js` (`findDuplicate`, `listEntries`, `saveNewEntry`) |

Both sides must **accept, reject, and produce identical results**. Where the change touches parsing, check the reject cases too (missing opening `---`, unterminated frontmatter) — error *behavior* must match even if error text differs.

## 2. Add a fixture for the new shape

Add a fixture covering the new format shape to `tests/fixtures/format/`. Follow the naming pattern already used there (valid inputs that must round-trip, and invalid inputs both sides must reject). The conformance runner picks fixtures up automatically. Also extend the unit tests nearest the change (`frontmatter::tests` / `store::tests` in Rust) if the fixture alone can't express it.

## 3. Prove it

Run all three, in this order, and get all of them green:

```bash
export PATH="/opt/homebrew/bin:$PATH"
node scripts/conformance.mjs          # Rust ⇔ Node behavioral diff over the fixtures
cd src-tauri && cargo test            # Rust unit tests
cd mcp-server && npm test             # MCP stdio smoke test
```

A conformance failure means one side drifted — fix the *implementation* that departs from the intended format, never the fixture, unless the format change itself was the point.

## 4. Close out

- If the format change affects existing entry files under `data/entries/`, migrate them and run `node scripts/validate-data.mjs`.
- Update the Data Model section of `CLAUDE.md`/`README.md` if the on-disk format visibly changed.
- Summarize: what changed, which files on each side, which fixture covers it. For an independent double-check, the `conformance-auditor` agent can audit the result.
