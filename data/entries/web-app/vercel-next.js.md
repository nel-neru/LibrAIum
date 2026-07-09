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
reception_gathered: 2026-07-09
---

# next.js

Full-stack React framework from Vercel — file-based App Router, React Server Components, and per-route static/dynamic/streamed rendering in one build. Since v16 Turbopack is the default bundler and caching is fully opt-in via Cache Components.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The one still-open complaint among the most-reacted issues is the App Router breaking Framer Motion's shared-layout animations ([vercel/next.js#49279](https://github.com/vercel/next.js/issues/49279), 329👍) — an App-Router migration rough edge that remains unresolved.
- Most of the tracker's top-reacted requests are historical and now closed — SSG improvements ([#9524](https://github.com/vercel/next.js/issues/9524), 1006👍), the "className did not match" hydration warning ([#7322](https://github.com/vercel/next.js/issues/7322), 780👍), transpiling node_modules ([#706](https://github.com/vercel/next.js/issues/706), 516👍), and first-class CSS support ([#8626](https://github.com/vercel/next.js/issues/8626), 356👍) — indicating the loudest early gaps have since shipped.
- Maintenance is intensely active: 20 recent releases at a median one-day cadence (latest 2026-07-08), consistent with a near-daily canary channel.
- The flip side of that pace is a very large tracker (~4,165 open issues and PRs), so pin exact versions and read the changelog rather than assume any single report reflects the current release.
