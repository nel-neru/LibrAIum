---
github_url: https://github.com/vercel/next.js
full_name: vercel/next.js
category: web-app
tags: [framework, ssr, react, javascript]
stars: 140385
language: JavaScript
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# next.js

Full-stack React framework from Vercel — file-based App Router, React Server Components, and per-route static/dynamic/streamed rendering in one build. Since v16 Turbopack is the default bundler and caching is fully opt-in via Cache Components.

## Personal Notes

- Default pick when a project is React-first and needs SSR/SEO; for content-heavy sites where shipping minimal JS matters more than the React ecosystem, [sveltejs/kit](https://github.com/sveltejs/kit) is the leaner alternative.
- The caching model flipped in v16: everything is dynamic by default and you opt in with `use cache` — far saner than the implicit fetch caching of 13–14, but most tutorials and old codebases still assume the legacy behavior, so audit before upgrading.
- Self-hosting works (`output: "standalone"` + Docker) but is second-class next to Vercel: `use cache` is in-memory per instance, so multi-replica deployments need a remote cache handler or ISR/cache behavior diverges between pods.
- Don't gate auth solely in middleware — CVE-2025-29927 (the `x-middleware-subrequest` bypass) is the cautionary tale; enforce checks in route handlers too. Note `middleware.ts` is being renamed to `proxy.ts` in the v16 line.
