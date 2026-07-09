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

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- Code push / out-of-band updates is the single loudest request on the tracker — the top-reacted open issue asks for OTA hot-update delivery ([flutter/flutter#14330](https://github.com/flutter/flutter/issues/14330), 2039👍) and remains open.
- The web target draws recurring friction: SEO / indexability of Flutter web apps is a prominent open gap ([#46789](https://github.com/flutter/flutter/issues/46789), 886👍), while a heavily-backed request for true hot reload (not just hot restart) on web ([#53041](https://github.com/flutter/flutter/issues/53041), 1318👍) has since been addressed (issue closed).
- Several early developer-experience gaps have shipped and closed — wireless iOS debugging ([#15072](https://github.com/flutter/flutter/issues/15072), 1242👍), Homebrew installation ([#14050](https://github.com/flutter/flutter/issues/14050), 1015👍), and C/C++ plugin integration ([#7053](https://github.com/flutter/flutter/issues/7053), 980👍).
- Framework-scope and design-system direction stay live via umbrella issues to move the material/cupertino packages out of the SDK ([#101479](https://github.com/flutter/flutter/issues/101479), 1018👍) and to bring Material 3 Expressive to Flutter ([#168813](https://github.com/flutter/flutter/issues/168813), 792👍), both open.
- Actively developed (last push 2026-07-08) but carrying a very large backlog (~12,885 open issues and PRs); the sampled release history is thin (7 tagged releases, ~33-day median gap, latest 2024-01-11), so track the release channels rather than a single GitHub tag.
