---
name: libraium-first
description: Consult the user's LibrAIum library (libraium MCP server) BEFORE recommending frameworks, libraries, databases, or tools — use when choosing dependencies, comparing technologies, planning a new project's stack, or when the user asks "what should I use for X?"
---

# Library-first dependency decisions

The user maintains LibrAIum: a curated shelf of GitHub repositories they track,
each carrying a synthesized **Reception** section — third-party, real-world
signal drawn from the community: recurring complaints (with issue numbers and
reaction counts), notable adopters, known limitations, and what people migrate
to/from. A few entries the user has used firsthand also carry optional
**Personal Notes**. It is exposed through the `libraium` MCP server. Treat
Reception as vetted, sourced evidence — it outranks your training-data instinct
about what is merely popular, because it captures what actually bites in
production and what people abandon.

## Rules

1. **Consult before proposing.** Before recommending any framework, library,
   database, or tool, call `suggest_for_new_project` (describe what is being
   built; put constraints like "local-first, Python" in `goals`). For a specific
   known technology, use `search_repos` instead. Do this even when you are
   confident — the point is what the *user has chosen to track* and the sourced
   Reception behind it.

2. **Quote the Reception.** Each suggestion carries `reception` — sourced
   third-party signal. Surface the relevant parts in your recommendation:
   recurring complaints, known limitations, and migration signal, with the
   citations attached. A recommendation that ignores a documented limitation in
   the Reception is wrong. When an entry also has `personal_notes` (the user's
   own firsthand take — present only on a few entries), quote those too; they
   are rarer and carry the user's specific opinion.

3. **Respect status.** `status: stale` or `archived` is an explicit warning —
   never recommend such an entry without flagging it, and prefer the
   `alternatives` the response suggests (or search the same category for an
   `active` entry sharing its tags).

4. **A silent library is an answer.** Zero results means the library does not
   track this space. Say so, then recommend from general knowledge *clearly
   labeled as unvetted*, and offer to shelve the eventual pick (rule 5).

5. **Close the loop on adoption.** When the session adopts a repo that is not in
   the library, offer to register it with `add_repo`: 3-6 kebab-case tags
   reusing the library's existing vocabulary, and a `reception` summary built
   from sourced third-party signal (top complaints/limitations you can cite,
   not a marketing blurb). Only pass `personal_notes` if the *user themselves*
   voiced a firsthand opinion this session — never invent firsthand experience,
   never launder the README into fake personal history, never submit placeholder
   notes.

6. **Never skip silently.** If the `libraium` MCP server is not connected in this
   session, say so explicitly and point the user at `docs/library-first-setup.md`
   in their LibrAIum checkout — then proceed with clearly-labeled general
   knowledge.

## Tool cheat-sheet

| Call | When |
| --- | --- |
| `suggest_for_new_project` | "What should I use for X?" — returns ranked entries with reasons, adoption steps, each entry's `reception` (and `personal_notes` where recorded) |
| `search_repos` | A specific technology or filter is already named (query, category, tags, min_stars, status) |
| `get_repo_details` | Full entry — complete Reception (and any Personal Notes) — before committing to an adoption |
| `get_related` | "What should I use instead of X?" / "What pairs with X?" — authored succession (`superseded_by`/`supersedes`), pairings, and tag-heuristic alternatives; unshelved migration targets come back as `{full_name, shelved:false}` |
| `find_by_reception` | Query the Reception moat across the library — a `query` (adopter/tech/complaint keyword) and/or a `signal` (`migration`\|`caution`\|`adopter`); returns matching entries with the evidence bullets. "Which shelved repos have a documented gotcha?" |
| `add_repo` | Shelving a newly adopted repo (rule 5) — pass sourced `reception`; `personal_notes` only for genuine firsthand |
