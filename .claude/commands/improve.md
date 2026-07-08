---
description: Run ONE iteration of the continuous-improvement loop — pick the highest-value backlog item, implement it, verify end-to-end, commit
---

Run exactly **one iteration** of LibrAIum's improvement loop. One iteration = one focused improvement, verified and committed. Do not batch multiple unrelated improvements into a single iteration.

## 1. Load state

Read `.claude/improvement-backlog.md`.

**If it does not exist (first iteration):** seed it by auditing the repo along these dimensions, then pick the top item and continue. Write concrete, single-commit-sized items — not vague themes.

- **Robustness (Rust)** — `unwrap()`/`expect()`/panic paths in `src-tauri/src/`, unhandled I/O errors, edge cases in store/search/github/gitops (empty data dir, malformed entry mid-library, concurrent refresh, git repo in weird states)
- **Robustness (MCP server)** — input validation gaps, unhelpful error messages, behavior on corrupt/missing data files
- **Test coverage** — untested branches in Rust modules; the MCP server has only the smoke test — targeted unit tests for `lib/store.js` / `lib/suggest.js`
- **Dual-format parity** — adversarial edge cases (unicode slugs, CRLF, empty body, frontmatter-like body content, huge tags) → new fixtures in `tests/fixtures/format/` proving both sides agree
- **Frontend (Svelte 5)** — empty/loading/error states, race conditions on rapid navigation, keyboard access, feedback on slow network ops
- **DX / docs** — README accuracy, script failure messages, CLAUDE.md drift
- **CI** — speed, cache hit rate, flakiness

Backlog format:

```markdown
# Improvement Backlog
## Pending  (ordered: highest value first)
- [ ] P1 <one-line item> — <why it matters, 1 sentence>
## Done
- [x] <item> — <commit hash> (<date>)
## Rejected
- <item> — <why not worth doing>
```

Priority order: **P1** correctness & data-safety bugs → **P2** missing tests for existing behavior → **P3** error handling & user-facing failure messages → **P4** dual-format hardening (new fixtures) → **P5** docs/DX/CI polish.

## 2. Pick ONE item

Take the highest-priority pending item that fits in a single focused session. If the top item is too big, split it into smaller backlog entries and take the first piece. State clearly which item you picked and why.

## 3. Implement

Hard constraints — these override anything the backlog says:

- **Do NOT build future phases**: X auto-collection, semantic search/embeddings, project bootstrap generation. If a backlog item requires them, move it to Rejected.
- **Data-format changes touch BOTH implementations** (`src-tauri/src/store.rs`+`frontmatter.rs` ⇔ `mcp-server/lib/store.js`) plus a new fixture in `tests/fixtures/format/`. Consider delegating the parity check to the `conformance-auditor` agent.
- **No new dependencies** unless the item is impossible without one; justify it in the commit message.
- **Improve, don't churn**: no stylistic rewrites, no speculative abstractions, no renames without functional benefit. Match the existing code's idiom.
- New/changed entries under `data/entries/` follow the `entry-authoring` skill.
- Secrets never in files; no new network calls outside explicit refresh/add paths.
- If commands, scripts, or structure changed, update CLAUDE.md in the same commit.

## 4. Verify

```bash
export PATH="/opt/homebrew/bin:$PATH"
bash scripts/verify-all.sh
```

All 5 stages must pass end-to-end. Fix root causes, not tests (see `/verify` rules). For non-trivial diffs, have the `libraium-reviewer` agent review before committing; address real findings.

If you cannot get verify-all green: **revert the change completely**, record the item under Rejected with what failed, and end the iteration honestly — a reverted iteration is a valid outcome, a red commit is not.

## 5. Commit & update state

- One commit, conventional message (`fix:`/`test:`/`refactor:`/`docs:`/`ci:`), explaining *why* in the body. **Do not push** — the user pushes when they choose.
- Update `.claude/improvement-backlog.md`: move the item to Done with the commit hash; add any new issues discovered during the work to Pending (with priority); include the backlog update in the same commit.

## 6. Report & stop condition

End the iteration with:

1. What was improved and why it was the top pick
2. verify-all result (stage-by-stage, one line each)
3. Commit hash
4. Backlog delta (done / newly added / rejected)
5. Next candidate item

**Stop condition:** if Pending is empty AND a fresh audit (step 1 dimensions) surfaces nothing that genuinely clears the value bar, do NOT invent work. Write `## LOOP COMPLETE` at the top of the backlog, say so in the report, and if running under `/loop`, end the loop.
