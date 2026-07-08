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

## Personal Notes

- The default answer to "a game, in Rust" — systems are plain functions with dependency injection via parameters, and swapping engine subsystems is genuinely easy because everything is a plugin.
- Pre-1.0 on purpose: a breaking release lands roughly every 3 months (0.19 shipped 2026-06). Budget a migration-guide pass per upgrade, and expect third-party plugins (physics, egui integrations) to lag each new version by weeks.
- Workflow is code-first — the official editor is still in the prototypes repo as of 0.19. If a mature scene editor matters today, [godotengine/godot](https://github.com/godotengine/godot) is the honest answer; Bevy compensates with asset hot-reloading out of the box.
- Iteration gotcha: enable the `dynamic_linking` cargo feature and a fast linker for debug builds, or Rust compile times dominate the edit-run loop.
