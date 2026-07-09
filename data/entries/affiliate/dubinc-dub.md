---
github_url: https://github.com/dubinc/dub
full_name: dubinc/dub
category: affiliate
tags: [affiliate-marketing, link-shortener, analytics, self-hosted, typescript]
stars: 23941
language: TypeScript
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# dub

Open-source link attribution platform — short links with conversion tracking, plus a Partners layer for running affiliate programs with flexible rewards and payouts. The closest thing to an open-source Rewardful/PartnerStack, built on Next.js + Prisma with Tinybird (ClickHouse) for click analytics.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues; each claim carries its source. Last gathered: 2026-07-09. -->

- Docker / self-hosting is the loudest request on the tracker by a wide margin — the top-reacted open issue asks for a Docker self-host path ([dubinc/dub#25](https://github.com/dubinc/dub/issues/25), 102👍), reinforced by a Dockerfile request ([#378](https://github.com/dubinc/dub/issues/378)) and a self-hosting metathread ([#161](https://github.com/dubinc/dub/issues/161)). The supported path leans on managed services (Vercel/PlanetScale/Tinybird), not a docker-compose stack.
- Dependence on external managed services is itself a friction point — [#598](https://github.com/dubinc/dub/issues/598) asks to eliminate the external-service dependency for self-hosters.
- A public REST API was an early high-demand gap ([#73](https://github.com/dubinc/dub/issues/73), 20👍) that has since shipped (issue closed) — links and analytics are now exposed as APIs.
- Actively developed but with a large backlog (~148 open issues) and no tagged GitHub releases, so track the changelog / pin a commit rather than a release tag.
