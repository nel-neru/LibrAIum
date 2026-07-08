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

## Personal Notes

- Best-in-class document ingestion; the `SentenceSplitter` + metadata extractors save a lot of boilerplate.
- Gets heavy fast — for small projects consider hand-rolling retrieval against qdrant directly.
- The query engine abstractions (routers, sub-questions) are worth stealing as patterns even if not using the library.
