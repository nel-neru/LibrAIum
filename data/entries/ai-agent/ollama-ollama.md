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
reception_gathered: 2026-07-09
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

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The most-reacted open requests are backend and model-support asks: an MLX backend for Apple Silicon ([ollama/ollama#1730](https://github.com/ollama/ollama/issues/1730), 381👍) and reranking-model support ([#3368](https://github.com/ollama/ollama/issues/3368), 378👍) sit at the top of the tracker, alongside a proposed native Go inference engine ([#15051](https://github.com/ollama/ollama/issues/15051), 291👍).
- New-model support is a recurring theme that the project tends to fulfill: high-demand asks like Qwen2-VL/2.5-VL ([#6564](https://github.com/ollama/ollama/issues/6564), 348👍), Llama 4 ([#10143](https://github.com/ollama/ollama/issues/10143), 243👍) and Pixtral ([#6748](https://github.com/ollama/ollama/issues/6748), 231👍) have all shipped (closed), while Janus-Pro-7b vision ([#8618](https://github.com/ollama/ollama/issues/8618), 273👍) remains open.
- Packaging hygiene draws attention too — one open issue flags that release artifacts omit notice licenses ([#3185](https://github.com/ollama/ollama/issues/3185), 275👍).
- Development is very fast-moving — 20 recent releases at a median 2-day interval (latest 2026-07-06) — paired with a large backlog (~3,383 open issues including PRs), so track the changelog closely.
