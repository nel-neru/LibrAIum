# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What LibrAIum Is

A local-first Tauri v2 + Svelte 5 desktop app for curating best-practice GitHub repositories, storing everything as YAML-frontmatter Markdown files in a local git repository, and exposing the library to Claude Code through an MCP server. The authoritative spec is `LibrAIum_完全設計書_v1.0.md` (Japanese). v1.0 MVP is fully implemented.

## Commands

```bash
npm run tauri dev                # run the desktop app (Rust compiles on first run)
npm run tauri build              # package release build
npm run build                    # frontend-only production build (vite)
cd src-tauri && cargo test       # Rust unit tests — all core logic lives here
cd src-tauri && cargo test store # run one module's tests (store/search/gitops/github/…)
cd mcp-server && npm test        # MCP stdio smoke test (spawns server, calls all 4 tools)
bash scripts/make-icons.sh       # regenerate icons from scripts/generate-icons.mjs (macOS)
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
- `search.rs` — SkimMatcherV2 fuzzy search + filters; `suggest_alternatives` (same category + shared tag + active)
- `github.rs` — metadata fetch (ureq) + stale logic: push older than `stale_days` ⇒ `stale`, GitHub `archived` ⇒ `archived`
- `gitops.rs` — wraps the **git CLI**, not libgit2 (deliberate deviation from the design doc: push inherits the user's credential helpers/SSH agent)
- `settings.rs` — settings.json in app config dir; data-dir resolution order: explicit setting > `LIBRAIUM_DATA_DIR` > `./data`|`../data` (dev) > `~/LibrAIum/data` (bootstrapped on first run); default categories embedded via `include_str!` from `data/master/categories.yaml`
- `commands.rs` — Tauri command layer; network/push commands are `async` + `spawn_blocking`; GitHub PAT lives in the OS keychain (`keyring` crate, service "LibrAIum")

Frontend (`src/`): Svelte 5 **runes** (no stores); shared state in `lib/state.svelte.js`; all IPC via `lib/api.js` wrappers. Command args are camelCase (Tauri converts to snake_case), but **struct fields inside payloads stay snake_case** (`min_stars`, `full_name`).

MCP server tools: `search_repos`, `get_repo_details`, `suggest_for_new_project` (lexical scoring in `lib/suggest.js`), `add_repo` (source: `mcp`). Data dir resolution mirrors the Rust order (plus `--data-dir` flag).

## Data Model

- One repo = one file: `data/entries/<category>/<owner-repo>.md` — frontmatter fields are exactly `EntryMeta` in `models.rs`; body is a summary + `## Personal Notes`
- Category master: `data/master/categories.yaml`; category `id`s are entry directory names — renaming an id orphans its directory (the GUI locks persisted ids for this reason)
- `status`: `active | stale | archived` (auto-managed by refresh); `source`: `manual | mcp | x-collection`
- The repo's `data/` ships seeded sample entries (incl. one deliberately stale entry, `openai/swarm`, used to demo stale detection/alternatives)

## Repo automation & AI infrastructure

- **`bash scripts/verify-all.sh`** is the single verification entry point (also run by CI): data validation → cargo test → vite build → MCP smoke → Rust⇔Node conformance. Run it before any commit; `/verify` wraps it.
- **`node scripts/validate-data.mjs`** — schema-validates every entry + the category master. A PostToolUse hook runs it automatically after any `data/` edit and feeds failures back for self-correction.
- **`node scripts/conformance.mjs`** — proves the Rust and Node data-format implementations agree, over `tests/fixtures/format/` (valid/ must parse identically, invalid/ must be rejected by BOTH), all real entries, and a function-level corpus (`functions.json`: `slugify` + `normalizeGithubUrl`, via `dump_entries --slugify/--normalize-url`). When you change the format or these functions: update both implementations, add a fixture/corpus case, keep this green (`/format-sync` walks through it).
- **Hooks** (`.claude/hooks/post-edit.mjs`): rustfmt on edited `.rs`; parity reminder when either half of the dual implementation is edited; data validation as above.
- **Commands**: `/verify`, `/add-entry <github-url>`, `/curate-review`, `/format-sync`. **Agents**: `entry-curator`, `conformance-auditor`, `libraium-reviewer`. **Skill**: `entry-authoring` (house style for entries — consult it before writing any `data/entries/**/*.md`).
- Known flake guard: the MCP smoke test uses a 30s handshake timeout because server boot can exceed 10s right after cargo/vite stages on a loaded machine.

## Constraints from the design doc

- Fully local & private; GitHub API only on explicit refresh/add. Secrets go in the OS keychain, never in files.
- Unimplemented future phases (do not build unprompted): X auto-collection, semantic search/embeddings, project bootstrap generation.
