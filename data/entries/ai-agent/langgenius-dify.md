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

## Personal Notes

- Reach for it when a team needs the full lifecycle in one box — prompt design, knowledge base, app publishing, multi-user workspaces. For a single code-first agent, [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) is lighter and easier to debug.
- License gotcha: modified Apache 2.0 — internal self-hosting is fine, but multi-tenant offerings require a commercial license, and the frontend logo/branding may not be removed.
- Heavy stack: docker compose starts ~10 services (API, worker, web, Postgres, Redis, vector store, sandbox, proxy); the stated 2-core/4 GiB minimum is bare survival, budget well beyond it for real workloads.
- Workflow control flow has branches and iteration but no while loops or break/continue — push complex loops into code nodes. The built-in knowledge base competes with owning your RAG layer via [run-llama/llama_index](https://github.com/run-llama/llama_index) + [qdrant/qdrant](https://github.com/qdrant/qdrant).
