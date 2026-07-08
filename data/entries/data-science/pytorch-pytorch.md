---
github_url: https://github.com/pytorch/pytorch
full_name: pytorch/pytorch
category: data-science
tags: [deep-learning, machine-learning, framework, python]
stars: 101593
language: Python
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# pytorch

The de facto standard deep-learning framework — a NumPy-like tensor library with tape-based autograd, where models stay ordinary eager-mode Python and `torch.compile` adds JIT speedups on top. Python front end over a C++/CUDA core, with ROCm, Intel GPU, and Apple Silicon (MPS) backends.

## Personal Notes

- The default for anything neural: the entire ecosystem (Hugging Face, Lightning, most papers' reference code) assumes it. But raw PyTorch training loops are boilerplate-heavy — for standard fine-tuning, reach for a higher-level layer and drop to bare `nn.Module` only when the architecture is genuinely custom.
- `torch.compile` speedups hinge on avoiding graph breaks: data-dependent control flow and `.item()` calls silently fall back to eager per-fragment. Develop with `fullgraph=True` or `TORCH_LOGS="graph_breaks"` to see what didn't compile, and budget for first-iteration compile latency.
- Install is the classic friction point: default Linux `pip install torch` pulls multi-GB CUDA-bundled wheels — use the `--index-url .../whl/cpu` variant for inference-only Docker images. On Apple Silicon, MPS covers most common ops but gaps remain; `PYTORCH_ENABLE_MPS_FALLBACK=1` keeps unsupported ops running on CPU.
- TorchScript (`torch.jit`) is legacy — new export/deployment work should target `torch.export` (AOTInductor, ExecuTorch for edge). For local serving of fine-tuned LLM checkpoints, convert to GGUF and hand off to [ollama/ollama](https://github.com/ollama/ollama).
