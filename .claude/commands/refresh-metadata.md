---
description: Refresh entries' GitHub metadata (stars, push date, status) headlessly and review the delta digest
argument-hint: "[--category <id> | --only <entry-id>]"
---

Refresh the library's GitHub metadata for: **$ARGUMENTS** (empty = the whole library).

1. **Token first** — 43+ API calls must not run anonymously (60 req/h limit):

   ```bash
   export GITHUB_TOKEN=$(gh auth token)
   ```

2. **Dry-run and review** (never start with `--write`):

   ```bash
   node scripts/refresh-metadata.mjs $ARGUMENTS
   ```

   Walk the user through the digest: star drift, `STATUS` transitions (`active -> stale` = candidate for succession via suggest alternatives), upstream **renames** (manual: follow the rename rules in `/add-entry` — the file must move because slug = slugify(full_name)), and fetch errors.

3. **Known trap — the demo-stale seed.** `ai-agent/openai-swarm` is deliberately stale: the MCP smoke test's status-filter scenario and the GUI's alternative-suggestion demo rely on a stale entry existing. If the digest shows it flipping to `active`, do NOT write it wholesale — either exclude it (`--category`/`--only` around it) or, if the user wants the flip, update the smoke test's stale-seed scenario in the same commit and run verify-all.

4. **Apply** only what the user approves:

   ```bash
   node scripts/refresh-metadata.mjs $ARGUMENTS --write
   ```

   The script re-runs validate-data itself. Show `git diff --stat data/` — only scalar frontmatter lines may change (flow-style `tags: [...]` lines must be untouched). Leave the commit to the user unless they ask.
