---
github_url: https://github.com/ollama/ollama
full_name: ollama/ollama
category: ai-agent
tags: [local-llm, llm-inference, cli, go]
stars: 175737
language: Go
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# ollama

The de facto standard for running open-weight LLMs (Llama, Gemma, Qwen, DeepSeek) locally — one CLI to pull quantized models and serve them behind an OpenAI-compatible API on port 11434. Go binary over llama.cpp/GGML with Modelfile-based model packaging.

## Setup

```bash
# macOS: brew install ollama   |   Linux: curl -fsSL https://ollama.com/install.sh | sh
ollama serve &
ollama run llama3.2
```

- OpenAI-compatible endpoint at `http://localhost:11434/v1`.

## Personal Notes

- The default offline backend for agent development: point any OpenAI SDK at `http://localhost:11434/v1` and swap models without touching app code.
- Biggest gotcha: conservative default context window with silent prompt truncation — long system prompts and tool schemas get cut with no client-side error. Set `num_ctx` (or `OLLAMA_CONTEXT_LENGTH`) explicitly for agent work.
- Single-box, developer-first by design: parallelism is capped (`OLLAMA_NUM_PARALLEL`) and idle models unload after ~5 min (`keep_alive`), so expect a reload latency spike after a pause. Multi-user throughput is vLLM territory, not Ollama's.
- Natural base of a fully local RAG stack — serves chat and embedding models alike; pair with [qdrant/qdrant](https://github.com/qdrant/qdrant) for storage and [run-llama/llama_index](https://github.com/run-llama/llama_index) for ingestion.
