---
name: "source-command-reception"
description: "Gather third-party Reception signal for entries and draft each"
---

# source-command-reception

Use this skill when the user asks to run the migrated source command `reception`.

## Command Template

Draft each entry's `## Reception` — synthesized **third-party** signal (what the community reports: complaints, adopters, limitations, migration, maturity), **not** the owner's firsthand experience. This replaces the retired `/confirm-notes`: the owner is a curator, not a hands-on user of most entries, so there is no firsthand experience to confirm — honesty comes from sourcing every claim. One run covers ~3 entries.

**Converse in Japanese** (per AGENTS.md); keep the entry files themselves in English.

## 1. Pick the next batch

Read `.Codex/reception-review.md`. Take the first **3 unchecked** (`- [ ]`) entries in file order. If none remain, tell the owner every entry has Reception and stop.

Show current coverage — `node scripts/curation-report.mjs` prints it in the reception line, or count the boxes directly. Batch is **3, not 5**: each entry costs several `gh` calls and `gh search` has a ~30/min budget.

## 2. Gather evidence (this replaces the interview)

First `export GITHUB_TOKEN=$(gh auth token)` (clears the anonymous rate limit). Then run the read-only dossier for the batch:

```bash
node scripts/reception-scan.mjs --json --only <entry-id>      # once per entry
```

It gathers — GitHub-only and writing nothing — the most-reacted issues (complaints/limitations), release cadence + open-issue count (maturity), and README adopter links. Read each dossier as your source material.

**General web is an explicit opt-in.** If a dossier is thin (few issues, no adopters), you MAY WebSearch for migration/positioning signal ("migrated from X to Y", "X vs Y", "<repo> in production") — but **announce it first**, since it reaches beyond GitHub. Never invent signal; where evidence is thin, write "limited public signal" rather than fabricate.

## 3. Draft in house style

Follow the `entry-authoring` skill's **"Reception voice"**. For each entry, write the `## Reception` section:

- 2–5 attributive bullets, third-person, **every claim carrying its source** — an issue #/URL, a release date, a named adopter + link. Never first person ("I", "we"), never fabricated experience, never a README/marketing paraphrase.
- Open the section with the provenance comment stamping today's date:
  `<!-- Third-party reception, not the owner's firsthand experience. Synthesized from public GitHub issues/releases and adopter mentions; each claim carries its source. Last gathered: YYYY-MM-DD. -->`
- Cross-link related library entries as Markdown links where relevant.
- **Firsthand seeds** (qdrant, llama_index, langgraph, modelcontextprotocol/servers, swarm, casey/just, sveltejs/kit): ADD `## Reception` **above** the existing `## Personal Notes` — keep both. **Doc-derived entries**: REPLACE the old doc-derived `## Personal Notes` with `## Reception`.

Then validate:

```bash
node scripts/validate-data.mjs --data-dir data
```

## 4. Tick and report

- In `.Codex/reception-review.md`, change `- [ ]` to `- [x]` for **exactly** the entries you drafted this run.
- Show `git diff` of the touched entry files and the checklist. **Do not commit** — the owner reviews first.
- Report the new coverage (e.g. "3/43 gathered") so momentum is visible, and name the next 3 entries so the following run is obvious.
