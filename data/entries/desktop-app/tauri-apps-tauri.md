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

## Setup

```bash
npm create tauri-app@latest
# then: cd <app> && npm install && npm run tauri dev
```

- Needs the Rust toolchain (`rustup`) plus your OS's webview deps (Linux: WebKitGTK).

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The loudest open request pushes back on Tauri's defining choice of rendering through the OS webview — it asks the project to bundle a Chromium renderer for cross-platform rendering consistency ([tauri-apps/tauri#14963](https://github.com/tauri-apps/tauri/issues/14963), 222👍).
- Linux webview packaging is a recurring friction point: the missing libwebkit2gtk-4.0 on Ubuntu 24 / Debian 13 drew 150 reactions ([#9662](https://github.com/tauri-apps/tauri/issues/9662), since closed), and type-safe IPC remains a high-demand gap via TypeScript codegen for Rust commands ([#1514](https://github.com/tauri-apps/tauri/issues/1514), 142👍).
- v2 resolved several of the tracker's biggest historical asks — Android/iOS support ([#3884](https://github.com/tauri-apps/tauri/issues/3884), 113👍; [#843](https://github.com/tauri-apps/tauri/issues/843), 134👍) and deep linking via custom URI schemes ([#323](https://github.com/tauri-apps/tauri/issues/323), 168👍) are now closed.
- Actively released (20 recent releases, latest 2026-07-01) but carrying a large backlog (~1,429 open issues including PRs); no adopters are listed in the README.
