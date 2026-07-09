---
github_url: https://github.com/sveltejs/kit
full_name: sveltejs/kit
category: web-app
tags: [framework, ssr, svelte, javascript]
stars: 19600
language: JavaScript
last_github_push: 2026-07-04
last_checked: 2026-07-08
status: active
source: manual
added_date: 2026-06-23
---

# kit

Full-stack Svelte framework — filesystem routing, SSR/SSG, adapters for every platform.

## Setup

```bash
npx sv create my-app
cd my-app && npm install && npm run dev
```

- The `sv` CLI scaffolds SvelteKit; pick `adapter-static` in the prompts for a pure SSG/SPA build.

## Personal Notes

- Default choice for content-heavy sites; pairs with Svelte 5 runes cleanly since v2.
- `adapter-static` + form actions covers most small-business sites with almost no JS shipped.
