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

## Personal Notes

- The default way to ship on-device transcription: one static binary plus a single-file ggml model from `download-ggml-model.sh`. Size the model to the device — `large-v3` wants ~3.9 GB RAM, quantized `base`/`small` fit comfortably on phones.
- Input is picky: the CLI expects 16 kHz 16-bit WAV, so budget an ffmpeg conversion step. On long audio with silences, watch for repetition/hallucination loops — enabling the built-in Silero VAD helps a lot.
- Its edge is Apple Silicon (Metal + Core ML) and dependency-free edge deploys; for batch throughput on NVIDIA server GPUs, faster-whisper/CTranslate2 is usually the better pick. First Core ML run compiles the ANE model and can take minutes — don't mistake it for a hang.
- Natural voice front-end for local assistants — the `talk-llama` example shows the pattern, and it shares the ggml lineage with the llama.cpp stack behind [ollama/ollama](https://github.com/ollama/ollama).
