# LibrAIum 📚

**Your personal library of best-practice GitHub repositories — curated by you, grown with AI.**

LibrAIum（ライブラリアム）は、厳選した GitHub リポジトリをローカル Git リポジトリで管理し、MCP サーバー経由で Claude Code から直接活用できる個人専用デスクトップアプリです。

LibrAIum is a **local-first desktop app** for curating the best-practice public GitHub repositories you actually trust — across AI agents, web apps, games, DevOps, and any genre you define. Its differentiator: the library doubles as an **MCP server**, so Claude Code can search it, read each entry's Reception (real-world community signal — what issues complain about, who adopts it, known limitations), and recommend the right repos for your next project.

> "Suggest the 3 best repos from my library for a RAG agent combining a vector DB and knowledge management — with setup commands."

<!-- library-stats:start -->
**43 repositories** across **18 categories** — browse them all in [CATALOG.md](CATALOG.md).

- Top languages: Go (9), TypeScript (8), Python (7), C++ (6), Rust (5)
- Freshness: 1 stale, 0 archived
- Recently added: [dubinc/dub](CATALOG.md#affiliate), [YOURLS/YOURLS](CATALOG.md#affiliate), [langgenius/dify](CATALOG.md#ai-agents), [ollama/ollama](CATALOG.md#ai-agents), [ggml-org/whisper.cpp](CATALOG.md#audio--voice)
<!-- library-stats:end -->

## Features (v1.0)

- **Git-native storage** — one Markdown file per repo (`YAML frontmatter + body`) in a local git repository. Diff, merge, and back up your knowledge like code.
- **Reception** — every entry pairs structured metadata (stars, language, freshness) with synthesized third-party signal: what issues complain about, who adopts it, known limitations, and what people migrate to. Entries you've used firsthand also keep your own **Personal Notes**.
- **Desktop GUI** (Tauri v2 + Svelte 5) — dashboard, instant fuzzy search with filters, entry editing, category master management, and a Git panel (status / commit / push).
- **GitHub metadata refresh** — single or bulk refresh via the GitHub API; entries automatically flagged `stale` when a repo stops moving, with fresher alternatives suggested from your own shelves.
- **MCP server for Claude Code** — six tools: `search_repos`, `get_repo_details`, `suggest_for_new_project`, `compare_repos`, `get_library_overview`, `add_repo`.
- **Awesome-list export** — publish your curation as a standard awesome-list Markdown document.
- **Private by design** — your library data stays on your machine; the GitHub token lives in the OS keychain. Network access is explicit and on-demand only (metadata refresh, add, scouting, Reception collection), and outbound requests carry only public repo identifiers — no telemetry.

## Quick start

Prerequisites: [Rust](https://rustup.rs), Node.js ≥ 20, git. (macOS/Linux/Windows; on Linux install the [Tauri v2 system deps](https://v2.tauri.app/start/prerequisites/).)

```bash
npm install                 # frontend deps
npm run tauri dev           # launch the app (compiles Rust on first run)
```

Package a release build:

```bash
npm run tauri build
```

On first launch the app uses the repository's `data/` directory when present (dev mode), otherwise it bootstraps `~/LibrAIum/data` as a fresh git repository with the default category master. Point it anywhere via **Settings → Data directory**.

## The MCP server

Register LibrAIum with Claude Code (user scope — available in every repo):

```bash
(cd mcp-server && npm install)              # once
node scripts/register-mcp.mjs               # show the plan (executes nothing)
node scripts/register-mcp.mjs --yes --with-skill   # register + install the libraium-first skill
node scripts/register-mcp.mjs --doctor      # diagnose: registration, data dir, live entry count
```

The script bakes in absolute paths from its own location and is idempotent — re-run it after moving the checkout. Manual registration (project scope, env-var form) still works: `claude mcp add libraium -e LIBRAIUM_DATA_DIR="$PWD/data" -- node "$PWD/mcp-server/index.js"`.

| Tool | Purpose |
| --- | --- |
| `search_repos` | Filtered search: query, category, tags, min stars, status |
| `get_repo_details` | Full entry incl. your Personal Notes, by id / name / URL |
| `suggest_for_new_project` | Rank the library against a project description, with reasons, adoption steps + your Personal Notes |
| `compare_repos` | Side-by-side decision matrix (2-5 entries or a whole shelf) with notes + decision hints |
| `get_library_overview` | Shelf map: category ids + health counts, tag vocabulary with usage, resolved data dir |
| `add_repo` | Register a repo (fetches GitHub metadata; duplicate-safe) |

Every entry is also exposed as an MCP **resource** (`entry://<category>/<slug>`), so `@libraium` autocomplete in Claude Code pulls a full entry — frontmatter, summary, and your Personal Notes — into context with no tool call.

The server resolves its data directory from `--data-dir`, `$LIBRAIUM_DATA_DIR`, `./data`, the repo checkout, or `~/LibrAIum/data` — in that order.

### Use it from every project

Register the server at **user scope** and install the [libraium-first skill](integrations/claude/skills/libraium-first/SKILL.md), and Claude Code will consult your library before every dependency decision — in any repo on the machine, quoting your Personal Notes as evidence. One-page setup (including a paste-in `CLAUDE.md` block): [docs/library-first-setup.md](docs/library-first-setup.md).

## Data model

```
data/
├── entries/<category>/<owner-repo>.md    # one repo = one file
└── master/categories.yaml                # category master (GUI-editable)
```

```yaml
---
github_url: https://github.com/qdrant/qdrant
full_name: qdrant/qdrant
category: ai-agent
tags: [vector-db, rag, similarity-search, rust]
stars: 21400
language: Rust
last_github_push: 2026-07-05
last_checked: 2026-07-08
status: active        # active | stale | archived
source: manual        # manual | mcp | x-collection
added_date: 2026-06-20
---

# qdrant

High-performance vector database…

## Personal Notes
- My default vector DB for RAG prototypes…
```

## Development

```bash
npm install && (cd mcp-server && npm install)   # once, after cloning
bash scripts/verify-all.sh      # the full suite: data validation → cargo test →
                                # vite build + frontend unit tests → MCP unit+smoke
                                # tests → Rust⇔Node conformance → app binary build
                                # (CI runs this too)
```

Or piecewise — note that `npm run build` must come **before** the first
`cargo test` on a fresh clone (Tauri's `generate_context!` embeds `dist/`
at compile time; `verify-all.sh` reorders this automatically):

```bash
npm run build                   # frontend production build
npm test                        # frontend unit tests (markdown-renderer hardening)
cd src-tauri && cargo test      # Rust unit tests (data/git/search/github layers)
cd mcp-server && npm test       # store/suggest unit tests + MCP stdio smoke test
node scripts/refresh-metadata.mjs   # dry-run GitHub metadata refresh (--write to apply)
bash scripts/make-icons.sh      # regenerate app icons (macOS)
```

UI work is governed by [DESIGN.md](DESIGN.md) — the Flexoki paper-and-ink
design contract (tokens live in `src/styles.css`). For UI preview without
compiling the Rust backend, plain `npm run dev` in a browser auto-installs
a Tauri IPC mock (`src/lib/dev/mock.js`) with seeded sample data; the mock
is dev-only and never reaches production builds.

Architecture (see [LibrAIum_完全設計書_v1.0.md](LibrAIum_完全設計書_v1.0.md) for the full Japanese design document):

```
Tauri v2 desktop app
├── src/                  Svelte 5 GUI (dashboard, library, detail, categories, settings/git)
├── src-tauri/src/        Rust core
│   ├── store.rs            entry CRUD, frontmatter, dedup, awesome export
│   ├── categories.rs       category master
│   ├── search.rs           fuzzy search + filters, alternative suggestions
│   ├── github.rs           metadata refresh + stale detection
│   ├── gitops.rs           git status/commit/push (wraps the git CLI)
│   └── settings.rs         config + data-dir resolution + keychain-backed token
└── mcp-server/           Node stdio MCP server (mirrors the Rust data layer)
```

## Roadmap (v1.5+)

- X (Twitter) auto-collection pipeline with approval queue
- Semantic search over entries via local embeddings (ONNX)
- Project bootstrap generation from suggestions
- Richer multi-repo composition tools over MCP

## License

[MIT](LICENSE)
