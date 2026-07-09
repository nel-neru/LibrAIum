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

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- Built-in i18n is the single loudest gap on the tracker — the top-reacted open issue is an i18n brainstorming thread ([sveltejs/kit#553](https://github.com/sveltejs/kit/issues/553), 406👍), reinforced by a separate translations request ([#1274](https://github.com/sveltejs/kit/issues/1274), 193👍).
- Native WebSocket support is a long-standing high-demand request ([#1491](https://github.com/sveltejs/kit/issues/1491), 388👍), alongside a push to treat layout pages like components with named slots ([#627](https://github.com/sveltejs/kit/issues/627), 385👍).
- Rendering-model feature gaps recur across the tracker: incremental static regeneration ([#661](https://github.com/sveltejs/kit/issues/661), 183👍), sitemap generation ([#1142](https://github.com/sveltejs/kit/issues/1142), 141👍), and partial hydration ([#1390](https://github.com/sveltejs/kit/issues/1390), 133👍).
- Actively maintained with a fast release cadence (20 tagged releases, latest 2026-07-08) but carrying a large backlog (~939 open issues and PRs); the "Help getting to 1.0" milestone thread is now closed ([#2100](https://github.com/sveltejs/kit/issues/2100), 287👍). The README lists no adopters.

## Personal Notes

- Default choice for content-heavy sites; pairs with Svelte 5 runes cleanly since v2.
- `adapter-static` + form actions covers most small-business sites with almost no JS shipped.
