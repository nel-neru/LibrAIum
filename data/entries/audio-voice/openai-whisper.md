---
github_url: https://github.com/openai/whisper
full_name: openai/whisper
category: audio-voice
tags: [speech-recognition, machine-learning, deep-learning, python]
stars: 104549
language: Python
last_github_push: 2026-04-15
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# whisper

General-purpose speech recognition model from OpenAI — multilingual transcription, speech-to-English translation, and language ID from a single checkpoint, trained on 680k hours of weakly supervised audio. Ships as a pip package with a CLI and Python API (MIT license); needs PyTorch and ffmpeg on PATH.

## Personal Notes

- The first stop for any transcription task. Default to `turbo` (~6GB VRAM) for speed — but it is not trained for translation, so drop to `medium`/`large` (~10GB VRAM) when you need X-to-English.
- Sharp edge: it hallucinates text on silence and music — put a VAD in front for long recordings. No speaker diarization either; bolt on pyannote or similar when you need "who said what."
- This repo is the reference research implementation, not a serving stack. For production throughput, most people run the same weights through faster-whisper (CTranslate2) or [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) for CPU/edge — reach for those before optimizing this code.
- Runs on [pytorch/pytorch](https://github.com/pytorch/pytorch); Python 3.8–3.11 is the supported range. Releases are infrequent (latest: v20250625) but the repo still gets pushes — slow-moving by design, not abandoned.
