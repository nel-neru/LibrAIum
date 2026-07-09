---
github_url: https://github.com/bevyengine/bevy
full_name: bevyengine/bevy
category: game-dev
tags: [game-engine, ecs, rust, cross-platform]
stars: 47066
language: Rust
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# bevy

Data-driven game engine in Rust built around a fast parallel ECS, with a wgpu renderer and a plugin architecture where the engine's own features are themselves plugins. Targets Windows/macOS/Linux plus Web, iOS and Android from one codebase.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- A first-party editor is the single loudest ask on the tracker by a wide margin — the top-reacted issue requests a Bevy Editor ([bevyengine/bevy#85](https://github.com/bevyengine/bevy/issues/85), 587👍) and is still open, alongside a related Editor-Ready UI request ([#254](https://github.com/bevyengine/bevy/issues/254), 221👍, since closed).
- Cross-platform reach was an early high-demand theme that has largely shipped: Web Support ([#88](https://github.com/bevyengine/bevy/issues/88), 259👍) and Android Support ([#86](https://github.com/bevyengine/bevy/issues/86), 152👍) are both closed, as is the much-requested entity-entity relations feature ([#3742](https://github.com/bevyengine/bevy/issues/3742), 100👍).
- Remaining open requests cluster around runtime and rendering gaps — frame-rate limiting ([#1343](https://github.com/bevyengine/bevy/issues/1343), 95👍) and OpenXR/VR rendering ([#115](https://github.com/bevyengine/bevy/issues/115), 89👍) are both still open.
- Actively developed on a rapid release cadence (20 tagged releases, latest 2026-06-18, ~11 days between releases at the median), but carrying a very large backlog (~3,305 open issues incl. PRs), so expect frequent churn rather than long-stable APIs.
