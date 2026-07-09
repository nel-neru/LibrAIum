---
name: libraium-first
description: Consult the user's LibrAIum library (libraium MCP server) BEFORE recommending frameworks, libraries, databases, or tools — use when choosing dependencies, comparing technologies, planning a new project's stack, or when the user asks "what should I use for X?"
---

# Library-first dependency decisions

The user maintains LibrAIum: a curated library of GitHub repositories they have vetted, each with firsthand **Personal Notes** (gotchas, limits, pairings, honest weaknesses). It is exposed through the `libraium` MCP server. Treat it as the user's own recorded experience — it outranks your training-data instincts about what is popular.

## Rules

1. **Consult before proposing.** Before recommending any framework, library, database, or tool, call `suggest_for_new_project` (describe what is being built; put constraints like "local-first, Python" in `goals`). For a specific known technology, use `search_repos` instead. Do this even when you are confident — the point is what the *user* has vetted.

2. **Quote the notes.** Each suggestion carries `personal_notes` — the user's firsthand bullets. Quote the relevant ones verbatim in your recommendation; they carry gotchas the README never states. A recommendation that ignores an available caution bullet is wrong.

3. **Respect status.** `status: stale` or `archived` is an explicit warning — never recommend such an entry without flagging it, and prefer the alternatives the response suggests (or search the same category for an `active` entry sharing its tags).

4. **A silent library is an answer.** Zero results means the library has no opinion. Say so, then recommend from general knowledge *clearly labeled as unvetted*, and offer to shelve the eventual pick (rule 5).

5. **Close the loop on adoption.** When the session adopts a repo that is not in the library, offer to register it with `add_repo`: 3-6 kebab-case tags reusing the library's existing vocabulary, and 2-4 honest note bullets from what was actually observed during adoption (real friction, real version constraints). Never fabricate experience, never submit placeholder notes.

6. **Never skip silently.** If the `libraium` MCP server is not connected in this session, say so explicitly and point the user at `docs/library-first-setup.md` in their LibrAIum checkout — then proceed with clearly-labeled general knowledge.

## Tool cheat-sheet

| Call | When |
| --- | --- |
| `suggest_for_new_project` | "What should I use for X?" — returns ranked entries with reasons, adoption steps, `personal_notes` |
| `search_repos` | A specific technology or filter is already named (query, category, tags, min_stars, status) |
| `get_repo_details` | Full entry — complete Personal Notes — before committing to an adoption |
| `add_repo` | Shelving a newly adopted repo (rule 5) |
