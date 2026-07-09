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
reception_gathered: 2026-07-09
---

# electron

Chromium and Node.js fused into one runtime for building cross-platform desktop apps with web tech — the framework VS Code, Slack, and Discord ship on. OpenJS Foundation project; each major version tracks a current Chromium.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The most-reacted thread on the tracker is a long-open proposal for a shared "runtime mode" ([electron/electron#673](https://github.com/electron/electron/issues/673), 536👍); another open pain point flags cache data being written to the `userData` dir instead of a dedicated cache dir ([#8124](https://github.com/electron/electron/issues/8124), 219👍), and an open request for a workspace API ([#5362](https://github.com/electron/electron/issues/5362), 174👍) also ranks among the top issues.
- Several of the highest-reacted feature asks have since shipped and closed: a macOS Touch Bar API ([#7781](https://github.com/electron/electron/issues/7781), 390👍), Node ES Modules support ([#21457](https://github.com/electron/electron/issues/21457), 378👍), and a Wayland build ([#10915](https://github.com/electron/electron/issues/10915), 291👍).
- Maintenance is heavy and continuous — 20 recent releases at a median 1-day interval (latest 2026-07-07), a near-daily train that tracks Chromium — against a large backlog of ~894 open issues and PRs.
