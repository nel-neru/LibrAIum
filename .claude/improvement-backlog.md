# Improvement Backlog

Seeded 2026-07-08 by a 4-agent audit (Rust core / MCP server / Svelte frontend / format-parity+docs+CI).
Worked by the `/improve` loop — one item per iteration, verified via `scripts/verify-all.sh`, committed.

## Pending  (ordered: highest value first)

### P1 — correctness & data-safety
- (all resolved — see Done)

### P2 — missing tests / parity pinning
- (all resolved — see Done)

### P3 — error handling / UX / docs / DX
- [ ] P3 `refresh_all` keeps hammering GitHub after 403/429 — floods errors, wastes quota (`src-tauri/src/commands.rs:181-195`). Break early with one "rate limited — set a token" message.
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
- [x] P3 entry-scan visibility: `scan_entries` returns (entries, warnings), per-dir degradation matches per-file, list_entries command → {entries, warnings}, GUI toasts skipped count. — db2a72a (2026-07-08)
- [x] P3 corrupt settings.json: absent≠corrupt distinguished; corrupt file preserved as `settings.json.corrupt` + logged before defaults; unit test covers both. — e37962e (2026-07-08)
- [x] P3 add_repo path traversal closed: fail-closed on empty category master + kebab-case segment guard in saveNewEntry; unit test + smoke scenario 10. — 9a24e7f (2026-07-08)
- [x] P2 per-action busy flags: `busy: {refreshAll, refreshOne, push}` replaces the shared string; refresh actions mutually exclusive, push independent, all guard re-entry. ALL P2 ITEMS NOW RESOLVED. — 272117e (2026-07-08)
- [x] P2 EntryDetail Save double-submit guard: `saving` in-flight flag, early return, Saving… label, both edit buttons disabled. — 51cf2d8 (2026-07-08)
- [x] P2 EntryDetail load race: monotonic sequence token discards stale getEntry responses/failures; wrong-entry Edit/Delete path closed (parent already unmounts on close). — f59a5ac (2026-07-08)
- [x] P2 directory-authoritative-id test: frontmatter/directory disagreement → id from directory, raw meta preserved, only dir-derived id resolves. — 1eaadf7 (2026-07-08)
- [x] P2 gitops degradation tests: non-repo `status`→is_repo=false / `log`→[] (no error), commit/push on non-repo error cleanly, remoteless push fails with a git message. — 85710a1 (2026-07-08)
- [x] P2 github stale-boundary + apply_refresh transition tests: exclusive `>` at exactly stale_days, unparseable dates = active, and true ONLY on active→stale (stale→stale / recovery / archived all false). — aa345ee (2026-07-08)
- [x] P2 `resolve_data_dir` precedence tests: extracted injectable `resolve_data_dir_from(settings, env, cwd)` (no process-global mutation in parallel tests); covers trimming, blank fallthrough, ./data + ../data candidates, home fallback. — 2d94f7c (2026-07-08)
- [x] P2 BOM parity: Node stripped one leading BOM, Rust all — Node now `/^﻿+/`; pinned by `valid/bom.md` (real EF BB BF bytes) + one-or-many unit test. — 976ee5a (2026-07-08)
- [x] P2 schema-strict parsing on BOTH sides (also resolves the iter-2 missing-required item): Node gained `validateMeta`; investigation revealed the reverse divergence too — serde_yaml coerced plain numeric scalars into String (`full_name: 12345` ACCEPTED by Rust; audit assumption was wrong, harness caught it) — fixed with strict `deserialize_with`. 3 reject-by-both fixtures, tests on both sides, harness `Number()` mask removed. — 30e2e43 (2026-07-08)
- [x] P2 suggest.js unit tests: 5 node:test cases (tokenize, lexical-vs-baseline separation, stale/archived discounts, irrelevant⇒0 / relevant⇒ranked+reasoned+capped); npm test runs both unit files before smoke. — 2402652 (2026-07-08)
- [x] P2 store.js unit tests: 9 node:test cases mirroring the Rust inline tests + regressions for iter-2/3 fixes (non-mapping frontmatter, CRLF==LF); `npm test` now runs unit tests before the smoke test. — 9b99863 (2026-07-08)
- [x] P2 exported `LIBRAIUM_DATA_DIR` redirected repo validation: the post-edit hook AND verify-all stage 1 inherited the env var, so edits to the repo's `data/` validated a different library (false pass). Both now pass `--data-dir` explicitly; proven with a bogus env var + hook payload. — bf849d8 (2026-07-08)
- [x] P2 slugify/normalizeGithubUrl divergences (Node accepted `github.com:a/b`; astral chars double-dashed) — Node now ports the Rust algorithms verbatim; conformance grew a function-level stage over `functions.json` (28 cases, both historical divergences pinned); CLAUDE.md + fixtures README updated. — ef59a51 (2026-07-08)
- [x] P1 suggest.js: status(+3)/stars(≤+6) baseline cleared the `score > 3` relevance filter with zero query hits — garbage/empty descriptions returned star-ranked noise with empty `why`. `scoreEntry` now returns a separate `lexical` subscore; `suggest()` requires `lexical > 0 && score > 3`. Smoke scenario 9 pins irrelevant-query ⇒ 0 suggestions + threshold note. — 2ff2291 (2026-07-08)
- [x] P1 CRLF divergence: Node splitter kept `\r` on every line (corrupting the last frontmatter value and all body lines) while Rust stripped it. `split(/\r?\n/)` now mirrors `str::lines()`; pinned by `valid/crlf.md` (real CRLF bytes, `.gitattributes -text` protected; verified the committed blob keeps `0d 0a`); all other `*.md` forced LF. — 4334771 (2026-07-08)
- [x] P1 MCP server: an entry whose frontmatter YAML-parses to `null` (e.g. `---\n---`) crashed ALL four tools — `parseEntry` returned `{meta: null}` without throwing, so `listEntries`' catch never skipped it. Node now rejects non-mapping frontmatter (mirrors Rust's typed serde); contract pinned by `invalid/empty-frontmatter.md` (rejected by both) + fixtures README. — 8fa7a0a (2026-07-08)
- [x] P1 `save_entry` silently overwrote a DIFFERENT entry when an update moved/renamed onto an occupied path (category change → destination already owned by another repo → occupant destroyed, then source deleted; reachable from EntryDetail edit). Unified the create/update guard: any write to an existing path that is not the entry's own file is refused as Duplicate. Regression test `update_move_refuses_to_overwrite_other_entry`. — 8ba3a19 (2026-07-08)

## Rejected
- (none yet)
