---
description: Interview the owner to convert AI-drafted Personal Notes into firsthand ones, tracked in .claude/notes-review.md
---

Turn doc-derived Personal Notes into the owner's real, firsthand notes — the single highest-value content debt in the library. One run covers ~5 entries.

**Converse in Japanese** (per CLAUDE.md); keep the entry files themselves in English.

## 1. Pick the next batch

Read `.claude/notes-review.md`. Take the first **5 unchecked** (`- [ ]`) entries in file order. If none remain, tell the user every entry is confirmed and stop.

Show current progress (checked / total) — `node scripts/curation-report.mjs` prints it in the notes-review line, or count the boxes directly.

## 2. Interview, one entry at a time

For each entry in the batch:

1. Show its current `## Personal Notes` bullets and its one-line summary.
2. Ask the owner, in Japanese, the questions that separate firsthand knowledge from the docs:
   - 「これ実際に使ったことある?」(have you actually used it?)
   - 「どのビュレットが実体験と違う? 盛ってるところは?」(which bullets are wrong or overstated?)
   - 「ドキュメントに載ってない、自分がハマったところ・見つけたコツは?」(gotchas/tips the docs don't mention?)
   - 「これと組み合わせて使ってるライブラリ内の別エントリは?」(pairings with other library entries?)
3. If the owner has **no** firsthand experience with it, leave the notes as-is (they are honest doc-derived guidance) and say so — do **not** tick the box. Only confirmed entries get ticked.

## 3. Rewrite in house style

Follow the `entry-authoring` skill's Personal Notes voice. Apply the owner's answers:

- Replace or add bullets with what they actually told you — specific, firsthand.
- Keep accurate doc-derived warnings, but never phrase them as fabricated personal history.
- Delete anything the owner flagged as wrong or overstated.
- Cross-link related library entries as Markdown links where the owner names a pairing.

Then:

```bash
node scripts/validate-data.mjs --data-dir data
```

## 4. Tick and report

- In `.claude/notes-review.md`, change `- [ ]` to `- [x]` for **exactly** the entries the owner confirmed this run (never for skipped ones).
- Show `git diff` of the touched entry files and the checklist. **Do not commit** — the owner reviews first.
- Report the new progress count (e.g. "12/36 confirmed") so momentum is visible, and name the next 5 entries so the following run is obvious.
