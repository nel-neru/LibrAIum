---
github_url: https://github.com/ant-design/ant-design
full_name: ant-design/ant-design
category: design-ui
tags: [react, typescript, component-library, design-system, frontend]
stars: 98609
language: TypeScript
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# ant-design

React component library and design system from Ant Group — 60+ components including the deepest enterprise widgets in the React ecosystem (Table, Form, DatePicker), token-based theming with dark/compact algorithms, and locale packs for dozens of languages. The v6 line (current, releasing roughly weekly) requires React 18+ and defaults to CSS-variables theming for cheap runtime theme switching.

## Personal Notes

- The fast path for admin panels and internal dashboards — Table, Form's rule-based validation, and the date pickers save weeks versus assembling headless primitives. The trade-off is the Ant look: token overrides go far, but a fully bespoke visual identity means styling internal DOM nodes, which the v6 migration guide explicitly flags as unstable across upgrades — for that use case, [shadcn-ui/ui](https://github.com/shadcn-ui/ui) is the better shelf-mate.
- v5 → v6 is deliberately smooth (no codemod; drop `@ant-design/v5-patch-for-react-19` — React 19 works natively now), but custom styles reaching into component internals are the main breakage source — audit those before upgrading.
- SSR with [vercel/next.js](https://github.com/vercel/next.js) App Router needs `@ant-design/nextjs-registry` in the root layout or you get a flash of unstyled components; dot-notation sub-components (`Select.Option`) also break under App Router — import them from their direct paths instead.
- React-only ([react/react](https://github.com/react/react) 18+; Vue/Svelte ports are separate community projects). Date components run on dayjs — moment has been gone since v5 — and i18n is a single `ConfigProvider` locale swap.
