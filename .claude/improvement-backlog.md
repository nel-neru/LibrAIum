# Improvement Backlog

Re-seeded 2026-07-08 by a fresh 4-agent audit after the loop restarted the same day the
first convergence closed (that history — 30 iterations, 37 findings — is preserved under
Done below). The Rust-core auditor came back CONVERGED; the MCP-server, frontend, and
parity/docs auditors surfaced the items now in Pending.
Worked by the `/improve` loop — one item per iteration, verified via `scripts/verify-all.sh`, committed.

## Pending  (ordered: highest value first)

Re-seeded 2026-07-08 by the iter-42 convergence audit (4 agents; the loop's own recent
fixes came back CONVERGED, but the never-audited 4dccdd6 UI redesign and a fresh
MCP/parity sweep surfaced the items below).

### P1 — correctness & data-safety
- (all resolved — see Done)

### P3 — error handling / UX / parity robustness

### P4 — dual-format hardening
- (all resolved — see Done)

### P5 — docs / DX / design conformance
- [ ] P5 dev mock behavioral divergence (as one item): save_entry never recomputes id on category change (core flow unexercisable in preview), add_repo_from_url skips the dup guard (double-add crashes Library's keyed each in dev), search matches full body vs real first_summary_line, suggest_alternatives ignores cap/ranking, check_duplicate compares raw URLs. — src/lib/dev/mock.js:119-184 vs src-tauri/src/commands.rs, search.rs
- [ ] P5 DESIGN.md conformance drift ×4: --t-drawer 300ms vs contracted 240ms (styles.css:55); ⭐ emoji in AddRepo toast vs "no emoji in chrome" (AddRepo.svelte:46); `open-source-tooling` color #878580 is base-500 (not accent 400–700) AND identical to the unknown-category fallback (categories.yaml, state.svelte.js:115); Dashboard non-interactive stat div inherits cursor:pointer (Dashboard.svelte:60-63,102).
- (all resolved — see Done)

### P5 — docs / DX
- (all resolved — see Done)

## Done

First convergence: closed 2026-07-08 after 30 iterations, 37 findings, all stages green
throughout (see 3f771cb); the loop restarted the same day and re-seeded from a fresh audit.

- [x] P5 docs/automation sync ×3 (as one): hook PARITY_FILES + settings.rs/categories.rs (verified firing); all command-doc validate-data calls pinned with --data-dir (incl. format-sync.md, found in flight); README gains frontend tests, npm test, DESIGN.md and the browser mock. — e3597b1 (2026-07-09) [iter-47]
- [x] P4 Category-master strict scalars BOTH sides: Rust Category gains strict_string on its five String fields (no more `id: 2048` → "2048" coercion), Node loadCategories requires string id/name + typed optional scalars + numeric order with value-naming errors; four shapes pinned by paired tests. Conformance-corpus coverage for categories.yaml consciously deferred (unit tests + parity hook are the tripwire). — 6f2657c (2026-07-09) [iter-46]
- [x] P3 Categories id-lock by row persistence: rows carry a `locked` flag (loaded=true, new=false, promoted on save; stripped from the payload) — a new row no longer self-disables when its typed value collides with an existing id; implements the documented "locks PERSISTED ids" semantics exactly. Verified live in preview. — f946482 (2026-07-09) [iter-45]
- [x] P3 EntryCard keyboard activation: Space now activates (with scroll prevention) and chip-originated keydowns stay on the chips (target guard) — mouse/keyboard behavior unified on the library's primary surface. Verified live in preview (Space opens, chip Enter filters 7→2 without opening, card Enter opens). — ad3e362 (2026-07-08) [iter-44]
- [x] P3 MCP add_repo tag normalization: `normalizeTags` (trim + drop empties, mirrors AddRepo.svelte) exported from lib/store.js and unit-tested — LLM-sent padded/empty tags no longer produce validator-rejected entries or unfilterable tags. — f722703 (2026-07-08) [iter-43]
- [x] P1 Node parseEntry serde-default parity: minimal entries (status/source/tags/stars absent) were silently EXCLUDED from status-filtered search_repos while summarize labeled them "active"; parseEntry now materializes the four defaults like models.rs, and conformance's normalizeMeta stopped re-filling them (it was masking exactly this drift against its own comment) — example-minimal.md now pins the contract live. Found independently by two iter-42 auditors. — a6ccef8 (2026-07-08) [iter-42]
- [x] P5 automation drift ×2 (as one): post-edit hook parity set gains `github.rs` (+ "status computation" in the message) — the one dual-implemented rule with zero tripwire; `/improve` doc "5 stages" → 6. Hook verified with fake payloads. — 94e7edf (2026-07-08) [iter-41]
- [x] P3 Settings labels associated (settings-data-dir / settings-stale-days for/id pairs): the production build is now WARNING-CLEAN — any future build warning is a regression signal. — 7a6357f (2026-07-08) [iter-40]
- [x] P3 CSP defense-in-depth: `csp: null` → self-pinned policy (style-src 'unsafe-inline' for style attrs, img-src data: for the grain texture — remote tracking pixels blocked, connect-src ipc:/http://ipc.localhost for Tauri IPC, object/frame 'none'). Verified via meta-tag injection in browser preview: zero violations, grain + all views + drawer work. One manual `npm run tauri dev` sanity check of the ipc: directives recommended. markdown.js comment updated (escaping stays primary). — 601d6b5 (2026-07-08) [iter-39]
- [x] P3 EntryDetail drawer keyboard access: Escape cancels-edit-then-closes (guarded while saving, defers to AddRepo on top), drawer receives focus on open (tabindex=-1), 4 edit labels for/id-associated, meta-grid captions → .field-label spans (styled from the same rule as label). All 10 EntryDetail a11y warnings gone; behavior verified live in browser preview. — 696aac5 (2026-07-08) [iter-38]
- [x] P3 suggest `tokenize` sentence-final periods stripped: "…in Rust." no longer misses the exact language match and category/name substring scoring; interior/leading dots (node.js/.net) preserved, dots-only fragments dropped as a bonus. 4 new tokenize cases. — 71cbd1f (2026-07-08) [iter-37]
- [x] P3 `loadCategories` fails closed on null/non-mapping items: trailing `-` / bare string in a hand-edited categories.yaml now throws an error naming the file, item index, and likely cause instead of a raw sort-comparator TypeError (0feab8d failure class, one level deeper; Rust's typed serde already rejects these). Unit-tested both slip shapes. — 7188546 (2026-07-08) [iter-36]
- [x] P3 MCP `resolveDataDir` env parity: flag/env tiers now trim and fall through on whitespace-only (mirrors Rust resolve_data_dir_from, 2d94f7c) — a padded `LIBRAIUM_DATA_DIR` can no longer split the MCP server and desktop app onto different data dirs. env made injectable like the Rust testable core; precedence test rewritten mutation-free + trim/fallthrough cases. — 0fab55f (2026-07-08) [iter-35]
- [x] P3 MCP `listEntries` per-category-dir degradation: an unreadable category dir (EACCES) no longer kills all four tools — guarded readdir warns on stderr and skips, mirroring Rust `scan_entries` (db2a72a); unreadable entries/ ROOT stays a hard error on both sides on purpose. Unit test chmods a category to 000 (root-skipped). — 1df89cc (2026-07-08) [iter-34]
- [x] P1 add_repo rename-redirect hole closed on ALL THREE add paths: mirrored `guard_redirected_duplicate` (Rust store) / `guardRedirectedDuplicate` (Node store) re-checks duplicates under the API's post-301 `full_name` right after the fetch, byte-identical error text; both add paths now derive `github_url` from `gh.full_name` (validate-data invariant holds by construction); `/add-entry` doc gained the matching instruction (libraium-reviewer caught the third path). Same 4 unit-test cases both sides. Residual: the REVERSE rename direction (shelved under old name, new name typed) has no redirect signal and needs the numeric GitHub repo id — a format change, deliberately not made (documented in both guard comments). — bcd7b27 (2026-07-08) [iter-33]
- [x] P1 Categories id-lock made reactive: `existingIds` was a plain `let` reassigned in save() (compiler warned `non_reactive_update`), so a category added+saved in one session kept an editable id — renaming it then orphaned the entry directory the id names. Now `$derived(app.categories)`; the lock recomputes on save. Verified by the warning disappearing + verify-all 6/6 (no frontend component test harness exists; browser preview was blocked by a parallel session holding port 1420). — 097bec1 (2026-07-08) [iter-32, found by iter-31 fresh audit]
- [x] P1 stored-XSS in entry bodies: `EntryDetail` rendered `{@html marked.parse(body)}` with no sanitizer while the app ships `csp: null`, so injected HTML/handlers in an untrusted body (GitHub description embedded verbatim on add; git-synced entries) reached Tauri IPC. New `src/lib/markdown.js` overrides marked's html/link/**image** renderers to escape raw HTML and allowlist schemes (the image `alt` was the non-obvious vector — flagged by libraium-reviewer before commit); `tests/markdown.test.mjs` (node --test, no new deps) wired into verify-all stage 3. — fcd9068 (2026-07-08) [found by iter-31 fresh audit]

- [x] P1 Rust save_entry path-traversal guard: kebab-case category enforced before fs (mirrors Node saveNewEntry 9a24e7f); a crafted `category: ../../x` in a git-synced entry could otherwise make Refresh All write outside the data dir + delete the source. Test `save_entry_rejects_traversal_category`. — 7569f6d (2026-07-08) [found by iter-30 fresh audit]
- [x] P2 MCP add_repo status parity: `computeStatus()` mirrors Rust compute_status (archived/stale/active, 180-day default) so MCP-added dormant repos aren't mislabeled active. Unit test covers the boundary. — 7569f6d (2026-07-08) [found by iter-30 fresh audit]
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
