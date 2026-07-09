---
github_url: https://github.com/modelcontextprotocol/servers
full_name: modelcontextprotocol/servers
category: ai-agent
tags: [mcp-server, claude-code, agent-tooling, typescript]
stars: 52800
language: TypeScript
last_github_push: 2026-07-07
last_checked: 2026-07-08
status: active
source: manual
added_date: 2026-06-21
---

# servers

Official reference implementations of MCP servers — filesystem, fetch, git, memory and more.

## Setup

```bash
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /path/to/allowed/dir
```

- Each server is standalone; swap `server-filesystem` for `server-git`, `server-memory`, etc.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- Runtime and startup friction dominates the most-reacted issues: the top report is that servers fail under NVM ([modelcontextprotocol/servers#64](https://github.com/modelcontextprotocol/servers/issues/64), 182👍, since closed), echoed by an npx-based GitHub-server startup failure ([#1097](https://github.com/modelcontextprotocol/servers/issues/1097), 19👍, closed).
- Config-not-respected is a recurring complaint against the memory server — environment variables ignored ([#1018](https://github.com/modelcontextprotocol/servers/issues/1018), 23👍) and a custom storage path ignored ([#692](https://github.com/modelcontextprotocol/servers/issues/692), 15👍), both still open.
- Open feature and hardening asks include reading image files from the filesystem server ([#533](https://github.com/modelcontextprotocol/servers/issues/533), 23👍) and a still-open proposal to adopt credential-management best practices ([#754](https://github.com/modelcontextprotocol/servers/issues/754), 22👍).
- Actively maintained with a steady release rhythm — 20 tagged releases at a ~18-day median cadence, latest 2026-07-04 — though against a large backlog of ~651 open issues and PRs; no adopters are named in the README.

## Personal Notes

- The canonical place to learn MCP server patterns; the `filesystem` server is the best-annotated example.
- Copy the tool description style: short, model-facing, states when to use the tool.
- LibrAIum's own MCP server borrows the stdio + zod schema pattern from here.
