# Content strategy — what belongs on the shelf

The engineering (dual-format core, MCP surface, GUI, automation) is strong; the
*content* is what decides whether LibrAIum is valuable. This is the curation
policy the library is grown against. It reflects two owner decisions:

1. **Reception-first, not firsthand-first.** The product is evaluated from a
   **third-party / public-sentiment** angle. The synthesized `## Reception`
   section is the primary layer on every entry; `## Personal Notes` is an
   *optional* place to add the owner's own opinion, not the main deliverable.
2. **Prune the obvious.** Globally-famous mega-repos the base model already
   knows cold are actively removed — they dilute the library's signal.

## The one test for every entry

> **Does this entry tell an AI agent something it does not already know cold?**

An agent has deep, accurate training knowledge of `react`, `kubernetes`,
`pytorch`, `ffmpeg`. Shelving those and telling the agent to "consult my library
first" adds almost nothing — the value of an entry is *inversely* proportional
to how universally known its repo is. What the model does **not** have is
*current, sourced public sentiment*: which issues actually bite, what people
migrate away from, what's unmaintained now. That — the Reception — is the moat,
together with the *curation judgment* of which repos are worth tracking at all.

### Keep / add

- Non-obvious repos in spaces you track, where Reception surfaces
  decision-changing signal (recurring complaints, migration signal, maturity)
  the model can't infer from a star count.
- Obvious repos **only** when their Reception carries a limitation or migration
  fact that genuinely changes a recommendation.
- Freshness matters: an entry is only as good as its `reception_gathered` date.

### Prune / demote

- Universally-famous mega-repos whose Reception adds no decision-changing signal
  over the model's training knowledge.
- Duplicates of coverage you already have deeper elsewhere.
- Breadth-for-its-own-sake: ~2 entries spread across 18 genres is a demo shape,
  not a useful library. Depth in a few tracked spaces beats one entry per genre.

## Prune candidates (owner confirms before deletion)

The current 43 entries are breadth-first and mega-repo-heavy (30 of 43 are
≥50k★). The following are the clearest "the model already knows this cold"
candidates to **remove** (or, if you reverse the Q2 decision, demote to
info-only). This is a proposal — confirm the exact cut; deletions are
git-recoverable but are your curation call.

| Entry | ★ | Why it adds little |
| --- | --- | --- |
| freeCodeCamp/freeCodeCamp | 451k | universally known; not a dependency decision |
| react/react | 246k | model knows it cold |
| tensorflow/tensorflow | 196k | model knows it cold; largely superseded by pytorch in new work |
| flutter/flutter | 178k | model knows it cold |
| vercel/next.js | 140k | model knows it cold |
| react/react-native | 126k | model knows it cold |
| kubernetes/kubernetes | 123k | model knows it cold |
| electron/electron | 122k | model knows it cold (and you build on Tauri) |
| godotengine/godot | 114k | model knows it cold |
| openai/whisper | 105k | model knows it cold |
| pytorch/pytorch | 102k | model knows it cold |
| ant-design/ant-design | 99k | model knows it cold |
| bitcoin/bitcoin | 90k | not a dependency decision |
| gohugoio/hugo | 89k | model knows it cold |
| FFmpeg/FFmpeg | 62k | model knows it cold |
| ethereum/go-ethereum | 51k | model knows it cold |

Borderline (Reception may justify keeping — your call): `ollama`, `n8n`,
`langgenius/dify`, `netdata`, `strapi`, `obs-studio`, `freqtrade`, `OpenBB`,
`trivy`, `hashicorp/vault`, `qdrant` — these are famous but their Reception
(limitations, migration, maturity) can carry real decision signal.

Pruning to depth-in-a-few-spaces would take the library from "an inch deep
across 18 genres" toward "a mile deep in the genres you actually consult".

## Growth & maintenance loop

- **Add via `/scout`**, aimed at *non-obvious* candidates in tracked spaces —
  not the next mega-repo. `/scout` already dedupes against the library.
- **Reception is the work.** For every entry, `/reception` synthesizes sourced
  signal and stamps `reception_gathered`. Re-gather when it goes stale.
- **Freshness is surfaced** in three places now: the GUI dashboard's "Needs
  curation" list + "need reception" tile, `get_library_overview`
  (`reception_missing` / `reception_stale`), and `curation-report.mjs`
  (reception-freshness section). Treat `reception_stale` like `status: stale`.
- **Personal Notes stay optional** — add them only where you have a genuine
  firsthand opinion; never let an entry fake firsthand experience.

## What this means for positioning

LibrAIum is best described as *a curated shelf of **sourced public-sentiment
Reception** on repos worth tracking* — not "my firsthand notes". The README,
the `libraium-first` skill, and `add_repo` have been aligned to that framing.
