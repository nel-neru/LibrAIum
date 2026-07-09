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

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- Apple-Silicon GPU support is the loudest demand on the tracker: the top-reacted issue asks for M1 GPU acceleration ([pytorch/pytorch#47702](https://github.com/pytorch/pytorch/issues/47702), 1224👍) and is still open, trailed by an MPS op-coverage tracking issue ([#77764](https://github.com/pytorch/pytorch/issues/77764), 972👍) and an ARM Mac Neural Engine request ([#47688](https://github.com/pytorch/pytorch/issues/47688), 181👍) — so even with an MPS backend shipped, op coverage is still tracked as incomplete.
- Backend and interop breadth recur among the most-reacted requests, most now closed: Windows support ([#494](https://github.com/pytorch/pytorch/issues/494), 383👍), OpenCL ([#488](https://github.com/pytorch/pytorch/issues/488), 210👍), and ONNX import ([#21683](https://github.com/pytorch/pytorch/issues/21683), 478👍).
- Operational friction also surfaces — a CUDA out-of-memory error drew a large thread ([#16417](https://github.com/pytorch/pytorch/issues/16417), 204👍), and deprecating the official Anaconda channel drew pushback ([#138506](https://github.com/pytorch/pytorch/issues/138506), 212👍).
- Actively maintained with a ~42-day median gap across its last 20 releases (latest 2026-07-08), but carrying a very large backlog (~18,211 open issues/PRs); the README lists no adopters, so named-adopter signal is limited.
