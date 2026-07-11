---
name: entry-authoring
description: Use when writing or editing LibrAIum data entries (data/entries/**/*.md) — house style for summaries, Reception, Personal Notes, tags, and metadata
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
| `reception_gathered` | optional | `YYYY-MM-DD` the `## Reception` section was last synthesized. Stamped by `/reception`; drives freshness (an entry is `reception_stale` after 180 days) |
| `superseded_by` | optional | Flow list of `owner/repo` full_names this entry has been superseded by, e.g. `superseded_by: [langchain-ai/langgraph]`. Store it on the stale/old entry, pointing FORWARD; the inverse (`supersedes`) is derived at read time, never stored. A target need not be shelved yet. **Omit entirely when empty** (never `[]`) |
| `pairs_with` | optional | Flow list of `owner/repo` full_names this entry pairs well with (symmetric affinity). Store on ONE side only — it is unioned at read time with entries that point back. **Omit entirely when empty** |

Dates are plain unquoted scalars (`2026-07-08`). Omit optional fields entirely rather than writing `null` or empty strings. `superseded_by`/`pairs_with` are the last two fields, appended after `reception_gathered`, and power the `get_related` MCP tool (a stale entry's authored successor ranks above the tag heuristic in `get_repo_details` alternatives).

## Body layout

```
# <repo-short-name>

<summary — at most 2 sentences>

## Setup            (optional)

```bash
<2-4 verified install/run commands>
```

- <optional step note>

## Reception

<!-- Third-party reception, not the owner's firsthand experience. Last gathered: YYYY-MM-DD. -->

- <attributive bullet — "Issues frequently cite…", with a source link>
- <attributive bullet — "Adopters include…", with a source link>

## Personal Notes            (optional — firsthand only)

- <firsthand bullet, only where you have genuinely used the tool>
```

The heading is the repo's short name only (`# qdrant`, `# kit`, `# just`) — not `owner/repo`.

## Setup section (optional)

An optional `## Setup` between the summary and Reception: 2-4 **verified** install/run commands (a fenced ```bash block) plus optional step bullets — the real first-hour path. The MCP server's `adoptionSteps` reads it, so a suggestion returns `docker run -p 6333:6333 qdrant/qdrant` instead of the generic "git clone … read the README". Rules: commands must come from the repo's README/docs at research time — **never invent flags, ports, or package names**. Keep it minimal (the happy path, not every install method); omit the section entirely rather than guess.

## Summary rules

- **At most 2 sentences.** The first line doubles as the search-result blurb (the MCP server returns the body's first non-heading line), so it must stand alone.
- Say what the thing *is* and the one trait that earned it a shelf spot. Em-dash asides fit the voice: "A command runner — like make, but without the build-system baggage."
- Concrete over promotional. "gRPC + REST APIs, runs great locally via Docker" — yes. "Blazingly fast, feature-rich, production-ready" — never. If a sentence could appear in the repo's own marketing, cut it.

## Reception voice

`## Reception` is the library's primary content layer: synthesized **third-party** signal about how a repo is received in the wild — *not* the owner's firsthand experience. The owner is a curator who hasn't personally used most entries, so honesty comes from **attribution**, not from confirmed personal history. 2–5 bullets, each a single claim carrying its source:

- **Third-person, attributive, evidential.** Every claim names its source class: "Issues frequently cite…", "The most-upvoted open issue…", "Adopters include…", "Maintainers acknowledge…", "Teams commonly migrate to…". **Never first person** (no "I", "my", "we", "in my experience") — that fabricated-firsthand voice is exactly what this layer replaces.
- **What belongs (each bullet = one claim + its source):** a recurring complaint from high-reaction issues (link the issue); a maintainer-acknowledged or frequently-hit limitation; **named** adopters (a real org/project with a link — never "many companies"); migration signal (what people move to/from, and why — cross-link other library entries as Markdown links); maturity/maintenance signal (release cadence, issue responsiveness, "in maintenance mode").
- **What doesn't:** firsthand claims or invented experience, README/marketing paraphrase ("blazingly fast"), unsourced vibes ("people say it's buggy" — attribute it or cut it), values already in the frontmatter (stars/language/push date), speculation stated as fact.
- **Sourcing rule.** Each bullet carries an attribution phrase plus a Markdown link to the concrete artifact when one exists — prefer linking the single highest-reaction issue over "many issues". Where public evidence is thin, write "limited public signal" rather than fabricate.
- **Provenance.** Open the section with an HTML comment stamping the gather date, so staleness stays visible:
  `<!-- Third-party reception, not the owner's firsthand experience. Synthesized from public GitHub issues/releases and adopter mentions; each claim carries its source. Last gathered: YYYY-MM-DD. -->`
- Populate it with the `/reception` command (GitHub-first: high-reaction issues, releases, adopters; general-web signal is an explicit per-run opt-in) — never by guessing.

## Personal Notes voice (optional — firsthand only)

`## Personal Notes` is now **optional** and reserved for the rare entry the owner has **genuinely used** (the reference-corpus seeds). For everything else, use `## Reception` instead — **never draft doc-derived Personal Notes**, since laundering documentation into fake personal history is the exact dishonesty `## Reception` exists to replace. Where it does apply, it's what the owner knows firsthand that the README doesn't say. 2–4 bullets, each carrying real signal:

- **Firsthand and specific.** "My default vector DB for RAG prototypes — single `docker run` and you're up." "Adopted in every new repo: a `justfile` beats a README full of copy-paste commands."
- **When to use it** and, just as valuable, when *not* to: "Gets heavy fast — for small projects consider hand-rolling retrieval against qdrant directly."
- **Gotchas** with numbers or names, not vibes: "Watch memory usage with large collections; enable on-disk payload storage beyond ~1M vectors." "Keep graphs shallow — deep conditional graphs get hard to debug; prefer subgraphs."
- **Pairings and succession, linked to the library.** Reference related entries as Markdown links in the prose (the "why": "Pairs well with [run-llama/llama_index](https://github.com/run-llama/llama_index) for ingestion"; "Superseded in practice; use langgraph…"), AND record the edge as a structured frontmatter field (`pairs_with` / `superseded_by`) so `get_related` can traverse it and the successor outranks the tag heuristic. Keep both — the prose carries the reasoning a bare full_name can't; only encode a relationship the source genuinely supports (never fabricate a succession).
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

## Category lifecycle

Keep the shelf list small and deep, not broad and thin (`docs/content-strategy.md`: "a mile deep in the genres you actually consult" beats "an inch deep across 18 genres").

- **Add a category only for a space you'll genuinely track** — realistically ≥3 entries. A lone repo in a space you don't otherwise curate belongs as a well-tagged entry on the nearest existing shelf, not in a category of one.
- **Don't invent a category to fit one repo.** Reaching for a new shelf to hold a single entry is a signal the repo either fits an existing shelf (tag the difference) or doesn't clear the "does this tell an agent something it doesn't already know cold?" bar.
- **ids are permanent.** A category `id` is the entry directory name; renaming it orphans the directory (the GUI locks persisted ids for this reason). Pick the id once, kebab-case, and live with it — change the display `name` freely, never the `id`.
- **Thin shelves** (<3 entries, surfaced by `scripts/curation-report.mjs` and the `library-auditor` agent) are a prompt to either deepen (`/scout` → `/add-entry`) or fold their entries into a broader adjacent shelf — not to leave as permanent one-offs.
- Category master is `data/master/categories.yaml` (GUI-managed). Never leave a category id with no backing entry directory, or an entry directory with no category id — `validate-data` catches the mismatch.

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

Why it's good: two-sentence summary with a concrete deployment fact; notes state a default choice, a comparative judgment (vs FAISS), a cross-link to another library entry, and a numeric gotcha; 4 reused tags mixing concept (`vector-db`, `rag`, `similarity-search`) and tech (`rust`); every frontmatter value came from the GitHub API. `qdrant` is one of the reference-corpus seeds the owner has genuinely used, which is why its `## Personal Notes` is firsthand and appropriate — most entries carry a `## Reception` section instead.

### Reception example

`## Reception` for a repo the owner has *not* used firsthand (drafted by `/reception`, every claim sourced, no first person):

```markdown
## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- Concurrency and queuing is the most recurring complaint on the tracker — high-reaction
  issues repeatedly ask for parallel request handling, addressed in part by the
  `OLLAMA_NUM_PARALLEL` / `OLLAMA_MAX_LOADED_MODELS` env vars.
- Adopters / integrations include Open WebUI, Continue, and LangChain's `ChatOllama`,
  which cite it as the default local-model backend.
- Teams commonly reach for it as the local-first alternative to hosted OpenAI-style APIs.
- Maintenance signal is strong: frequent tagged releases and an active tracker; the sharp
  edge users hit is GPU/VRAM sizing for larger models (limited public benchmarking).
```

Every bullet names who is saying it (issues, adopters, teams, release cadence) and links the concrete artifact where one exists; none claims firsthand use, none restates marketing.

## After writing

Always validate before considering the entry done:

```bash
node scripts/validate-data.mjs --data-dir data
```
