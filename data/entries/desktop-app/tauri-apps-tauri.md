---
github_url: https://github.com/tauri-apps/tauri
full_name: tauri-apps/tauri
category: desktop-app
tags: [framework, cross-platform, rust, webview, mobile]
stars: 108810
language: Rust
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# tauri

Desktop (and, since v2, iOS/Android) app framework that pairs a web frontend with a Rust backend and renders through the OS's own webview instead of bundling Chromium — installers land in single-digit MB where Electron ships ~100 MB. v2 adds a capability-based permission system that gates every IPC and plugin surface.

## Personal Notes

- The Electron alternative that actually stuck — LibrAIum's own GUI is Tauri v2 + Svelte 5. Any SPA frontend drops in; pairs naturally with [sveltejs/kit](https://github.com/sveltejs/kit) using the static adapter.
- The system webview cuts both ways: you don't control the engine, and WebKitGTK on Linux lags Chrome/Safari with real compositing quirks — test Linux early instead of assuming Chrome-parity CSS.
- IPC naming trips everyone once: command arguments become camelCase on the JS side, but struct fields inside payloads stay as declared in Rust (`min_stars`, not `minStars`). Also no cross-compilation — release builds need one CI runner per OS (tauri-action covers GitHub Actions).
- Friction to budget for: v2's capability files require an explicit grant per plugin API, and the backend is Rust or sidecar binaries — a team that needs Node in-process is still better off on [electron/electron](https://github.com/electron/electron). For mobile-first, pixel-identical UI, [flutter/flutter](https://github.com/flutter/flutter) is the other shelf.
