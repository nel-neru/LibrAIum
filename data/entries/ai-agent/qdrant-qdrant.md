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
reception_gathered: 2026-07-09
---

# qdrant

High-performance vector database and similarity search engine with filtering, written in Rust. gRPC + REST APIs, runs great locally via Docker.

## Setup

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

- REST + web dashboard on `:6333/dashboard`, gRPC on `:6334`.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- Collection-schema flexibility is the most-reacted theme on the tracker: the top request asks to add a new vector field after a collection is created ([qdrant/qdrant#1132](https://github.com/qdrant/qdrant/issues/1132), 20👍), echoed by requests to allow optional vectors under named vectors ([#1045](https://github.com/qdrant/qdrant/issues/1045), 11👍), store collection-level metadata ([#3182](https://github.com/qdrant/qdrant/issues/3182), 11👍), and rename collections via the API/dashboard ([#3904](https://github.com/qdrant/qdrant/issues/3904), 10👍) — all since closed.
- A storage-reclamation gap remains one of the few high-reaction issues still open: deleting the underlying vectors for deleted points ([#2550](https://github.com/qdrant/qdrant/issues/2550), 13👍).
- Advanced quantization and retrieval features draw notable demand, including a TurboQuant quantization request ([#8524](https://github.com/qdrant/qdrant/issues/8524), 15👍) and a ColBERT tracking issue ([#3684](https://github.com/qdrant/qdrant/issues/3684), 12👍), both closed.
- Actively maintained on a steady release cycle — 20 tagged releases at a median ~18-day interval (latest 2026-06-04) — against a sizable backlog of ~615 open issues/PRs; the README lists no named adopters.

## Personal Notes

- My default vector DB for RAG prototypes — single `docker run` and you're up.
- Payload filtering is the killer feature vs. plain FAISS; combine metadata filters with ANN search.
- Pairs well with [run-llama/llama_index](https://github.com/run-llama/llama_index) for ingestion.
- Watch memory usage with large collections; enable on-disk payload storage beyond ~1M vectors.
