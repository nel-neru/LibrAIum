---
name: entry-authoring
description: Use when writing or editing LibrAIum data entries (data/entries/**/*.md) — house style for summaries, Personal Notes, tags, and metadata
---

# LibrAIum entry authoring — house style

One repo = one file at `data/entries/<category-id>/<slug>.md`, where `slug = slugify(full_name)`: lowercase, `/` and any character outside `[a-z0-9-_.]` become `-`, leading/trailing `-` trimmed. `Owner/Repo.js` → `owner-repo.js`. The file is YAML frontmatter + Markdown body. The seven seeded entries in `data/entries/` are the reference corpus — when in doubt, imitate them.

## Frontmatter

Fields are exactly `EntryMeta` (`src-tauri/src/models.rs`). **Never invent keys** — the Rust parser and the MCP server both consume this schema. Keep the field order below (it matches the existing entries and the Rust struct):

| Field | Required | Semantics |
| --- | --- | --- |
| `github_url` | yes | Canonical form only: `https://github.com/<owner>/<repo>` — no `.git`, no trailing `/`, no `/tree/...` |
| `full_name` | yes | `owner/repo` exactly as GitHub reports it (case preserved). Duplicate detection compares this case-insensitively |
| `category` | yes | A category `id` from `data/master/categories.yaml` (kebab-case). Must match the directory the file lives in |
| `tags` | default `[]` | Flow style: `tags: [vector-db, rag, rust]` — see tag conventions below |
| `stars` | default `0` | Integer from the GitHub API (`stargazers_count`) at last check — never guessed, never "21.4k" |
| `language` | optional | GitHub's primary language with GitHub's capitalization (`Rust`, `Python`, `TypeScript`). Omit the key if unknown |
| `last_github_push` | optional | `YYYY-MM-DD` date part of the API's `pushed_at`. Omit if unknown |
| `last_checked` | optional | `YYYY-MM-DD` when metadata was last refreshed from the API. Set to today when you fetch real data |
| `status` | default `active` | Enum: `active` \| `stale` \| `archived`. Auto-managed by refresh (push older than the stale threshold ⇒ `stale`; GitHub `archived` ⇒ `archived`) — don't hand-set `stale` without reason |
| `source` | default `manual` | Enum: `manual` \| `mcp` \| `x-collection`. Hand-authored entries are `manual`; the MCP `add_repo` tool writes `mcp` |
| `added_date` | optional | `YYYY-MM-DD` the entry joined the library. Set once, never touched again |

Dates are plain unquoted scalars (`2026-07-08`). Omit optional fields entirely rather than writing `null` or empty strings.

## Body layout

```
# <repo-short-name>

<summary — at most 2 sentences>

## Personal Notes

- <bullet>
- <bullet>
```

The heading is the repo's short name only (`# qdrant`, `# kit`, `# just`) — not `owner/repo`.

## Summary rules

- **At most 2 sentences.** The first line doubles as the search-result blurb (the MCP server returns the body's first non-heading line), so it must stand alone.
- Say what the thing *is* and the one trait that earned it a shelf spot. Em-dash asides fit the voice: "A command runner — like make, but without the build-system baggage."
- Concrete over promotional. "gRPC + REST APIs, runs great locally via Docker" — yes. "Blazingly fast, feature-rich, production-ready" — never. If a sentence could appear in the repo's own marketing, cut it.

## Personal Notes voice

This section is LibrAIum's reason to exist — it's what the owner knows that the README doesn't say. 2–4 bullets, each carrying real signal:

- **Firsthand and specific.** "My default vector DB for RAG prototypes — single `docker run` and you're up." "Adopted in every new repo: a `justfile` beats a README full of copy-paste commands."
- **When to use it** and, just as valuable, when *not* to: "Gets heavy fast — for small projects consider hand-rolling retrieval against qdrant directly."
- **Gotchas** with numbers or names, not vibes: "Watch memory usage with large collections; enable on-disk payload storage beyond ~1M vectors." "Keep graphs shallow — deep conditional graphs get hard to debug; prefer subgraphs."
- **Pairings and succession, linked to the library.** Reference related entries as Markdown links: "Pairs well with [run-llama/llama_index](https://github.com/run-llama/llama_index) for ingestion." For stale/archived entries, name the replacement: "Superseded in practice; use langgraph or the provider-native agent SDKs for real work."
- **Honest about weaknesses.** An entry with only praise reads as untrustworthy; every mature tool has a sharp edge worth recording.
- Never marketing copy, never a README restatement, never a bare `- ` placeholder. When drafting for the user, derive bullets from docs/issues and phrase them as usage guidance — don't fabricate personal history ("I ran this in prod for a year"); leave a question for the user to confirm or edit instead.

## Tag conventions

- **kebab-case**, lowercase: `vector-db`, `agent-loop-reasoning`, `developer-experience`.
- **3–6 tags** (the corpus averages 4).
- **Reuse first.** List what exists before choosing: `grep -rh "^tags:" data/entries`. Never mint a near-synonym (`vectordb`, `vector-database`) when `vector-db` exists — single-use tags are taxonomy drift and get flagged by curation reviews.
- **Mix tech + concept.** One tag for the implementation/ecosystem language, lowercase (`rust`, `python`, `typescript`, `javascript` — distinct from the capitalized `language:` field), plus concept tags for what it does (`rag`, `multi-agent`, `task-runner`, `ssr`).
- Tags power search filters and alternative suggestions (same category + shared tag + active), so a stale entry with no tags in common with anything can never get a replacement suggested — tag with that graph in mind.

## Category vs tag

**Category = shelf, tags = facets.** An entry lives in exactly one category directory — the single place a librarian would shelve it, matching its *primary* use case. Everything else about it is a tag. `qdrant` is written in Rust and could serve web backends, but its shelf is `ai-agent` (that's why it's in the library); `rust` is a tag. If you're torn between two categories, pick the one answering "why did I save this?" and encode the loser as a tag. Never invent a category on the fly — categories come from `data/master/categories.yaml` (managed in the GUI; ids are locked once persisted because the id is the directory name).

## Complete good entry (verbatim from the corpus)

`data/entries/ai-agent/qdrant-qdrant.md`:

```markdown
---
github_url: https://github.com/qdrant/qdrant
full_name: qdrant/qdrant
category: ai-agent
tags: [vector-db, rag, similarity-search, rust]
stars: 21400
language: Rust
last_github_push: 2026-07-05
last_checked: 2026-07-08
status: active
source: manual
added_date: 2026-06-20
---

# qdrant

High-performance vector database and similarity search engine with filtering, written in Rust. gRPC + REST APIs, runs great locally via Docker.

## Personal Notes

- My default vector DB for RAG prototypes — single `docker run` and you're up.
- Payload filtering is the killer feature vs. plain FAISS; combine metadata filters with ANN search.
- Pairs well with [run-llama/llama_index](https://github.com/run-llama/llama_index) for ingestion.
- Watch memory usage with large collections; enable on-disk payload storage beyond ~1M vectors.
```

Why it's good: two-sentence summary with a concrete deployment fact; notes state a default choice, a comparative judgment (vs FAISS), a cross-link to another library entry, and a numeric gotcha; 4 reused tags mixing concept (`vector-db`, `rag`, `similarity-search`) and tech (`rust`); every frontmatter value came from the GitHub API.

## After writing

Always validate before considering the entry done:

```bash
node scripts/validate-data.mjs --data-dir data
```
