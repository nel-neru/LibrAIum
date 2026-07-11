---
description: Scout vetted GitHub candidates for a thin shelf (or a stale entry's successor), deduped against the library, ending in /add-entry offers
argument-hint: "<category-id> | --replace <entry-id>"
---

Scout candidates for: **$ARGUMENTS**

Explicitly user-invoked — the GitHub search below is the only network call. Export a token so searches don't hit the anonymous limit:

```bash
export GITHUB_TOKEN=$(gh auth token)
```

## 1. Frame the search

- **Shelf mode** (`$ARGUMENTS` is a category id): read that shelf's existing entries and their tags — `node scripts/curation-report.mjs` shows shelf sizes and the tag vocabulary. Derive **2-3 single-topic queries** from the category's name/description in `data/master/categories.yaml` plus its dominant tags (e.g. `audio-voice` → `speech recognition`, `text to speech`, `audio processing`). One topical phrase per query beats a long AND — the search narrows fast.
- **Succession mode** (`--replace <entry-id>`): read that stale/archived entry's tags and summary; seed the queries from its tags so the candidates are drop-in replacements.

## 2. Search with floors (verified recipe)

Run each query — adjust `--stars` to the shelf (flagship shelves want a higher floor; niche shelves lower):

```bash
gh search repos --sort stars --limit 15 --archived=false --stars '>2000' \
  --json fullName,stargazersCount,pushedAt,license,description \
  '<query>'
```

Use `--sort updated` instead when you care about liveness over popularity. Drop anything whose `pushedAt` is older than ~12-18 months (dormant), and awesome-lists / tutorial collections (not real tooling).

## 3. Dedupe against the library AND the rejected-candidates memory

Filter every hit through two checks — never propose something already shelved (`findDuplicate`, case-insensitive on `full_name`, catches it even under a different category), and never re-surface a repo already evaluated and consciously declined (`findRejected`, `data/master/rejected.yaml`):

```bash
gh search repos --sort stars --limit 15 --archived=false --stars '>2000' \
  --json fullName,stargazersCount,pushedAt,license,description '<query>' \
| node --input-type=module -e '
  import { findDuplicate } from "./mcp-server/lib/store.js";
  import { findRejected } from "./mcp-server/lib/rejected.js";
  let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
    for (const r of JSON.parse(s)) {
      if (findDuplicate("data", r.fullName) || findRejected("data", r.fullName)) continue;
      console.log(`${r.fullName}\t★${r.stargazersCount}\t${(r.pushedAt||"").slice(0,10)}\t${r.license?.key||"—"}\t${(r.description||"").slice(0,80)}`);
    }
  });'
```

## 4. Present a shortlist

A severity-ranked table (best fit first): repo, stars, last push, license, **why it fits this shelf**, and **how it differs** from what's already there (don't propose three of the same thing). In succession mode, say explicitly which candidate best replaces the stale entry and why.

## 5. Hand off to curation

End by offering to run `/add-entry <url> <category>` for the picks the user approves (or `/bulk-add` if they pick several) — scouting flows straight into the existing curation pipeline. Do not write entries here; `/scout` only researches.

## 6. Record what the user passed on

When the user explicitly declines a candidate (not a fit, too niche, superseded, redundant with existing coverage), record it so future scouts and bulk-triage runs don't resurface it:

```bash
node scripts/reject-candidate.mjs <owner/repo> "<one-line reason>"
```

This appends to `data/master/rejected.yaml` (local, git-versioned, no network; idempotent by `full_name`). Only record a genuine decline — not repos the user simply didn't get to. A repo that later becomes worth shelving can just be `/add-entry`-ed; validate-data flags any repo that is both rejected and shelved.
