# Utilization Backlog

PDCA loop state for `/utilize` — one iteration = one deliverable, proven useful (acceptance check exercised), verified (verify-all green), committed.
Seeded 2026-07-09 from a 6-persona ideation workflow (new-project dev, maintainer/curator, Claude integration, batch automation, publisher, decision support): 30 proposals → 16 items after dedup/constraint checks.

Hard constraints (see `/utilize`): no X auto-collection, no embeddings/semantic search, no project bootstrap generation; GitHub API only inside explicitly user-invoked actions; no new runtime deps; dual-implementation parity rules apply to any data-format change.

## Pending  (ordered: highest value per effort first)

### [ ] P2 — Stale-alternatives parity over MCP (auto-attached to get_repo_details)
- **Deliverable**: alternativesFor in `mcp-server/lib/suggest.js`, get_repo_details wiring, tests + smoke assertion.
- **Why**: the GUI answers "what replaces this stale repo?" but the MCP consumer dead-ends at status: stale.
- **Acceptance**: get_repo_details("openai/swarm") returns alternatives containing langchain-ai/langgraph with shared tags as the reason; an active entry's response has no alternatives field.
- **Build notes**: port search.rs suggest_alternatives verbatim (same category + active + different id; score = sharedTags*1000 + min(stars,999); require ≥1000; top 3), cross-reference comments on BOTH sides (logic parity, not data-format parity — no conformance fixture; add a search.rs comment pointing at the JS twin).

### [ ] P2 — register-mcp.mjs — one-command user-scope registration + --doctor
- **Deliverable**: `scripts/register-mcp.mjs` + README "MCP server" section rewritten; `--with-skill` installs libraium-first.
- **Why**: the library only pays off in OTHER repos if the server is registered user-scope with correct absolute paths; today that's a hand-adjusted snippet with no diagnosis path.
- **Acceptance**: `--yes` then `--doctor` ends with the resolved data dir + live entry count printed, and `claude mcp list` shows libraium at user scope.
- **Build notes**: absolute paths from import.meta.url; check node/claude on PATH; print exact `claude mcp add --scope user libraium -- node <abs>/mcp-server/index.js --data-dir <abs>/data` and execute only with --yes (touches user-level config — show-then-confirm per allowlist-review rule); idempotent via remove-first. --doctor: stdio handshake + one search_repos call (reuse smoke-test client pattern), print resolved data dir + entry count. --with-skill copies integrations/claude/skills/libraium-first/ into ~/.claude/skills/ behind --yes.

### [ ] P2 — search_repos v2 — richer filters + self-diagnosing empty results
- **Deliverable**: `mcp-server/index.js` search_repos handler + per-parameter test coverage.
- **Why**: AND-everything substring search is the most common dead end for LLM callers.
- **Acceptance**: tags:["vectordb"] returns count 0 plus a note naming "vector-db"; any_tags:["rag","mcp-server"] with sort:"freshness" returns the union ordered by last_github_push.
- **Build notes**: (1) filters: language (exact, case-insensitive), any_tags (OR; existing tags stays AND), updated_within_days, sort stars|freshness|added, '-token' negation in query. (2) zero-result diagnostics: per-token match report, retry suggestion with rarest tokens, valid category ids, closest real tags by prefix/substring/edit-distance ≤2. Update tool description.

### [ ] P2 — curation-report.mjs — deterministic health report feeding /curate-review
- **Deliverable**: `scripts/curation-report.mjs` (+ --json), fixture test, curate-review.md step 2 rewired.
- **Why**: every /curate-review session re-invents five ad-hoc greps.
- **Acceptance**: the report prints all sections offline in seconds — openai/swarm listed as stale-but-covered — and --json parses with the fields curate-review consumes.
- **Build notes**: sections: last_checked age buckets; status/source counts; thin shelves (<3); singleton tags + near-synonym pairs (edit-distance ≤2 / substring); stale/archived without an active shared-tag alternative (covered vs uncovered); notes-confirmation progress from .claude/notes-review.md when present. Fixture library under tests/.

### [ ] P3 — rename-tag.mjs — atomic tag rename across the library
- **Deliverable**: `scripts/rename-tag.mjs` + curate-review.md check (c) references it.
- **Why**: tag drift fixes must touch every affected entry consistently; today that's N hand-edits.
- **Acceptance**: renaming a shared tag updates every occurrence in one run, leaves each `tags: [...]` line byte-identical except the renamed tag, validate-data passes.
- **Build notes**: `<old> <new> [--merge] [--dry-run]`; targeted regex rewrite of ONLY the tags line (no serializeEntry round-trip — flow style must survive); refuse no-op/invalid charset; --merge dedupes when new already exists; run validate-data at the end.

### [ ] P3 — /confirm-notes — burn down the unverified Personal Notes backlog
- **Deliverable**: `.claude/commands/confirm-notes.md` + seeded `.claude/notes-review.md` checklist.
- **Why**: most entries carry AI-drafted doc-derived notes; converting them to firsthand ones in 15-minute sessions is the highest-value content debt.
- **Acceptance**: one run interviews the owner over ~5 entries, rewrites notes per answers, ticks those checkboxes, reports progress (e.g. 12/36).
- **Build notes**: checklist = all entries minus the 7 reference-corpus seeds; lives outside data/ (no format change). Interview in Japanese; keep accurate doc-derived warnings marked as such; delete fabricated-sounding claims; validate; show diff; never commit.

### [ ] P3 — CATALOG.md auto-fresh catalog + living README stats block
- **Deliverable**: `scripts/build-catalog.mjs`, `CATALOG.md`, README marker block, verify-all drift stage, post-edit hook regeneration.
- **Why**: the public repo shows the machinery but not the curation.
- **Acceptance**: editing any entry fails verify-all's drift stage until regeneration; CATALOG.md + README stats then match the live library.
- **Build notes**: TOC + per-category sections (categories.yaml order, stars-sorted, status markers, deep links to raw entry files) + tag index. --readme rewrites only the marker-delimited region (counts, top languages, 5 newest by added_date). Hook: regenerate after data/ edits (outputs live outside data/ — no loop). verify-all: regenerate to temp + diff, fail on drift; bump STAGE_TOTAL.

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
