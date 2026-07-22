# LibrAIum as a read-mostly MCP KnowledgeProvider

LibrAIum is the **LIBRARY** in the NEL platform: a curated catalogue of external repositories,
one entry per repo (`data/entries/<category>/<owner-repo>.md`, YAML frontmatter + Markdown). It
exposes that catalogue to platform runtimes over MCP as a **read-mostly KnowledgeProvider**. This
document states the four guarantees the provider makes so they are explicit and testable
(`mcp-server/test/knowledge-provider.test.mjs`), not merely emergent.

LibrAIum is self-contained: it depends on no other platform repository. The guarantees below are
LibrAIum's own contract; the platform side mirrors them independently in the kernel's MCP registry
(`nel-os/registry/mcp-servers.yaml`: `access: read-only`, `blocked_tools: [add_repo]`), which
LibrAIum does **not** import.

## 1. Read-mostly — the query surface is the seven read tools

The KnowledgeProvider surface is exactly the read-only MCP tools registered in
`mcp-server/index.js`:

| Tool | Purpose |
|---|---|
| `search_repos` | keyword/tag/category search over the catalogue |
| `get_repo_details` | one entry's metadata + body sections |
| `suggest_for_new_project` | rank entries for a described project |
| `get_library_overview` | catalogue-wide summary |
| `compare_repos` | side-by-side comparison |
| `get_related` | alternatives / pairs-with for an entry |
| `find_by_reception` | entries by third-party reception signal |

`add_repo` is the **sole mutating tool** and is deliberately **out of the KnowledgeProvider
surface** — it is a curator-only path (it writes a new entry file and performs an authenticated
GitHub fetch). A KnowledgeProvider consumer uses only the seven read tools; the kernel registry
blocks `add_repo` for platform runtimes. The read-tool libraries (`mcp-server/lib/{search,
suggest, overview, compare, related, reception}.js`) are structurally write-free — they compute
over already-loaded in-memory data and perform no filesystem writes.

## 2. No data copy — consumers query live, never import the store

Reads run **live off the store on every call** (`listEntries(DATA_DIR)` / `loadCategories(DATA_DIR)`
per invocation; no cache, no in-memory duplication that outlives a call). The kernel registry
points the server at LibrAIum's own `data/` via `LIBRAIUM_DATA_DIR`; consumers never read
LibrAIum's on-disk store directly and never persist a copy of the catalogue into the platform.
The library remains the single source of truth for its own data.

## 3. Fallback policy — the provider degrades, it does not crash

A KnowledgeProvider consumer must survive LibrAIum being unavailable or partially readable:

- A **missing** library (`data/` absent) returns an **empty** result set, not an error
  (`listEntries` → `[]`, `loadCategories` → `[]`).
- An **unreadable entry file or category directory** is skipped with a warning; the rest of the
  library is still served (`scan_entries` / `listEntries` warning-skip). The library never
  silently shrinks *without* a warning, but it never dies over one bad file either.
- A **malformed category master** fails **closed** (an actionable error naming the file) rather
  than silently serving zero categories — a data-integrity signal, not a crash of unrelated reads.
- Every read tool tolerates an empty catalogue without throwing.

Consumers should treat an empty/degraded response as "the library has nothing to offer right now"
and continue — the platform workflow survives LibrAIum being down.

## 4. Distinct from twin memory

LibrAIum (LIBRARY) is **not** the nel-twin (BRAIN). The twin holds identity, decisions, and
private memory; LibrAIum holds a curated catalogue of **external** repositories and **no**
customer, revenue, business, or twin-memory state. The two are separate repositories with separate
stores. The KnowledgeProvider surface must stay free of any coupling to the kernel or the twin:
`mcp-server/` references no `nel-os` / `nel-twin` / `nel-contracts` symbol and takes no such
dependency (guarded by `knowledge-provider.test.mjs`). A consumer that needs identity/memory uses
the twin; a consumer that needs a vetted external repo uses LibrAIum.
