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

3. **Demo-stale seed note.** `ai-agent/openai-swarm` is seeded stale to showcase the GUI's stale badge and alternative suggestions. The test suite does NOT depend on it (stale scenarios run on the checked-in fixture in `mcp-server/test/fixtures/stale-lib/`), so writing the flip is safe — just tell the user the GUI showcase loses its stale example until some entry goes stale for real.

4. **Apply** only what the user approves:

   ```bash
   node scripts/refresh-metadata.mjs $ARGUMENTS --write
   ```

   The script re-runs validate-data itself. Show `git diff --stat data/` — only scalar frontmatter lines may change (flow-style `tags: [...]` lines must be untouched). Leave the commit to the user unless they ask.
