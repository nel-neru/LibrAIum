---
github_url: https://github.com/langgenius/dify
full_name: langgenius/dify
category: ai-agent
tags: [workflow-orchestration, low-code, rag, self-hosted, typescript]
stars: 148200
language: TypeScript
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# dify

Self-hostable LLM app platform — visual workflow canvas, built-in RAG pipelines, agent runtime (function calling / ReAct with 50+ tools), and model management across hundreds of providers, all exposed as APIs. One `docker compose up` in `docker/` brings up the whole stack, from web console to Postgres and a vector store.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The most-reacted issues are overwhelmingly integration/protocol requests that the maintainers have since shipped and closed: adding Microsoft's GraphRAG ([langgenius/dify#6019](https://github.com/langgenius/dify/issues/6019), 102👍), Model Context Protocol support ([#11415](https://github.com/langgenius/dify/issues/11415), 76👍), and OpenAI's Realtime API ([#8986](https://github.com/langgenius/dify/issues/8986), 52👍).
- That pattern of demanded features converting into releases continues through later protocol asks — A2A support ([#19352](https://github.com/langgenius/dify/issues/19352), 29👍), an agent node usable inside a workflow ([#7470](https://github.com/langgenius/dify/issues/7470), 26👍), and Agent Skills as a new tool-provider type ([#30052](https://github.com/langgenius/dify/issues/30052), 26👍) — all now closed.
- Maintenance is fast-moving: 20 tagged releases at a ~9-day median interval (latest 2026-06-25), though against a large ~815-item open issue/PR backlog.
- No production adopters are named in the README, so there is limited public signal on firsthand deployments.
