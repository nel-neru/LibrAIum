---
github_url: https://github.com/godotengine/godot
full_name: godotengine/godot
category: game-dev
tags: [game-engine, cross-platform, gdscript, cpp]
stars: 113766
language: C++
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# godot

MIT-licensed 2D/3D game engine with its own full editor, a node/scene architecture, GDScript and C# scripting, and one-click export to desktop, mobile, and web. Community-governed under the nonprofit Godot Foundation — no royalties, no account, no runtime fees.

## Personal Notes

- The default pick for indie 2D and small-to-mid 3D: the editor is a single self-contained executable (no installer, no login) and it has a real 2D renderer, not a 3D scene with an orthographic camera. It is not the tool for AAA-scale open worlds, and console export requires a third-party porting partner (W4 Games et al.) — console SDKs can't ship in an MIT codebase.
- C# needs the separate .NET editor build plus a locally installed .NET SDK, and C# projects still cannot export to the web platform as of 4.7. GDScript is the path of least resistance and what most docs and tutorials assume.
- 3D physics: Jolt is bundled since 4.4 and the default for new projects, but projects started on older versions keep Godot Physics — switch Project Settings > Physics > 3D > Physics Engine to Jolt before debugging jitter, and check joint soft-limit behavior when migrating.
- Minor 4.x releases move fast (4.7 stable landed 2026-06) and can rename APIs or change renderer behavior; pin the editor version per project and read the migration notes before bumping. The 3.x line is legacy — start anything new on 4.x.
