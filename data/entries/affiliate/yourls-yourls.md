---
github_url: https://github.com/YOURLS/YOURLS
full_name: YOURLS/YOURLS
category: affiliate
tags: [link-shortener, analytics, self-hosted, php]
stars: 12107
language: PHP
last_github_push: 2026-07-06
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# YOURLS

Self-hosted URL shortener in PHP + MySQL that keeps every short link and its click log on your own server. The long-standing backbone for affiliate link cloaking — branded short domains, per-link click/referrer/geo stats, and a plugin ecosystem covering redirect codes, expiry, and A/B rotation.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases; each claim carries its source. Last gathered: 2026-07-09. -->

- Mature but slow-moving: 20 tagged releases at a ~164-day median gap (latest 2026-05-23) over a small ~50-issue backlog — a stable, lightly-maintained project rather than a fast-evolving one.
- Multi-user / access control is the community's long-standing ask — the "user management" wishlist thread ([YOURLS/YOURLS#1255](https://github.com/YOURLS/YOURLS/issues/1255)) has stayed open for years, confirming it stays single-admin by design.
- Scale caveats surface on the tracker: `YOURLS_UNIQUE_URLS` "slows down large instances" ([#3793](https://github.com/YOURLS/YOURLS/issues/3793)) and pruning old redirect/click rows is a recurring request ([#2123](https://github.com/YOURLS/YOURLS/issues/2123)) — plan for click-log growth at volume.
- Firmly MySQL/PDO + PHP: PostgreSQL support ([#2487](https://github.com/YOURLS/YOURLS/issues/2487)) and a front-end rewrite ([#1618](https://github.com/YOURLS/YOURLS/issues/1618)) are requested but unshipped.
