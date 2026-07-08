---
github_url: https://github.com/gohugoio/hugo
full_name: gohugoio/hugo
category: blog-content
tags: [static-site-generator, go, markdown, cli]
stars: 88890
language: Go
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# hugo

Static site generator in Go, shipped as a single binary — renders thousands of Markdown pages in seconds with templating, image processing, and asset pipelines built in, no Node toolchain required. Still the default answer for blogs and docs sites, with the largest theme ecosystem of any SSG.

## Personal Notes

- Reach for it when the site is pure content: no `node_modules`, no dependency rot — a Hugo site untouched for years still builds from the same binary, and full rebuilds stay near-instant even at thousands of pages.
- Go templates are the real learning curve: the dot context (`.`) rebinds inside `range`/`with` blocks and template errors often point at the wrong file, so customizing a theme means reading its partials, not just its config.
- Pin the Hugo version in CI — it is still 0.x (v0.164.0 as of this check) and minor releases break themes. Also mind the edition matrix: LibSass in the extended edition was deprecated in v0.153.0, so Sass now wants a separate Dart Sass binary, and Hugo Modules need a Go toolchain — git submodules remain the lower-friction way to vendor themes.
- Zero JS by default cuts both ways: there is no hydration/islands story, so once a site drifts toward app-like interactivity, move to [sveltejs/kit](https://github.com/sveltejs/kit) with `adapter-static` or [vercel/next.js](https://github.com/vercel/next.js) instead of hand-wiring scripts.
