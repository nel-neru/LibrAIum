# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status: Design Phase — No Code Yet

This repository currently contains only the design document `LibrAIum_完全設計書_v1.0.md` (Japanese, v1.0, status: design complete). **No implementation exists yet.** That document is the authoritative specification — read it before making any implementation or architectural decision, and do not deviate from its decided stack or data model without the user's approval.

There are no build, lint, or test commands yet. When the project is scaffolded, add them to this file.

## What LibrAIum Is

LibrAIum ("Librarium" + AI) is a **local-first, personal desktop app for curating best-practice public GitHub repositories** across genres (web apps, games, AI agents, etc.). Its key differentiator: the app itself runs as an **MCP server**, so Claude Code can query the user's curated registry directly (e.g., "suggest the best repos for a RAG agent, with setup commands").

Core principles (non-negotiable in the design):
- **Fully local & private**: all data lives in a local Git repository; network access only for GitHub metadata refresh and X (Twitter) collection
- **Git-native**: every entry is a plain file, so diff/merge/history work naturally
- **AI-native**: MCP over stdio is a first-class interface, not an add-on

## Decided Tech Stack

- **Desktop GUI**: Tauri v2 (Rust) + Svelte 5
- **Data layer**: Rust — `serde_yaml` for parsing/validation, `git2-rs` for Git operations
- **MCP server**: stdio transport, local process (Rust or Node.js)
- **Future semantic search**: local embedding model via ONNX (no cloud)
- **Secrets** (X API key, GitHub PAT): OS keychain or encrypted storage — never in the data repo

## Architecture

```
LibrAIum Desktop App (Tauri v2 + Svelte 5)
├── GUI Layer          — search, editing, category master management, Git panel
├── Data Layer         — YAML frontmatter parse/validate
├── Git Layer          — git2-rs
├── MCP Server         — stdio, local process
└── Background Tasks   — GitHub metadata refresh, X auto-collection (v1.5+)
```

## Data Model (decided format)

- **One repo = one file**: `data/entries/<category>/<owner-repo>.md` — YAML frontmatter + Markdown body
- **Category master**: `data/master/categories.yaml` — user-editable via GUI (name, color, icon, description, sort order)
- **Future**: `data/embeddings/` for local vector search

Entry frontmatter schema:

```yaml
---
github_url: https://github.com/owner/repo
full_name: owner/repo
category: ai-agent
tags: [vector-db, rag, mcp-server, claude-code]
stars: 8750
language: Python
last_github_push: 2026-07-05
last_checked: 2026-07-08
status: active        # active | stale
source: manual        # manual | x-collection
added_date: 2026-06-20
---
```

The Markdown body holds a summary plus a `## Personal Notes` section (the user's hands-on experience, gotchas, repo combinations) — this pairing of structured metadata and rich personal knowledge is central to the product.

## MCP Tool Surface (MVP)

- `search_repos(query, category?, tags?, min_stars?, status?)`
- `get_repo_details(id_or_url)`
- `suggest_for_new_project(project_description, goals, max_results=5)` — the flagship tool: returns best-fit repos with reasoning and setup steps
- `add_repo(github_url, category, tags, personal_notes?)`

## Implementation Roadmap

1. **Phase 1**: Data layer + category master + basic GUI + Git operations
2. **Phase 2**: MCP server with the four MVP tools
3. **Phase 3**: GitHub metadata auto-refresh + stale detection + Git panel
4. **Phase 4**: X auto-collection pipeline + candidate review UI (candidates require user approval)
5. **Phase 5**: Semantic search + docs + OSS release (MIT)

Stale detection (Phase 3): when `last_github_push` is old, automatically set `status: stale` and suggest more active alternatives in the same category/tags.
