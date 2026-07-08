# Utilization Backlog

PDCA loop state for `/utilize` — one iteration = one deliverable, proven useful (acceptance check exercised), verified (verify-all green), committed.
Seeded 2026-07-09 from a 6-persona ideation workflow (new-project dev, maintainer/curator, Claude integration, batch automation, publisher, decision support): 30 proposals → 16 items after dedup/constraint checks.

Hard constraints (see `/utilize`): no X auto-collection, no embeddings/semantic search, no project bootstrap generation; GitHub API only inside explicitly user-invoked actions; no new runtime deps; dual-implementation parity rules apply to any data-format change.

## Pending  (ordered: highest value per effort first)

### [ ] P3 — Owner-authored '## Setup' section drives real adoption steps
- **Deliverable**: entry-authoring SKILL.md + add-entry.md capture step, adoptionSteps preference in suggest.js, backfill ~8 flagship entries, tests.
- **Why**: how_to_adopt is boilerplate ("git clone…"), so first-hour friction survives every suggestion.
- **Acceptance**: suggest for a vector-DB project returns qdrant whose how_to_adopt begins with the real `docker run` from its Setup section.
- **Build notes**: optional `## Setup` body section (2-4 verified commands; freeform Markdown — no schema change, no parity). adoptionSteps: parse Setup bullets/fenced code; present → wins over clone/README fallback; keep tag-specific hints trailing. Backfill flagship entries in the same session.

### [ ] P3 — Expose entries as MCP resources for @-mentions
- **Deliverable**: `mcp-server/index.js` ResourceTemplate `entry://{category}/{slug}` + smoke assertions.
- **Why**: '@libraium' autocomplete pulls full entry Markdown into context with zero tool-call round trips.
- **Acceptance**: resources/list returns all entries with names "owner/repo — category"; resources/read of entry://ai-agent/qdrant-qdrant returns the exact on-disk Markdown.
- **Build notes**: list via listEntries → {uri, name, mimeType: text/markdown}; read resolves via the entry id (never joins URI segments into paths — keep the traversal guard story intact) and returns the raw file.

### [ ] P4 — /bulk-add — batch intake from a URL list or GitHub stars
- **Deliverable**: `scripts/bulk-add.mjs` + `.claude/commands/bulk-add.md`.
- **Why**: shelving 10-15 harvested URLs means running /add-entry N times.
- **Acceptance**: three URLs (one already shelved) → two added + one duplicate skip, validate-data green.
- **Build notes**: lines "url[,category]" from args/file/stdin; per URL: normalizeGithubUrl → findDuplicate → fetchGithubRepo → guardRedirectedDuplicate → computeStatus → saveNewEntry; continue past failures; summary table. --from-stars: `gh api user/starred --paginate` + filters (--min-stars/--language/--pushed-within), category proposal by lexical overlap with categories.yaml, triage table (no writes). Command drafts honest notes for accepted skeletons; never commits. Network only inside this user-invoked command.

### [ ] P4 — /scout — candidate sourcing for thin shelves and stale successions
- **Deliverable**: `.claude/commands/scout.md`.
- **Why**: 15 of 18 categories hold <3 entries; scouting without leaving Claude Code gives thin shelves succession plans.
- **Acceptance**: /scout audio-voice produces a deduped shortlist (stars, last push, license, why-it-fits, how-it-differs) ending with /add-entry offers; network only during the invocation.
- **Build notes**: derive 2-3 lexical queries from category name/description + dominant tags; `gh search repos` with star/recency floors, archived:false; dedupe via findDuplicate; succession mode seeds queries from a stale entry's tags.

## Done

