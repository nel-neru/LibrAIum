---
github_url: https://github.com/shadcn-ui/ui
full_name: shadcn-ui/ui
category: design-ui
tags: [component-library, design-system, tailwind, react, typescript]
stars: 118455
language: TypeScript
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# ui

Accessible React components you don't install but copy into your repo via a CLI — Base UI or Radix primitives styled with Tailwind, fully yours to edit. Doubles as a distribution platform: the registry format lets teams publish their own components, hooks, and blocks the same way.

## Personal Notes

- The default starting point for a React + Tailwind design system: unlike MUI or Ant there's no theme-API ceiling, because the escape hatch is editing the source you already own. Pairs naturally with [vercel/next.js](https://github.com/vercel/next.js) and [react/react](https://github.com/react/react).
- Vendored code cuts both ways: there is no `npm update` — upstream fixes arrive only when you re-run the CLI and diff against your customizations, so budget maintenance time for every component you copy.
- Since July 2026 `shadcn init` defaults to Base UI primitives (built by the ex-Radix team); Radix stays first-class via `-b radix` — pin that flag in non-interactive scripts/CI or new components will target a different primitive set than your existing ones. shadcn publishes a migration skill for coding agents that automates Radix-to-Base-UI moves component by component.
- Hard-coupled to Tailwind (v4) and its CSS-variable theming convention; if the stack is CSS Modules or styled-components, reach for a headless primitive library directly instead of fighting the styling layer.
