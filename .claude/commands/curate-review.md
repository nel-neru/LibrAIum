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

Run the deterministic report first — it computes checks (a), (c) and (d) in one offline pass:

```bash
node scripts/curation-report.mjs          # human-readable; --json for scripting
```

Interpret its sections, don't just paste them:

**a) Freshness** — entries in the `30d+`/`90d+`/`missing` buckets have unrefreshed stars/push dates. Fix via `/refresh-metadata` (dry-run first) or `node scripts/refresh-metadata.mjs --only <entry-id> --write`.

**c) Tag taxonomy drift** — `singleton tags` are rename candidates ONLY when a `near-synonym candidates` pair names the same concept (`vector-db` ~ `vectordb`); genuinely new singletons are fine — judge each one, don't mass-delete.

**d) Succession** — `UNCOVERED` stale/archived entries are shelf holes: no active same-category entry shares a tag (the `suggest_alternatives` rule in `src-tauri/src/search.rs` / `alternativesFor` in `mcp-server/lib/suggest.js`). Research a replacement or add the succession note. Also flag stale entries whose notes don't name what superseded them.

Then do the one judgment-only check the report cannot compute:

**b) Placeholder notes** — a `## Personal Notes` section that is missing, empty, or contains only bare stubs (a lone `- ` bullet, "TODO", or a bullet that merely restates the summary). Personal Notes are LibrAIum's whole value proposition — flag every entry where they carry no firsthand signal.

## 3. Report

Present a severity-ordered table: entry id (`<category>/<slug>`), check, finding, and a **concrete** proposed fix (exact tag rename, exact note bullet to add, exact refresh command) — not "improve the notes".

## 4. Apply on approval

Ask the user which fixes to apply. For approved fixes:

- Edit the entry files directly (metadata refreshes must use real GitHub API data — never fabricate stars or dates; set `last_checked` to today only when you actually refreshed).
- Tag renames must be applied consistently across every entry using the tag.
- Re-run `node scripts/validate-data.mjs --data-dir data` after edits and show the final `git diff`. Do not commit.
