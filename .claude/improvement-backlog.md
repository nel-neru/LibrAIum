# Improvement Backlog

Seeded 2026-07-08 by a 4-agent audit (Rust core / MCP server / Svelte frontend / format-parity+docs+CI).
Worked by the `/improve` loop — one item per iteration, verified via `scripts/verify-all.sh`, committed.

## Pending  (ordered: highest value first)

### P1 — correctness & data-safety
- (all resolved — see Done)

### P2 — missing tests / parity pinning
- (all resolved — see Done)

### P3 — error handling / UX / docs / DX
- (all resolved — see Done)

## Done
- [x] P3 fresh-clone DX (3 items as one): verify-all prerequisite checks + stage 6 app-binary build + conformance dist/ guard + README order fix; CLAUDE.md and /verify synced to 6 stages. — 4c32c80 (2026-07-08)
- [x] P3 AddRepo modal semantics: real form + Enter submit, for/id labels, Escape close (guarded while in flight), URL autofocus. — 9b2f8ba (2026-07-08)
- [x] P3 Settings action hygiene (2 items as one): pending flags for Apply/Store/Commit/init/Generate + clipboard try/catch→fail. — 1671f60 (2026-07-08)
- [x] P3 Suggest-alternatives loading state: loadingAlts flag + Finding… label + disabled. — 919f6a2 (2026-07-08)
- [x] P3 runSearch race: monotonic sequence token discards stale responses/failures. — a29453d (2026-07-08)
- [x] P3 suggest input validation: schema trims + min(1); stopword-only descriptions get a distinct "no usable keywords" note; smoke 11+12. — de28212 (2026-07-08)
- [x] P3 GitHub fetch timeouts: 10s bound on BOTH sides (Node AbortSignal.timeout — ureq also had no overall timeout, fixed too); 429 now carries the token hint; fetchImpl injectable + unit-tested mappings. — b5ea011 (2026-07-08)
- [x] P3 corrupt categories.yaml: loadCategories wraps parse errors with path+hint, rejects non-list shape; suggest handler returns structured jsonError. — 0feab8d (2026-07-08)
- [x] P3 refresh_all rate-limit abort: typed `AppError::RateLimited` (403/429), sweep breaks on first hit with one actionable message. — 42a8575 (2026-07-08)
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
