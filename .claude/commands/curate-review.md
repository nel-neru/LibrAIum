---
description: Audit the library for rot — stale metadata, placeholder notes, tag drift — propose fixes and apply on approval
---

Audit the LibrAIum library (`data/entries/`) for curation debt. This is a review of the *content*, not the code.

## 1. Baseline

Run the structural validator first — a broken file invalidates the rest of the audit:

```bash
node scripts/validate-data.mjs --data-dir data
```

Report and fix any structural failures before continuing.

## 2. Audit checks

Work through every entry (`data/entries/**/*.md`) and collect findings per check:

**a) Stale metadata refresh** — entries whose `last_checked` is more than 30 days before today, or missing entirely. These have unrefreshed stars/push dates; the GUI's bulk refresh (or `gh api repos/<full_name>`) fixes them.

```bash
grep -r "^last_checked:" data/entries
```

**b) Placeholder notes** — a `## Personal Notes` section that is missing, empty, or contains only bare stubs (a lone `- ` bullet, "TODO", or a bullet that merely restates the summary). Personal Notes are LibrAIum's whole value proposition — flag every entry where they carry no firsthand signal.

**c) Tag taxonomy drift** — tags that appear on exactly one entry across the whole library. Count them:

```bash
grep -rh "^tags: " data/entries | sed 's/^tags: \[//; s/\]$//' | tr ',' '\n' | sed 's/^ *//; s/ *$//' | sort | uniq -c | sort -n
```

A single-use tag is either a candidate for renaming to an existing tag (check near-synonyms: `vector-db` vs `vectordb`, `agents` vs `multi-agent`) or genuinely new and fine — judge each one, don't mass-delete.

**d) Stale entries without alternatives** — entries with `status: stale` or `status: archived` for which the library offers no replacement. The app's alternative-suggestion rule (`src-tauri/src/search.rs`, `suggest_alternatives`) is: same `category` + at least one shared tag + `status: active`. For each stale/archived entry, check whether any entry satisfies that rule; if none does, the shelf has a hole (e.g., the seeded `openai/swarm` is covered by `langchain-ai/langgraph` via shared `multi-agent`). Also flag stale entries whose notes don't mention what superseded them.

## 3. Report

Present a severity-ordered table: entry id (`<category>/<slug>`), check, finding, and a **concrete** proposed fix (exact tag rename, exact note bullet to add, exact refresh command) — not "improve the notes".

## 4. Apply on approval

Ask the user which fixes to apply. For approved fixes:

- Edit the entry files directly (metadata refreshes must use real GitHub API data — never fabricate stars or dates; set `last_checked` to today only when you actually refreshed).
- Tag renames must be applied consistently across every entry using the tag.
- Re-run `node scripts/validate-data.mjs --data-dir data` after edits and show the final `git diff`. Do not commit.
