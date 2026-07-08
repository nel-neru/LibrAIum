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

## Personal Notes

- Pick it for the deployment story, not for research — SavedModel + TF Serving (typically behind [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes)) remains the smoothest train-to-serve pipeline. New-paper code lands PyTorch-first these days and Google's own research runs on JAX, so expect to port models coming from academia.
- Keras 3 migration is the big gotcha when reviving pre-2.16 code: `tf.keras` became multi-backend Keras 3 with real breaking changes (`tf.estimator` removed, `Model.weights` now returns wrapper variables). `pip install tf_keras` + `TF_USE_LEGACY_KERAS=1` restores Keras 2 behavior.
- GPU setup varies sharply by platform: Linux is easy (`pip install tensorflow[and-cuda]` bundles the CUDA libs), but native Windows GPU support ended at 2.10 — WSL2 is mandatory — and Apple Silicon needs the separate `tensorflow-metal` plugin.
- The edge story moved out of this repo: TensorFlow Lite is now LiteRT under `google-ai-edge`. Silver lining of the Keras 3 split — Keras model code is now backend-portable, so you can hedge toward JAX or PyTorch without rewriting layers.
