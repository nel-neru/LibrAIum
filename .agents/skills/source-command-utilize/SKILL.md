---
name: "source-command-utilize"
description: "Run one PDCA iteration of the utilization loop — build one thing that makes the library pay off in real use"
---

# source-command-utilize

Use this skill when the user asks to run the migrated source command `utilize`.

## Command Template

Run exactly **one iteration** of LibrAIum's utilization loop. Where `/improve` hardens what exists, `/utilize` builds the mechanisms that make the library *earn its keep*: commands, agents, skills, scripts, MCP tools, docs. One iteration = one deliverable, proven useful, verified, committed.

## P — Plan

Read `.Codex/utilization-backlog.md` and pick the highest-priority pending item that fits one focused session. If the top item is too big, split it and take the first piece. State what you picked and the utilization payoff you expect.

**If the backlog is missing or Pending is empty:** run a fresh ideation pass over these personas — new-project developer, maintainer/curator, Codex integration, batch automation (user-invoked only), publisher, decision support — and refill Pending with concrete, single-commit-sized items before picking. If ideation surfaces nothing that genuinely clears the value bar, write `## LOOP COMPLETE` at the top of the backlog and stop honestly.

## D — Do

Build the deliverable. Hard constraints (override anything the backlog says):

- **FORBIDDEN future phases**: X/Twitter auto-collection, semantic search / embeddings, project bootstrap generation (scaffolding). Lexical techniques only.
- **Fully local & private.** GitHub API (`gh`) only inside explicitly user-invoked actions — never a daemon, never a scheduled network call.
- **No new runtime dependencies** unless the item is impossible without one; justify in the commit message.
- Data-format changes touch BOTH implementations (`src-tauri/src/` ⇔ `mcp-server/lib/store.js`) plus a conformance fixture — see `/format-sync`.
- New entries follow the `entry-authoring` skill; UI changes follow `DESIGN.md`.
- Match existing idiom; if commands/scripts/structure changed, update AGENTS.md and README in the same commit.

## C — Check

Two gates, both required:

1. **The acceptance check from the backlog item** — actually exercise the deliverable (run the command, invoke the script on real data, query the MCP tool) and show the observable result. A tool nobody ran is not done.
2. **`bash scripts/verify-all.sh`** — all stages green. Fix root causes, not tests. For non-trivial diffs, have `libraium-reviewer` review before committing.

If you cannot get both gates green: revert completely, record the item under Rejected with what failed, and end the iteration honestly.

## A — Act

- One feature commit, conventional message (`feat:`/`fix:`/`docs:`/`test:`/`ci:`), body explaining the usage scenario it serves. **Push only when the user has asked for pushes.**
- Then update `.Codex/utilization-backlog.md` — move the item to Done with the feature commit's hash and a one-line "proven by" note; add follow-up ideas discovered while building (with priority) — and record it in a `chore: utilization backlog — iter N` commit (same two-commit pattern as `/improve`).
- Report: what was built, the acceptance-check evidence, verify-all result, commit hash, backlog delta, next candidate.

**Stop condition:** Pending empty AND a fresh ideation pass surfaces nothing above the value bar → write `## LOOP COMPLETE` at the top of the backlog, report it, and if running under `/loop`, end the loop.
