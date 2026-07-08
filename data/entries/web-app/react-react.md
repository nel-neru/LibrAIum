---
github_url: https://github.com/react/react
full_name: react/react
category: web-app
tags: [javascript, react, frontend]
stars: 246304
language: JavaScript
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# react

Declarative, component-based UI library for web (and native via React Native) — the de facto standard with the largest ecosystem of any frontend stack. Function components, hooks, and Server Components define the component model the rest of that ecosystem builds on.

## Personal Notes

- The safe default when ecosystem breadth and hiring pool matter — but don't start bare: Create React App is deprecated, and react.dev steers new projects to a framework (Next.js, React Router framework mode, Expo) or Vite for a plain SPA. Since the 2026 React Foundation move the repo lives at react/react; old facebook/react links redirect.
- React Compiler 1.0 (stable since Oct 2025) makes hand-written `useMemo`/`useCallback` mostly legacy in new code — but it silently skips components that violate the Rules of React, so keep `eslint-plugin-react-hooks` on to see what didn't get memoized.
- Server Components are the sharpest edge: the `"use client"` boundary is a genuine mental-model shift and plenty of third-party libraries are still client-only — budget real migration time on existing codebases.
- For content-heavy, low-interaction sites, [sveltejs/kit](https://github.com/sveltejs/kit) ships far less JavaScript; React earns its runtime weight when interaction density and ecosystem depth outrank bundle size.
