---
name: "source-command-curate-review"
description: "Audit the library for rot — stale metadata, placeholder notes, tag drift — propose fixes and apply on approval"
---

# source-command-curate-review

Use this skill when the user asks to run the migrated source command `curate-review`.

## Command Template

Audit the LibrAIum library (`data/entries/`) for curation debt. This is a review of the *content*, not the code.

## 1. Baseline

Run the structural validator first — a broken file invalidates the rest of the audit:

```bash
node scripts/validate-data.mjs --data-dir data
```

Report and fix any structural failures before continuing.

## 2. Audit checks

Run the deterministic report first — it computes checks (a), (c) and (d) in one offline pass:

```bash
node scripts/curation-report.mjs          # human-readable; --json for scripting
```

Interpret its sections, don't just paste them:

**a) Freshness** — entries in the `30d+`/`90d+`/`missing` buckets have unrefreshed stars/push dates. Fix via `/refresh-metadata` (dry-run first) or `node scripts/refresh-metadata.mjs --only <entry-id> --write`.

**c) Tag taxonomy drift** — `singleton tags` are rename candidates ONLY when a `near-synonym candidates` pair names the same concept (`vector-db` ~ `vectordb`); genuinely new singletons are fine — judge each one, don't mass-delete. Apply approved renames atomically with `node scripts/rename-tag.mjs <old> <new> [--merge]` (dry-run first) — never by hand-editing N files.

**d) Succession** — `UNCOVERED` stale/archived entries are shelf holes: no active same-category entry shares a tag (the `suggest_alternatives` rule in `src-tauri/src/search.rs` / `alternativesFor` in `mcp-server/lib/suggest.js`). Research a replacement or add the succession note. Also flag stale entries whose notes don't name what superseded them.

Then do the one judgment-only check the report cannot compute:

**b) Placeholder Reception** — a `## Reception` section that is missing, empty, or contains only bare stubs (a lone `- ` bullet, "TODO", an unsourced claim, or a bullet that merely restates the summary/README). Reception — synthesized third-party signal with a source per claim — is the library's primary content layer; flag every entry whose Reception is absent or uncited. (Entries the owner has genuinely used may also keep a firsthand `## Personal Notes`; that is a bonus, never a substitute for Reception.)

## 3. Report

Present a severity-ordered table: entry id (`<category>/<slug>`), check, finding, and a **concrete** proposed fix (exact tag rename, exact note bullet to add, exact refresh command) — not "improve the notes".

## 4. Apply on approval

Ask the user which fixes to apply. For approved fixes:

- Edit the entry files directly (metadata refreshes must use real GitHub API data — never fabricate stars or dates; set `last_checked` to today only when you actually refreshed).
- Tag renames go through `node scripts/rename-tag.mjs <old> <new> [--merge]` so every carrier updates in one atomic run.
- Re-run `node scripts/validate-data.mjs --data-dir data` after edits and show the final `git diff`. Do not commit.

## 5. Record a health snapshot

After applying (or even if nothing needed fixing), record the current metrics so the trend accumulates over reviews:

```bash
node scripts/curation-report.mjs --snapshot   # append one dated line to data/master/health-log.jsonl
node scripts/curation-report.mjs --trend       # review the trend across snapshots
```

One snapshot per date (a same-day rerun replaces its line). The log answers "is the library's health improving?" — `thin_shelves`, `singleton_tags`, `near_synonyms`, and `succession_uncovered` trending **down** is the goal. Commit the health-log line with the review's fixes if you commit.
