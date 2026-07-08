---
github_url: https://github.com/electron/electron
full_name: electron/electron
category: desktop-app
tags: [framework, cross-platform, javascript]
stars: 121918
language: C++
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# electron

Chromium and Node.js fused into one runtime for building cross-platform desktop apps with web tech — the framework VS Code, Slack, and Discord ship on. OpenJS Foundation project; each major version tracks a current Chromium.

## Personal Notes

- The default when a web team needs a desktop app with full OS and Node access — packaging and auto-update are solved problems (electron-forge / electron-builder), and the renderer is plain Chromium, so any web stack drops in ([react/react](https://github.com/react/react) is the usual pick).
- The tradeoff is baked in: every app bundles its own Chromium + Node, so expect roughly 100 MB installers and hundreds of MB of RAM at idle across its processes. When footprint matters more than Node access, [tauri-apps/tauri](https://github.com/tauri-apps/tauri) (system webview + Rust core) is the lean alternative.
- Treat every renderer as untrusted web content: keep `contextIsolation: true` / `nodeIntegration: false` (the defaults) and expose only narrow IPC via a preload script's `contextBridge` — loading remote URLs into a privileged window is the classic Electron CVE pattern.
- A new major lands every 8 weeks (v43 as of mid-2026) and only the latest three stable majors get security fixes — skipping upgrades means shipping known Chromium CVEs, so put the treadmill in the maintenance budget.