- [x] P3 CATALOG.md + README stats, drift-checked — 2082460 (2026-07-09, iter 13). Proven: entry edit → --check exit 1; regen → exit 0; verify-all now 7 stages. Post-edit hook auto-regenerates. Output timestamp-free so drift is real, not calendar noise.
- [x] P3 /confirm-notes + seeded notes-review checklist — 634b49f (2026-07-09, iter 12). Proven: 36 AI-drafted entries enumerated (all on disk, 7 seeds excluded), curation-report reads 0/36, ticking advances the counter. Owner-facing action: run `/confirm-notes` to burn down the 36.
- [x] P3 rename-tag.mjs — 061873e (2026-07-09, iter 11). Proven: 3-entry atomic rename on a library copy with a diff of exactly the tags lines; dry-run on real data; --merge/guard-rail fixture tests.
- [x] P2 curation-report.mjs — 258aacb (2026-07-09, iter 10). Proven: real-library run in 0.23s, swarm stale-but-covered, surfaced the github ~ github-actions judgment pair; 5 fixture tests. P2 tier complete.
- [x] P2 search_repos v2 (filters + zero diagnostics) — 6cc4a6a (2026-07-09, iter 9). Proven: vectordb→0件+note names vector-db exactly (short-tag containment noise guarded); OR-tags union of 5 in non-increasing push order. Logic extracted to lib/search.js with 7 unit tests.
- [x] P2 register-mcp.mjs (+ --doctor, --with-skill) — 620bae1 (2026-07-09, iter 8). Proven live: registered user-scope (claude mcp list: Connected), skill installed to ~/.claude/skills, doctor reports data dir + 43 entries. The iter-2 "user action required" is hereby closed.
- [x] P2 Stale-alternatives on get_repo_details — 29f0200 (2026-07-09, iter 7). Proven: swarm (stale) auto-carried langgraph (3 shared tags) + llama_index on real data; fixture pins it deterministically; active entries carry no field.
- [x] P2 get_library_overview MCP tool — 02550c5 (2026-07-09, iter 6). Proven: 18 categories summing exactly to 43 entries; all 78 vocabulary tags verified filterable (exhaustive, not sampled). Helper landed in lib/overview.js (not store.js as drafted — keeps the parity-watched file server-logic-free).
- [x] P2 Stale smoke scenarios pinned to fixture library — 3e8be34 (2026-07-09, iter 5). Proven: flipped swarm active via the real refresh tool, full suite stayed green, restored. Suite now invariant under metadata refresh.
- [x] P1 compare_repos MCP tool — 1b36618 (2026-07-09, iter 4). Proven: swarm-vs-langgraph on real data returned the stale hint, 3 shared tags, and swarm's verbatim succession bullet in one call; 4 unit tests + 3 smoke scenarios (5 tools now).
- [x] P1 Headless metadata refresh with change digest — 4b52592 (2026-07-09, iter 3). Proven: 43-entry dry-run digest (36 deltas incl. swarm stale→active warning, just +8.5k stars) with zero writes; --write on qdrant updated scalars only, tags line byte-identical, validate green. Acceptance target switched from swarm to qdrant to preserve the demo-stale seed; follow-up filed (P2 smoke-test decoupling).
- [x] P1 libraium-first skill + library-first setup page — 9385016 (2026-07-09, iter 2). Proven: from a different cwd, the documented stdio invocation answered "a RAG pipeline" with shelved entries quoting caution bullets. User action still required once: run the registration one-liner + skill cp (documented in docs/library-first-setup.md).
- [x] P1 Personal Notes excerpts inline in suggest_for_new_project — 21b8323 (2026-07-09, iter 1). Proven: real-library suggest for "RAG agent with a vector DB" returns qdrant with its memory-caution bullet first; smoke test pins the field over stdio.
- [x] Loop scaffolding: `/utilize` command + this backlog — a3ed675 (2026-07-09)

## Rejected

- Release-watch report — refresh digest already answers "what moved"; per-release breaking-change classification is speculative regex at M effort. Revisit after a refresh cadence exists.
- Star-momentum report from git history — useless until refresh commits accumulate for a quarter.
- GitHub Pages site — heavier surface, zero owner-utilization gain over drift-checked CATALOG.md.
- /publish command — reduces to `git commit` once the catalog hook + drift stage exist.
- NEWS.md changelog — overlaps CATALOG.md + README recently-added block.
- find_replacements standalone tool — folded into stale-alternatives on get_repo_details.
- (7 further proposals merged into the items above — see ideation run wf_f9727942-176.)
