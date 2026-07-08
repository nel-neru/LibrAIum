# Improvement Backlog

Seeded 2026-07-08 by a 4-agent audit (Rust core / MCP server / Svelte frontend / format-parity+docs+CI).
Worked by the `/improve` loop — one item per iteration, verified via `scripts/verify-all.sh`, committed.

## Pending  (ordered: highest value first)

### P1 — correctness & data-safety
- [ ] P1 MCP server: an entry whose frontmatter YAML-parses to `null` (e.g. `---\n---`) crashes ALL four tools — `parseEntry` returns `{meta: null}` without throwing, so `listEntries`' catch never skips it and `index.js` sorts/derefs `null.stars` (`mcp-server/lib/store.js:35`, `index.js:63`). Rust skips such files gracefully. Fix: throw in `parseEntry` when meta is not a non-null map; add `tests/fixtures/format/invalid/` fixture — one bad file must not brick the server.
- [ ] P1 CRLF divergence: Node `splitFrontmatter` splits on `\n` only, keeping `\r` — corrupts the last frontmatter value (`category: "x\r"`) and every body line; Rust `.lines()` strips it (`mcp-server/lib/store.js:23` vs `src-tauri/src/frontmatter.rs:7`). Fix: split on `/\r?\n/`, add `tests/fixtures/format/valid/crlf.md`, consider `.gitattributes` `*.md text eol=lf` — README promises Windows support.
- [ ] P1 suggest.js: relevance threshold is defeated by the status/stars baseline — any active repo with ≥1 star clears `score > 3` with zero lexical hits, so garbage/empty queries return star-ranked "suggestions" with empty `why` (`mcp-server/lib/suggest.js:62,67,91`). Fix: require lexical subscore > 0; status/stars only break ties among relevant entries.

### P2 — missing tests / parity pinning
- [ ] P2 conformance.mjs only exercises `parseEntry` — `slugify` and `normalizeGithubUrl` are dual-implemented and CONFIRMED divergent (`github.com:a/b`: Node accepts, Rust rejects; astral emoji: Node `a-b--c` vs Rust `a-b-c`) (`scripts/conformance.mjs:25`, `store.js:79-81` vs `store.rs:13-44`). Fix: add `--slugify`/`--normalize-url` modes to `dump_entries.rs` + a conformance stage over a string corpus, then align whichever side is wrong.
- [ ] P2 post-edit hook validates the WRONG data dir when `LIBRAIUM_DATA_DIR` is exported — it inherits env, and `resolveDataDir` prefers the env var over `./data`, so repo-data edits go unvalidated (`.claude/hooks/post-edit.mjs:63-67`). Fix: invoke validator pinned to the repo's `data/` explicitly.
- [ ] P2 no unit tests for `mcp-server/lib/store.js` pure functions (normalizeGithubUrl / slugify / parse-serialize roundtrip / findDuplicate) — the Rust twin has them; the JS side only has the e2e smoke. Add `test/store.test.mjs` mirroring the Rust cases.
- [ ] P2 no unit tests for `mcp-server/lib/suggest.js` (tokenize / scoreEntry / threshold) — would have caught the P1 threshold bug. Add table-driven tests.
- [ ] P2 type-coercion divergence unpinned: `stars: "123"` / `full_name: 12345` — Rust (typed serde) rejects, Node (untyped YAML.parse) accepts; `conformance.mjs:98` `Number(...)` masks it. Add invalid fixtures + stop masking in the harness.
- [ ] P2 BOM handling: documented in fixtures README but no fixture has a BOM; Rust strips all leading BOMs, Node strips one (`frontmatter.rs:6` vs `store.js:23`). Add `valid/bom.md` fixture; make Node strip `/^﻿+/`.
- [ ] P2 `settings::resolve_data_dir` 4-level precedence (setting > env > ./data > ~/LibrAIum/data) has zero tests (`src-tauri/src/settings.rs:50`). Add precedence unit tests.
- [ ] P2 `github.rs` stale boundary untested: `num_days == stale_days` vs `+1`, and `apply_refresh` "true only on active→stale" contract has no test (`src-tauri/src/github.rs:51,69`).
- [ ] P2 gitops non-repo branches untested: `status(non_repo).is_repo == false`, `log(non_repo) == []`, push with no remote (`src-tauri/src/gitops.rs:66-74,118-120`).
- [ ] P2 store.rs "directory is authoritative for id" behavior untested — file whose frontmatter category disagrees with its dir (`src-tauri/src/store.rs:55-61`).
- [ ] P2 EntryDetail stale-load race: overlapping `getEntry` calls, last-to-resolve wins — drawer can show entry A while `selectedId` is B, then Edit/Delete hits the wrong repo (`src/lib/components/EntryDetail.svelte:18-24`). Fix: request token, discard stale responses.
- [ ] P2 EntryDetail Save has no in-flight guard/disabled state — double-click fires `saveEntry` twice with the same stale `previousId` (`EntryDetail.svelte:46-63,183`). Mirror `AddRepo.submit`'s `adding` pattern.
- [ ] P2 single global `app.busy` string shared by refresh-all / refresh-one / push — one action clobbers another's guard and label (`Dashboard.svelte:19`, `EntryDetail.svelte:66`, `Settings.svelte:78`). Fix: per-action flags.

