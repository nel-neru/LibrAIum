# LibrAIum 📚

**Your personal library of best-practice GitHub repositories — curated by you, grown with AI.**

LibrAIum（ライブラリアム）は、厳選した GitHub リポジトリをローカル Git リポジトリで管理し、MCP サーバー経由で Claude Code から直接活用できる個人専用デスクトップアプリです。

LibrAIum is a **local-first desktop app** for curating the best-practice public GitHub repositories you actually trust — across AI agents, web apps, games, DevOps, and any genre you define. Its differentiator: the library doubles as an **MCP server**, so Claude Code can search it, read your firsthand Personal Notes, and recommend the right repos for your next project.

> "Suggest the 3 best repos from my library for a RAG agent combining a vector DB and knowledge management — with setup commands."

## Features (v1.0)

- **Git-native storage** — one Markdown file per repo (`YAML frontmatter + body`) in a local git repository. Diff, merge, and back up your knowledge like code.
- **Personal Notes** — every entry pairs structured metadata (stars, language, freshness) with your hands-on experience, gotchas, and pairings.
- **Desktop GUI** (Tauri v2 + Svelte 5) — dashboard, instant fuzzy search with filters, entry editing, category master management, and a Git panel (status / commit / push).
- **GitHub metadata refresh** — single or bulk refresh via the GitHub API; entries automatically flagged `stale` when a repo stops moving, with fresher alternatives suggested from your own shelves.
- **MCP server for Claude Code** — four tools: `search_repos`, `get_repo_details`, `suggest_for_new_project`, `add_repo`.
- **Awesome-list export** — publish your curation as a standard awesome-list Markdown document.
- **Private by design** — everything stays on your machine; the GitHub token lives in the OS keychain.

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

Register LibrAIum with Claude Code (adjust paths):

```bash
cd mcp-server && npm install    # once
claude mcp add libraium -e LIBRAIUM_DATA_DIR="$PWD/../data" -- node "$PWD/index.js"
```

| Tool | Purpose |
| --- | --- |
| `search_repos` | Filtered search: query, category, tags, min stars, status |
| `get_repo_details` | Full entry incl. your Personal Notes, by id / name / URL |
| `suggest_for_new_project` | Rank the library against a project description, with reasons + adoption steps |
| `add_repo` | Register a repo (fetches GitHub metadata; duplicate-safe) |

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
