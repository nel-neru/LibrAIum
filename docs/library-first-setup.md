# Using LibrAIum from every project — setup

Two pieces make Claude Code consult your library at every dependency decision, in **any** repo on this machine:

1. the **MCP server**, registered at *user scope* (available in every project), and
2. the **libraium-first skill**, the behavior layer that makes Claude actually call it.

## 1. Register the MCP server (user scope)

From your LibrAIum checkout:

```bash
cd mcp-server && npm install    # once
claude mcp add --scope user libraium -- node "$PWD/index.js" --data-dir "$PWD/../data"
```

`--scope user` puts the server in `~/.claude.json`, so it is available in every project, not just this checkout. Absolute paths matter: the command above bakes them in via `$PWD`; if you move the checkout, re-run it.

Verify:

```bash
claude mcp list          # shows: libraium … node <abs>/mcp-server/index.js
```

On startup the server logs `[libraium-mcp] serving data from <dir>` to stderr — if that path is wrong, check the resolution order: `--data-dir` flag > `$LIBRAIUM_DATA_DIR` > `./data` / repo checkout > `~/LibrAIum/data`.

## 2. Install the libraium-first skill (user scope)

```bash
cp -r integrations/claude/skills/libraium-first ~/.claude/skills/
```

The skill triggers whenever a session involves choosing dependencies, comparing technologies, or planning a stack, and instructs Claude to consult the library first, quote your Personal Notes as evidence, respect stale/archived warnings, and offer to shelve newly adopted repos.

## Alternative: paste-in CLAUDE.md block

For a repo where you want the behavior pinned in the project itself (or user-scope skills are unavailable), paste this into that repo's `CLAUDE.md`:

```markdown
## Library-first dependency decisions

I maintain LibrAIum, a curated library of repos I have vetted, exposed via the
`libraium` MCP server. Before recommending any framework, library, database, or
tool: call `suggest_for_new_project` (or `search_repos` for a named technology)
and ground the recommendation in the results — quote the `personal_notes`
bullets verbatim as firsthand evidence. Entries with status stale/archived are
explicit warnings; prefer suggested alternatives. If the library returns
nothing, say so and label the fallback recommendation as unvetted. When this
session adopts a repo that is not shelved yet, offer `add_repo` with honest
notes (never fabricated experience). If the libraium MCP server is not
connected, say so instead of skipping the consultation silently.
```

## Smoke check

In any other repo, ask Claude Code:

> what should I use for a RAG pipeline?

A working setup answers with entries from *your* shelf (e.g. `qdrant/qdrant`, `run-llama/llama_index`) and quotes your note bullets — not generic training-data picks.
