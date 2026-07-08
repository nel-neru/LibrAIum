---
github_url: https://github.com/qdrant/qdrant
full_name: qdrant/qdrant
category: ai-agent
tags: [vector-db, rag, similarity-search, rust]
stars: 33051
language: Rust
last_github_push: 2026-07-08
last_checked: 2026-07-08
status: active
source: manual
added_date: 2026-06-20
---

# qdrant

High-performance vector database and similarity search engine with filtering, written in Rust. gRPC + REST APIs, runs great locally via Docker.

## Personal Notes

- My default vector DB for RAG prototypes — single `docker run` and you're up.
- Payload filtering is the killer feature vs. plain FAISS; combine metadata filters with ANN search.
- Pairs well with [run-llama/llama_index](https://github.com/run-llama/llama_index) for ingestion.
- Watch memory usage with large collections; enable on-disk payload storage beyond ~1M vectors.
