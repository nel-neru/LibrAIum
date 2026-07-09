---
description: Research a GitHub repo and add a curated entry to data/entries with real metadata and honest notes
argument-hint: <github-url> [category]
---

Add a new curated entry to the LibrAIum library for: **$ARGUMENTS**

Follow this workflow in order. If the `entry-authoring` skill is available, load it — it is the authoritative house style; the essentials are repeated below.

## 1. Normalize the URL and check for duplicates

- Derive `owner/repo` from the input. Accepted URL shapes and normalization rules are implemented in `mcp-server/lib/store.js` (`normalizeGithubUrl`): strip protocol, trailing `/`, `.git`, and any `/tree/...` suffix. The canonical form stored in `github_url` is `https://github.com/<owner>/<repo>`.
- Check for an existing entry (duplicate detection compares lowercased `full_name`, so search case-insensitively):
  ```bash
  grep -ril "^full_name: owner/repo" data/entries/
  ```
  or reuse the real implementation:
  ```bash
  node -e 'import("./mcp-server/lib/store.js").then(s => console.log(s.findDuplicate("data", "owner/repo")))'
  ```
- If a duplicate exists, **stop**: show the user the existing entry and ask whether they want to update it instead.

## 2. Research the repo

- Fetch real metadata from the GitHub API — prefer `gh` when available, otherwise plain HTTPS:
  ```bash
  gh api repos/<owner>/<repo>        # or:
  curl -s https://api.github.com/repos/<owner>/<repo>
  ```
  Take `stargazers_count` → `stars`, `language` → `language`, `pushed_at` (date part, YYYY-MM-DD) → `last_github_push`, and `archived` (true ⇒ `status: archived`).
- **The response's `full_name` is authoritative** — a renamed repo 301-redirects and the API returns the NEW name. If it differs from what you derived in step 1: use it for `full_name`, rebuild `github_url` as `https://github.com/<full_name>`, and re-run the step-1 duplicate check under the new name (an entry may already be shelved there). This mirrors `guard_redirected_duplicate` in both code add paths.
- WebFetch the repository's README (`https://github.com/<owner>/<repo>`) to understand what it actually does, how mature it is, and what it pairs with. Look for gotchas in the docs (limits, platform caveats, migration notes).
- If the network is unavailable: ask the user for stars/language, or omit the optional fields — **never invent numbers or dates**.

## 3. Pick the category

- Read `data/master/categories.yaml` and choose the single best-fitting category `id` (kebab-case). The category is the *shelf* — the file will live at `data/entries/<category-id>/`. Cross-cutting facets belong in `tags`, not the category.
- If the user passed a category in $ARGUMENTS, use it — but verify the id exists in the master first.

## 4. Draft the entry

Write `data/entries/<category>/<slug>.md`, where `slug = slugify(full_name)` — lowercase, `/` and any character outside `[a-z0-9-_.]` become `-`, leading/trailing `-` trimmed (e.g. `Owner/Repo.js` → `owner-repo.js`).

House-style essentials:

- Frontmatter fields exactly as in `EntryMeta` (`src-tauri/src/models.rs`) — no invented keys. Set `last_checked` and `added_date` to today, `source: manual`, `status: active` unless GitHub reports the repo archived.
- Body starts with `# <repo-short-name>`, then a **summary of at most 2 sentences** — what it is and why it earns a shelf spot. No marketing copy.
- Optional `## Setup` section (after the summary): 2-4 real install/run commands captured from the README while you're already reading it — a fenced ```bash block. The MCP `adoptionSteps` surfaces these instead of a generic clone. Never invent flags/ports; omit the section rather than guess.
- `## Personal Notes` — 2–4 concrete, firsthand-style bullets: when to reach for it, gotchas discovered in the docs/issues, and pairings with existing library entries (as Markdown links). Honest about weaknesses. Never restate the README.
- Tags: 3–6, kebab-case, reuse-first — check what already exists with `grep -rh "^tags:" data/entries` and only mint a new tag when nothing fits. Mix technology tags (`rust`, `python`) with concept tags (`rag`, `task-runner`).

## 5. Validate and show the result

```bash
node scripts/validate-data.mjs --data-dir data
```

(`--data-dir data` pins validation to THIS repo's library — an exported `LIBRAIUM_DATA_DIR` would otherwise silently validate a different one.)

Fix anything it reports. Then show the user the new file as a diff (`git diff` / `git status` for the untracked file, plus the full file content) and ask them to confirm the Personal Notes match their actual experience — they are *their* notes, so invite edits. Do **not** commit; leave that to the user.
