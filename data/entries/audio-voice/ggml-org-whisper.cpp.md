---
github_url: https://github.com/ggml-org/whisper.cpp
full_name: ggml-org/whisper.cpp
category: audio-voice
tags: [speech-recognition, on-device, cross-platform, cpp]
stars: 51488
language: C++
last_github_push: 2026-07-01
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# whisper.cpp

Plain C/C++ port of OpenAI's Whisper speech-to-text on the ggml tensor library — no Python, no runtime dependencies, with quantized models and CPU/Metal/CUDA/Vulkan/Core ML backends. Same binary story from Apple Silicon to Raspberry Pi, iOS/Android, and WASM.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- Keeping pace with newer speech models is the recurring theme on the tracker — open requests target NVIDIA Parakeet ([ggml-org/whisper.cpp#3118](https://github.com/ggml-org/whisper.cpp/issues/3118), 42👍), whisper-turbo ([#2439](https://github.com/ggml-org/whisper.cpp/issues/2439), 26👍), Meta MMS ([#950](https://github.com/ggml-org/whisper.cpp/issues/950), 24👍), and Voxtral ([#3326](https://github.com/ggml-org/whisper.cpp/issues/3326), 24👍); an earlier large-v3 ask was the most-reacted issue overall ([#1437](https://github.com/ggml-org/whisper.cpp/issues/1437), 63👍) and has since shipped (closed).
- Two transcription features remain long-standing open gaps: speaker diarization ([#64](https://github.com/ggml-org/whisper.cpp/issues/64), 40👍) and OpenAI-style word-level timestamps ([#375](https://github.com/ggml-org/whisper.cpp/issues/375), 29👍).
- Realtime audio input was an early high-demand request ([#10](https://github.com/ggml-org/whisper.cpp/issues/10), 42👍) that has since been addressed (issue closed).
- Actively maintained — 20 tagged releases at a ~14-day median cadence (latest 2026-06-19) — but carrying a large backlog (~1,216 open issues incl. PRs), so triage of any single request can lag.
