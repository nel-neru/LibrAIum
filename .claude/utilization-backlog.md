# Utilization Backlog

PDCA loop state for `/utilize` — one iteration = one deliverable, proven useful (acceptance check exercised), verified (verify-all green), committed.
Seeded 2026-07-09 from a 6-persona ideation workflow (new-project dev, maintainer/curator, Claude integration, batch automation, publisher, decision support): 30 proposals → 16 items after dedup/constraint checks.

Hard constraints (see `/utilize`): no X auto-collection, no embeddings/semantic search, no project bootstrap generation; GitHub API only inside explicitly user-invoked actions; no new runtime deps; dual-implementation parity rules apply to any data-format change.

## Pending  (ordered: highest value per effort first)

## Done

- [x] P2 refresh-metadata rewriter tests (data-safety) — 13386b7 (2026-07-09, iter 19). Proven: setScalar/rewriteEntry pinned (targeted scalars change, flow-style tags line byte-identical, idempotent, throws on no-frontmatter); CLI body guarded behind isMain so import is side-effect-free.
- [x] P2 bulk-add proposeCategory test + hyphenated-tag fix — 7774851 (2026-07-09, iter 18). Proven: 5 cases green; writing the test surfaced a real bug (raw hyphenated tags never matched the hyphen-split haystack) — fixed by tokenizing tags into the descriptor.
- [x] P4 /scout candidate sourcing — e1277d5 (2026-07-09, iter 17). Proven: audio-voice recipe returned a deduped shortlist (openai/whisper filtered as shelved; whisperX/FunASR/NeMo/vosk fresh with stars/push/license). Docs-only orchestration over gh search + findDuplicate.
- [x] P4 /bulk-add (URL list + --from-stars) — 48931af (2026-07-09, iter 16). Proven on a temp data copy: 3 URLs → 2 added + 1 dedup skip, validate green; --from-stars --user sharkdp → 56-row triage table, 4 shelved skipped, zero writes. Real library untouched.
- [x] P3 Entries as MCP resources (@-mention) — 93e2abb (2026-07-09, iter 15). Proven: resources/list = 43 named entries, resources/read returns raw file, traversal URI 404s. All P3 tier done.
- [x] P3 '## Setup' adoption steps — 5696d1b (2026-07-09, iter 14). Proven: qdrant how_to_adopt[0] is the real docker run; 8 flagship entries backfilled; Setup-wins/fallback-kept unit tests. Owner can add Setup to more entries via /add-entry or by hand.
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
