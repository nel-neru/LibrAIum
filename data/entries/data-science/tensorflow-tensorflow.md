---
github_url: https://github.com/tensorflow/tensorflow
full_name: tensorflow/tensorflow
category: data-science
tags: [machine-learning, deep-learning, framework, python]
stars: 196120
language: C++
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# tensorflow

Google's end-to-end machine learning framework — Python/Keras API over a C++ core, with the most complete train-to-production path in ML: SavedModel export, TF Serving, TFX pipelines, and LiteRT for on-device inference. Still on a steady release train (v2.21, March 2026) a decade in.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The most-reacted issues on the tracker are all historical requests for non-Python language bindings — a Node.js / JavaScript wrapper API ([tensorflow/tensorflow#37](https://github.com/tensorflow/tensorflow/issues/37), 962👍) and OpenCL support ([#22](https://github.com/tensorflow/tensorflow/issues/22), 910👍) top the all-time list, joined by a C# API request ([#18](https://github.com/tensorflow/tensorflow/issues/18), 185👍); all three are now closed.
- Among still-open issues, GPU setup friction is the loudest signal — cuDNN, cuFFT, and cuBLAS errors ([#62075](https://github.com/tensorflow/tensorflow/issues/62075), 148👍) remain unresolved, a recurring install pain point.
- Actively maintained on a fast release train (20 releases at a ~10-day median interval, latest March 2026), but carrying a large backlog (~2,655 open issues and PRs), so lean on the changelog to track fixes.