### P3 — error handling / UX / docs / DX
- [ ] P3 `settings::load` swallows corrupt settings.json → silently resets `data_dir` and next save overwrites the file (`src-tauri/src/settings.rs:30`). Distinguish absent (defaults) from unparseable (surface error).
- [ ] P3 `list_entries` hides malformed entries (stderr only, GUI never sees it) and aborts entirely on one unreadable category dir (`src-tauri/src/store.rs:82,87`). Return warnings; degrade per-dir like per-file.
- [ ] P3 `refresh_all` keeps hammering GitHub after 403/429 — floods errors, wastes quota (`src-tauri/src/commands.rs:181-195`). Break early with one "rate limited — set a token" message.
- [ ] P3 MCP add_repo: category never sanitized as a path segment; when categories.yaml is missing the master check is SKIPPED, so `../../x` writes outside the data dir (`mcp-server/index.js:153`, `lib/store.js:104-105`). Validate `/^[a-z0-9-]+$/` + fail closed.
- [ ] P3 corrupt categories.yaml: `suggest_for_new_project` has no try/catch → SDK-level crash; add_repo relays a cryptic parser error (`mcp-server/lib/store.js:67`, `index.js:113-120`). Wrap + actionable message.
- [ ] P3 MCP `fetchGithubRepo`: no fetch timeout (can hang the tool call) and 429 lacks the rate-limit hint that 403 has; Rust handles both (`mcp-server/lib/store.js:120-122`). Add `AbortSignal.timeout`, include 429.
- [ ] P3 suggest tool accepts empty/whitespace `project_description` → combined with the threshold bug returns confident noise (`mcp-server/index.js:108`). `z.string().trim().min(1)` + early "no tokens" note.
- [ ] P3 `runSearch` results race — chip clicks bypass the debounce; stale results can overwrite fresh (`src/lib/state.svelte.js:62-75`). Monotonic query id.
- [ ] P3 "Suggest alternatives" button: no loading state, repeat clicks fire duplicate backend calls (`EntryDetail.svelte:90-97,137`).
- [ ] P3 clipboard copies unguarded — rejection = silent no-op, no toast (`Settings.svelte:108-120`). try/catch → `fail(e)`.
- [ ] P3 Settings async buttons (Apply/commit/saveToken/initRepo/export) lack pending flags — double-submit possible (`Settings.svelte:31,45,66,90,100`).
- [ ] P3 AddRepo modal: no `<form>` (Enter doesn't submit), labels not associated, no Escape/focus management (`src/lib/components/AddRepo.svelte:48-99`).
- [ ] P3 README Development section orders `cargo test` before `npm run build` — fails on fresh clone (`README.md:90-91`); reorder or add the dist/ note.
- [ ] P3 fresh-clone DX: verify-all stage 1 crashes with `Cannot find package 'yaml'` if `mcp-server && npm install` wasn't run; standalone conformance.mjs needs dist/ (`scripts/validate-data.mjs:16-22`). Check prerequisites with clear errors.
- [ ] P3 verify-all/CI never exercises app startup or bundling — a broken tauri.conf bundle config or startup panic passes all 5 stages (this exact gap shipped the `default-run` breakage). Add stage 6: `cargo build --bin libraium --locked`.

## Done
- [x] P1 `save_entry` silently overwrote a DIFFERENT entry when an update moved/renamed onto an occupied path (category change → destination already owned by another repo → occupant destroyed, then source deleted; reachable from EntryDetail edit). Unified the create/update guard: any write to an existing path that is not the entry's own file is refused as Duplicate. Regression test `update_move_refuses_to_overwrite_other_entry`. — 8ba3a19 (2026-07-08)

## Rejected
- (none yet)
