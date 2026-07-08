---
github_url: https://github.com/AppFlowy-IO/AppFlowy
full_name: AppFlowy-IO/AppFlowy
category: productivity
tags: [knowledge-management, local-first, self-hosted, cross-platform, dart]
stars: 73489
language: Dart
last_github_push: 2026-06-26
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# AppFlowy

Open-source Notion alternative — docs, wikis, and kanban/grid databases — built with Flutter on a Rust core, shipping native on macOS/Windows/Linux plus iOS/Android. Data lives on-device by default; sync via AppFlowy Cloud or a self-hosted backend is strictly optional.

## Personal Notes

- The pick when you want Notion's block-and-database model but the data must stay yours. Since v0.8.7 the AI features run free against local models through [ollama/ollama](https://github.com/ollama/ollama), and v0.9.5 added a "Vault" workspace that keeps everything — AI included — fully offline.
- Local-first does not mean easy self-hosted sync: the AppFlowy-Cloud backend is a ~10-service docker-compose stack (Postgres, Redis, MinIO, GoTrue auth, nginx, AI, search, worker). Budget real ops time, or accept the hosted cloud for multi-device sync.
- Know the limits going in: the maintainers themselves don't claim Notion parity in features or polish yet, Android ARMv7 is unsupported, and the AGPL-3.0 license matters if you ever plan to embed or fork it into a product.
- Also worth reading as the flagship large-scale [flutter/flutter](https://github.com/flutter/flutter) desktop app — the Flutter-frontend-over-Rust-core split is a solid reference architecture for cross-platform Dart work.
