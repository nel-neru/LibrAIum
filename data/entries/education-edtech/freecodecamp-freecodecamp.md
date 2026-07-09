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
reception_gathered: 2026-07-09
---

# freeCodeCamp

The complete codebase and curriculum behind freecodecamp.org — a pnpm + Turborepo TypeScript monorepo with a Fastify/Prisma/MongoDB API, a Gatsby/React client, and every lesson stored as structured Markdown with embedded tests. The most-starred repository on GitHub, and a rare case of a production learning platform developed fully in the open rather than a link collection.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The loudest community pressure is over curriculum coverage, not the platform code — the most-reacted issue on the tracker is a request to add Vue.js 3 to the Front End Development Libraries section ([freeCodeCamp/freeCodeCamp#50843](https://github.com/freeCodeCamp/freeCodeCamp/issues/50843), 348👍), since closed.
- Editor friction and lesson-clarity gaps recur: a randomly-jumping cursor in the code editor ([#7847](https://github.com/freeCodeCamp/freeCodeCamp/issues/7847), 53👍), plus a cluster of "instructions need clarification" and failing-challenge-test reports (e.g. [#6657](https://github.com/freeCodeCamp/freeCodeCamp/issues/6657), 38👍; [#17944](https://github.com/freeCodeCamp/freeCodeCamp/issues/17944), 21👍) — all now closed.
- Maintenance runs through the changelog rather than tags: there are no tagged GitHub releases and a ~221-item open issue/PR backlog, so track the repo directly instead of a release version.
- The README lists no external adopters, so there is limited public signal on downstream reuse (unsurprising for a single-destination learning platform rather than a library).
