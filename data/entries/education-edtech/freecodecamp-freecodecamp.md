---
github_url: https://github.com/freeCodeCamp/freeCodeCamp
full_name: freeCodeCamp/freeCodeCamp
category: education-edtech
tags: [learning-platform, monorepo, typescript, react, markdown]
stars: 451299
language: TypeScript
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# freeCodeCamp

The complete codebase and curriculum behind freecodecamp.org — a pnpm + Turborepo TypeScript monorepo with a Fastify/Prisma/MongoDB API, a Gatsby/React client, and every lesson stored as structured Markdown with embedded tests. The most-starred repository on GitHub, and a rare case of a production learning platform developed fully in the open rather than a link collection.

## Personal Notes

- Read it as a reference architecture, not a product to fork: the curriculum-as-code format in `curriculum/challenges/` (YAML frontmatter plus `# --description--` / `# --seed--` / `# --solutions--` sections, tests in fenced code blocks) is a proven pattern to steal for any interactive-lesson tool, complete with helper scripts like `create-next-challenge` and per-block test runs (`FCC_BLOCK`, `FCC_SUPERBLOCK`).
- Local setup is heavy — Node 24 LTS, pnpm 10, a MongoDB 8 replica set via Docker Compose, and a mandatory `pnpm run seed` before first boot; the docs ask for 4+ cores / 8 GB RAM and recommend GitHub Codespaces as the fastest path. Budget for it before a first contribution.
- Not a white-label LMS: everything is wired to run freecodecamp.org specifically (Auth0, deploy pipeline), there is no supported self-host story, and the client is still Gatsby 5 + Redux — dated next to current [react/react](https://github.com/react/react) meta-frameworks, so treat the client as history and the API + curriculum layer as the part worth studying.
- The i18n approach scales surprisingly well: translations live in a separate i18n-curriculum submodule fed by Crowdin, with a `comments-to-not-translate.json` escape hatch — a good template if you ever need to localize technical content with embedded code.
