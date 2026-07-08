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

## Personal Notes

- Reach for it when a SaaS needs referral/affiliate infrastructure end to end: per-click/lead/revenue-share rewards, dual-sided incentives, and payouts with tax-form handling (W-9/1099/W-8) instead of a spreadsheet.
- "Self-hosting" here means deploying your own instance onto Vercel + PlanetScale + Tinybird + Upstash + R2 — the official guide has no Docker path, so don't expect a docker-compose stack like classic shorteners.
- Open-core: AGPLv3 with a commercial `/ee` slice; on the hosted cloud, Partners is gated to the Business plan (~$75/mo) plus a 3–5% payout fee, and it's unclear how much of the payout rails works self-hosted — verify before committing.
- Overkill if you only need short links (a lighter dedicated shortener is far less operational surface); as a bonus it's a large production Next.js App Router codebase worth reading alongside [vercel/next.js](https://github.com/vercel/next.js).
