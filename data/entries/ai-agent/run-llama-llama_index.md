---
github_url: https://github.com/run-llama/llama_index
full_name: run-llama/llama_index
category: ai-agent
tags: [knowledge-management, rag, vector-db, python]
stars: 39200
language: Python
last_github_push: 2026-07-06
last_checked: 2026-07-08
status: active
source: manual
added_date: 2026-06-20
---

# llama_index

Data framework for LLM applications — ingestion, chunking, indexing and query engines over your own data.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The loudest tracker signals cluster around Pydantic and structured-output reliability — the top-reacted request asked the framework to default to Pydantic v2 ([run-llama/llama_index#13477](https://github.com/run-llama/llama_index/issues/13477), 16👍), and a bug where structured outputs sometimes return a raw string instead of a Pydantic model drew comparable attention ([#16604](https://github.com/run-llama/llama_index/issues/16604), 14👍); both are now closed.
- Integration breadth was an early, recurring ask — requests for native Amazon Bedrock LLM/embedding support ([#7507](https://github.com/run-llama/llama_index/issues/7507), 12👍), Postgres vector-store support ([#499](https://github.com/run-llama/llama_index/issues/499), 8👍), and running against local models ([#928](https://github.com/run-llama/llama_index/issues/928), 14👍) all surfaced on the tracker and have since been closed.
- RAG grounding shows up as a distinct concern, with the "answer from outside the documents" issue ([#1321](https://github.com/run-llama/llama_index/issues/1321), 10👍) capturing worries about responses drifting beyond the indexed corpus (closed).
- Actively maintained on a fast cadence — 20 recent releases at a ~11-day median gap (latest 2026-06-24) — alongside a large open-issue/PR backlog (~504), so pin a version and track the changelog closely.

## Personal Notes

- Best-in-class document ingestion; the `SentenceSplitter` + metadata extractors save a lot of boilerplate.
- Gets heavy fast — for small projects consider hand-rolling retrieval against qdrant directly.
- The query engine abstractions (routers, sub-questions) are worth stealing as patterns even if not using the library.
