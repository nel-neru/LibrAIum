# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

**Always converse with the user in Japanese** — replies, explanations, plans, questions, and progress reports. Keep repository artifacts in English: code, comments, commit messages, README/docs, and identifiers (the repo is published publicly in English; the owner reads both).

## What LibrAIum Is

A local-first Tauri v2 + Svelte 5 desktop app for curating best-practice GitHub repositories, storing everything as YAML-frontmatter Markdown files in a local git repository, and exposing the library to Claude Code through an MCP server. The authoritative spec is `LibrAIum_完全設計書_v1.0.md` (Japanese). v1.0 MVP is fully implemented.

## Commands

```bash
npm run tauri dev                # run the desktop app (Rust compiles on first run)
npm run tauri build              # package release build
npm run build                    # frontend-only production build (vite)
npm test                         # frontend unit tests (markdown-renderer hardening, node --test)
cd src-tauri && cargo test       # Rust unit tests — all core logic lives here
cd src-tauri && cargo test store # run one module's tests (store/search/gitops/github/…)
cd mcp-server && npm test        # store.js unit tests + MCP stdio smoke test (all 4 tools)
bash scripts/make-icons.sh       # regenerate icons from scripts/generate-icons.mjs (macOS)
node scripts/register-mcp.mjs    # user-scope MCP registration plan (--yes to apply, --doctor to diagnose)
```

Rust was installed via Homebrew; if `cargo` is missing from PATH: `export PATH="/opt/homebrew/bin:$PATH"`.

