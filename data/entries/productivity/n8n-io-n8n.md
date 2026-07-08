---
github_url: https://github.com/n8n-io/n8n
full_name: n8n-io/n8n
category: productivity
tags: [workflow-orchestration, low-code, self-hosted, typescript]
stars: 195689
language: TypeScript
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# n8n

Fair-code workflow automation platform — a visual node canvas with escape hatches to real JavaScript/Python code, 400+ integrations, and native AI-agent/LangChain nodes. Self-hosts from a single Docker container or `npx n8n`.

## Personal Notes

- The default pick for self-hosted glue automation — a Zapier/Make replacement that keeps credentials and data on your own box, and the Code node rescues you from the usual low-code dead ends.
- License gotcha: fair-code Sustainable Use License, not OSI open source — internal business use and consulting are fine, but embedding it in or reselling it as your own SaaS requires a paid embed/enterprise license.
- The out-of-the-box SQLite single-process setup is for trying it out; past ~1k executions/day switch to Postgres + queue mode with Redis workers, and keep `N8N_ENCRYPTION_KEY` identical across main and workers or every execution fails on credential decryption. Set binary data mode to `filesystem` before moving large files through workflows.
- AI nodes talk to hosted providers or local models via [ollama/ollama](https://github.com/ollama/ollama), and MCP client/server nodes let workflows call or act as MCP tools alongside [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers). For LLM-app-centric building (RAG, chat apps) [langgenius/dify](https://github.com/langgenius/dify) is the closer fit — n8n wins when the job is mostly wiring SaaS APIs together.
