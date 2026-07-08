---
github_url: https://github.com/react/react-native
full_name: react/react-native
category: mobile-app
tags: [framework, cross-platform, mobile, react, javascript]
stars: 126168
language: C++
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# react-native

Framework for building native iOS and Android apps with React — JavaScript drives real platform views, not a webview. Meta-born and now React Foundation-owned (the repo moved from facebook/ to the react org in early 2026), it remains the default JavaScript route to native mobile.

## Personal Notes

- Start new apps through Expo (`npx create-expo-app`) — the official docs steer you to a framework and the CLI lives outside core now. A bare project means owning Xcode/Gradle churn on every 0.x bump; Expo prebuild makes upgrades far cheaper than the Upgrade Helper diff dance.
- The New Architecture (Fabric + TurboModules) has been the default since 0.76 and the legacy bridge is being removed — vet every third-party native module for new-arch support before committing; that is where migrations stall.
- Choose it over [flutter/flutter](https://github.com/flutter/flutter) when a native platform feel and shared React skills matter — a team already running [vercel/next.js](https://github.com/vercel/next.js) on the web reuses components, patterns, and hiring pools directly. Flutter wins when pixel-identical UI across platforms is the goal.
- Don't be thrown by GitHub reporting the language as C++ — that's the core; app code stays TypeScript. Minimum targets are iOS 15.1 / Android 7.0 (API 24), and building for iOS still requires macOS.
