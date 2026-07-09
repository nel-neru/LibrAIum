---
description: Batch-shelve several repos at once — from a URL list or your GitHub stars — then draft honest notes for each
argument-hint: "<url>... | --from-stars [--user <name>]"
---

Batch intake into the library for: **$ARGUMENTS**

Network runs only inside this explicitly-invoked command. Export a token first so 10+ calls don't hit the anonymous 60/hr limit:

```bash
export GITHUB_TOKEN=$(gh auth token)
```

## Path A — a list of URLs

1. If the user gave URLs (optionally `url,category` per line, or a shared `--category`), run the intake:

   ```bash
   node scripts/bulk-add.mjs <url>... --category <id>
   # or:  node scripts/bulk-add.mjs --file targets.txt
   ```

   The script normalizes → dedupes → fetches metadata → writes a **skeleton** entry per new repo (placeholder `- ` note), skipping duplicates and continuing past failures, then runs validate-data. Read back its added/skipped/failed summary to the user.

## Path B — harvest from GitHub stars

1. Produce a triage table (writes nothing):

   ```bash
   node scripts/bulk-add.mjs --from-stars --min-stars 500 --pushed-within 365
   # --user <name> for someone else's public stars; --language <L> to narrow
   ```

   Each row is a ready `url,category` line with a lexically-proposed category. Review it **with the user** — fix `UNMATCHED` or wrong categories — then feed the approved lines into Path A (`--file` or `--stdin`).

## Draft real notes (both paths)

The skeletons carry a placeholder note that `/curate-review` would flag. For **each** new entry, follow the `entry-authoring` skill:

- Read the repo's README (WebFetch) and write a ≤2-sentence summary replacing the raw GitHub description.
- Add 2–5 attributive `## Reception` bullets — third-party signal (complaints, adopters, limitations, migration, maturity), every claim sourced; never fabricated firsthand experience. Cross-link related library entries. See the `entry-authoring` skill's "Reception voice".
- Add 3–6 kebab-case tags, reusing the existing vocabulary (`node scripts/curation-report.mjs` shows it) before minting new ones.
- Optionally add a `## Setup` section with verified install commands.

Then `node scripts/validate-data.mjs --data-dir data`, show `git diff`, and let the user review. **Do not commit** — they do.
