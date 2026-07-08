---
description: Run the full verification pipeline (scripts/verify-all.sh) and fix failures until every stage is green
---

Run LibrAIum's complete verification pipeline and iterate until it passes.

## How to run

```bash
export PATH="/opt/homebrew/bin:$PATH"   # cargo lives here (Homebrew Rust)
bash scripts/verify-all.sh
```

Run it from the repo root. If a stage fails: read the failure output, find the root cause in the source, fix it, and re-run the whole script. Repeat until all stages pass. Do not stop at the first green re-run of a single stage — the script must complete end-to-end.

## The six stages

1. **validate-data** — `node scripts/validate-data.mjs --data-dir data`. Lints every file under `data/entries/**/*.md` plus `data/master/categories.yaml`: frontmatter parses, required fields present (`github_url`, `full_name`, `category`), enums valid (`status`: active|stale|archived, `source`: manual|mcp|x-collection), `category` matches an id in the category master, and the filename matches `slugify(full_name)`.
2. **cargo test** — `cd src-tauri && cargo test`. All core Rust logic (frontmatter, store, search, github, gitops, settings). Note: Tauri's `generate_context!` embeds `dist/`; verify-all.sh handles this automatically by running the frontend build before cargo test when `dist/` is missing (stages 2 and 3 swap on a fresh clone). A raw `cargo test` outside the script still needs `npm run build` first.
3. **vite build** — `npm run build`. Frontend production build; catches Svelte 5 compile errors and broken imports.
4. **mcp tests** — `cd mcp-server && npm test`. Unit tests for `lib/store.js` and `lib/suggest.js`, then the stdio smoke test exercising all four tools (`search_repos`, `get_repo_details`, `suggest_for_new_project`, `add_repo`) end to end.
5. **conformance** — `node scripts/conformance.mjs`. Feeds shared fixtures AND a function corpus (`slugify`/`normalizeGithubUrl`) through BOTH data-format implementations — Rust (`src-tauri/src/frontmatter.rs`, `store.rs`) and Node (`mcp-server/lib/store.js`) — and diffs the results. A failure here means the two implementations drifted apart.
6. **app binary build** — `cd src-tauri && cargo build --bin libraium`. The only stage that builds the REAL application binary; catches startup/bundle wiring regressions that tests alone miss (a broken bare `cargo run` once passed stages 1–5).

## Rules while fixing

- **Fix root causes, not tests.** When a test fails, assume the production code is wrong before assuming the test is. Only change a test or fixture when the *intended* behavior genuinely changed — and say so explicitly when you do.
- **The data format is dual-implemented on purpose** (Rust ⇔ Node). If the conformance stage fails, fix whichever side drifted; never "fix" it by loosening the fixture or special-casing one implementation.
- Do not skip, comment out, or reorder stages, and never declare success while any stage is red.
- If a stage cannot run for environmental reasons (e.g., no network), finish the others and report exactly which stage was blocked and why.

When done, report the final result stage by stage (pass/fail + one line each), plus a summary of every fix you made.
