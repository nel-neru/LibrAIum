---
github_url: https://github.com/flutter/flutter
full_name: flutter/flutter
category: mobile-app
tags: [framework, cross-platform, mobile, dart]
stars: 177669
language: Dart
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# flutter

Google's cross-platform UI toolkit — one Dart codebase compiles to native ARM for iOS/Android, with web and desktop as additional targets. It renders every pixel itself via the Impeller engine instead of wrapping native widgets, so UIs look identical on both platforms.

## Personal Notes

- The default pick when one team ships iOS + Android and pixel-identical UI matters more than a native feel; stateful hot reload keeps the iterate loop tight.
- Owning the pixels cuts both ways: Cupertino widgets lag Apple's real design updates, and any OS API without a good plugin means writing platform channels or FFI yourself — vet plugin quality before committing.
- Treat web as a secondary target: canvas rendering means no DOM, so SEO and screen readers suffer, and a minimal app is ~1.5 MB gzipped before your code. For web-first work reach for [sveltejs/kit](https://github.com/sveltejs/kit) instead.
- State management is famously fragmented (provider / riverpod / bloc) — settle on one per project up front or reviews turn into style debates.