Note: `cargo test`/`cargo build` require `dist/` to exist (Tauri's `generate_context!` embeds it) — run `npm run build` first on a fresh clone.

## Architecture

Two independent consumers share one data format:

1. **Desktop app** — Svelte 5 GUI (`src/`) → Tauri commands (`src-tauri/src/commands.rs`) → Rust core modules.
2. **MCP server** (`mcp-server/`, Node stdio) — reads/writes the same `data/` directory directly.

**The data format is duplicated on purpose**: `src-tauri/src/store.rs` (Rust) and `mcp-server/lib/store.js` (JS) each implement frontmatter parse/serialize, slugify, URL normalization, and duplicate checks. If you change the entry format or these rules, change BOTH and keep `frontmatter::tests` + the MCP smoke test green.

Rust core modules (`src-tauri/src/`):
- `models.rs` — `EntryMeta` (the frontmatter schema), `Entry`, `Category`, `SearchQuery`
- `store.rs` — entry CRUD; entry id = `<category-dir>/<slug>`, so a category change moves the file
- `search.rs` — SkimMatcherV2 fuzzy search + filters; `tag_alternatives` (same category + shared tag + active) and `suggest_alternatives` (authored `superseded_by` targets first, then the tag heuristic)
- `github.rs` — metadata fetch (ureq) + stale logic: push older than `stale_days` ⇒ `stale`, GitHub `archived` ⇒ `archived`
- `gitops.rs` — wraps the **git CLI**, not libgit2 (deliberate deviation from the design doc: push inherits the user's credential helpers/SSH agent)
- `settings.rs` — settings.json in app config dir; data-dir resolution order: explicit setting > `LIBRAIUM_DATA_DIR` > `./data`|`../data` (dev) > `~/LibrAIum/data` (bootstrapped on first run); default categories embedded via `include_str!` from `data/master/categories.yaml`
- `commands.rs` — Tauri command layer; network/push commands are `async` + `spawn_blocking`; GitHub PAT lives in the OS keychain (`keyring` crate, service "LibrAIum")

Frontend (`src/`): Svelte 5 **runes** (no stores); shared state in `lib/state.svelte.js`; all IPC via `lib/api.js` wrappers. Command args are camelCase (Tauri converts to snake_case), but **struct fields inside payloads stay snake_case** (`min_stars`, `full_name`). Entry bodies are untrusted (GitHub descriptions, git-synced entries) and must render through `lib/markdown.js` (escapes raw HTML, strips unsafe link schemes) — never a bare `marked.parse` into `{@html}`.

**UI styling is governed by `DESIGN.md`** (Flexoki paper-and-ink tokens in `src/styles.css`, light+dark). Before touching any UI file, read DESIGN.md and use only its tokens — do not invent colors, fonts, radii, or shadows, and never reintroduce emoji into chrome. In a plain browser, `npm run dev` auto-installs `src/lib/dev/mock.js` (Tauri IPC mock with seeded data) so the UI can be previewed and screenshotted without the Rust backend.

MCP server tools: `search_repos`, `get_repo_details`, `suggest_for_new_project` (lexical scoring in `lib/suggest.js`, inlines `personal_notes`), `compare_repos` (decision matrix in `lib/compare.js`), `get_library_overview` (shelf map/tag vocabulary in `lib/overview.js`), `get_related` (structured succession/pairing graph in `lib/related.js` — Node-only, no Rust twin), `find_by_reception` (lexical query over the `## Reception` moat by adopter/migration/caution signal, returning the matching bullets as evidence; `lib/reception.js` — Node-only), `add_repo` (source: `mcp`). Entries are also MCP **resources** (`entry://{category}/{slug}` template) for `@libraium` @-mention autocomplete — the read callback resolves by entry id, never by joining URI segments into a path (traversal guard). Data dir resolution mirrors the Rust order (plus `--data-dir` flag).

## Data Model

- One repo = one file: `data/entries/<category>/<owner-repo>.md` — frontmatter fields are exactly `EntryMeta` in `models.rs`; body is a summary + a `## Reception` section (synthesized third-party signal), plus — only where the owner has firsthand experience — an optional `## Personal Notes`
- Relationship edges `superseded_by`/`pairs_with` (flow lists of `owner/repo` full_names) are stored ONE-directionally — `superseded_by` on the stale/old entry, `pairs_with` on either side — and the inverse (`supersedes`, and the symmetric pairing) is derived at read time, never stored, so the two directions cannot drift. Empty ⇒ omitted (dual `skip_serializing_if`/omit); a target need not be shelved (validate warns, doesn't fail)
- Category master: `data/master/categories.yaml`; category `id`s are entry directory names — renaming an id orphans its directory (the GUI locks persisted ids for this reason)
- Rejected-candidates memory: `data/master/rejected.yaml` (`{full_name, date, reason}` list) — repos scouted and consciously declined, so `/scout` and bulk-triage don't re-surface them. Curator-side & Node-only (`mcp-server/lib/rejected.js`; no Rust twin); written via `scripts/reject-candidate.mjs`, read by `bulk-add --from-stars` and `/scout` dedup; validate-data checks its shape and flags any repo both rejected and shelved
- Curation health trend: `data/master/health-log.jsonl` (append-only, one dated scalar snapshot per line) — written by `curation-report.mjs --snapshot` (run at the end of `/curate-review`), viewed with `--trend`. Answers "is drift getting better?" (thin shelves / singleton tags / near-synonyms / succession holes over time); not read by the app or MCP
- `status`: `active | stale | archived` (auto-managed by refresh); `source`: `manual | mcp | x-collection`
- The repo's `data/` ships seeded sample entries (incl. one deliberately stale entry, `openai/swarm`, used to demo stale detection/alternatives)

## Repo automation & AI infrastructure

- **`bash scripts/verify-all.sh`** is the single verification entry point (also run by CI): data validation → cargo test → vite build + frontend unit tests → MCP unit+smoke tests → Rust⇔Node conformance → catalog drift check → app binary build (`cargo build --bin libraium` — the only stage that builds the real binary; a broken bare `cargo run` once passed everything else). Run it before any commit; `/verify` wraps it.
- **`node scripts/validate-data.mjs`** — schema-validates every entry + the category master. A PostToolUse hook runs it automatically after any `data/` edit and feeds failures back for self-correction.
- **`node scripts/conformance.mjs`** — proves the Rust and Node data-format implementations agree, over `tests/fixtures/format/` (valid/ must parse identically, invalid/ must be rejected by BOTH), all real entries, and a function-level corpus (`functions.json`: `slugify` + `normalizeGithubUrl`, via `dump_entries --slugify/--normalize-url`). When you change the format or these functions: update both implementations, add a fixture/corpus case, keep this green (`/format-sync` walks through it).
- **`node scripts/build-catalog.mjs`** — regenerates `CATALOG.md` (browsable per-category index + tag index) and the README `<!-- library-stats -->` block from `data/`. The post-edit hook runs it after any `data/` edit; `--check` (a verify-all stage) fails on drift. Output carries no timestamp on purpose (a daily-changing line would break the drift check). Never hand-edit CATALOG.md or the README stats block.
- **Hooks** (`.claude/hooks/post-edit.mjs`): rustfmt on edited `.rs`; parity reminder when either half of the dual implementation is edited; data validation as above.
- **Commands**: `/verify`, `/add-entry <github-url>`, `/curate-review`, `/format-sync`, `/improve` (one PDCA iteration of the continuous-improvement loop — robustness/hardening; state in `.claude/improvement-backlog.md`; counterpart to `/utilize`), `/utilize` (one PDCA iteration of the utilization loop — new capability; state in `.claude/utilization-backlog.md`), `/refresh-metadata` (headless GitHub metadata refresh via `scripts/refresh-metadata.mjs`; dry-run first), `/reception` (gather third-party Reception signal via the read-only `scripts/reception-scan.mjs` dossier and draft each `## Reception` section; batch ~3; coverage tracked in `.claude/reception-review.md`), `/bulk-add` (batch intake from a URL list or GitHub stars via `scripts/bulk-add.mjs`; writes skeletons, then the command drafts sourced Reception), `/scout` (source vetted GitHub candidates for a thin shelf or a stale entry's successor via `gh search repos`, deduped against the library AND the rejected-candidates memory; records declines via `scripts/reject-candidate.mjs`). **Agents**: `entry-curator`, `conformance-auditor`, `libraium-reviewer`. **Skill**: `entry-authoring` (house style for entries — consult it before writing any `data/entries/**/*.md`).
- **Integrations** (`integrations/`, `docs/`): `integrations/claude/skills/libraium-first/` is the user-scope skill that makes Claude Code sessions in OTHER repos consult this library before dependency decisions; `docs/library-first-setup.md` is its setup page (user-scope MCP registration + paste-in CLAUDE.md block). Keep the skill's tool names in sync with `mcp-server/index.js`.
- Known flake guard: the MCP smoke test uses a 30s handshake timeout because server boot can exceed 10s right after cargo/vite stages on a loaded machine. Stale-dependent smoke scenarios run against `mcp-server/test/fixtures/stale-lib/` (a checked-in mini-library with a guaranteed-stale entry), never against refreshable real entries.

## Constraints from the design doc

- Fully local & private; network access happens ONLY on an explicit user command — never in the background, on a schedule, at app startup, or as telemetry/analytics/phone-home. The authorized triggers are metadata refresh, add, `/scout`, and Reception collection. Secrets go in the OS keychain, never in files. (Deliberate split: the **desktop app** reads/writes the GitHub PAT via the OS keychain — `commands.rs`, `keyring`, service "LibrAIum". The **curator-side CLI scripts and the MCP server** read the token from `GITHUB_TOKEN`/`GH_TOKEN`, sourced from `gh` via the documented `export GITHUB_TOKEN=$(gh auth token)`. An env var is not a file, so both honor the "never in files" rule; neither ever logs or writes the token.)
- **Reception collection** (on-demand, explicit-command only): synthesizes THIRD-PARTY reception signal for an existing entry — recurring complaints from high-reaction GitHub issues, notable adopters, known limitations, what people migrate to/from, maturity/maintenance signal — and writes it into the entry Markdown (a git-versioned `## Reception` section) so the library stays offline-readable; it never fetches on read and never runs unattended. Outbound requests carry only the queried repo's public identifiers (owner/repo, topical query terms) — never the library's contents, other entries, notes, or usage. Reception supersedes the firsthand `## Personal Notes` model as the default (the owner is a curator, not a hands-on user of most entries); `## Personal Notes` remains only for the few entries the owner has genuinely used. Reception text is untrusted third-party content and must render through `lib/markdown.js` like any other entry body.
- Unimplemented future phases (do not build unprompted): X auto-collection, semantic search/embeddings, project bootstrap generation. (Reception collection is NOT X auto-collection: it is on-demand rather than scheduled, sourced from GitHub/web rather than the X API, and enriches existing entries rather than discovering new candidates.)
