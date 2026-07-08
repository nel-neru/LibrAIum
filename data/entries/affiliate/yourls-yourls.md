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

## Personal Notes

- Reach for it when cloaked affiliate links on your own domain matter more than dashboards — you own the click history outright, and swapping a dead offer is a one-field edit instead of republishing content.
- Click-tracking gotcha: redirects are hardcoded 301 (`yourls_redirect_shorturl`), so browsers cache them and repeat clicks go uncounted. Swap to 302/307 via a plugin on the `redirect_code` filter when accurate counts matter more than the permanent-redirect SEO signal.
- Auth is username/password pairs in `config.php` — no roles, no per-user link ownership. Fine solo; the wrong tool for handing dashboards to a team or clients. Also budget for the log table: one row per click, so prune it or stats pages crawl at high volume.
- Needs PHP 8.1+ and MySQL (1.10.x); most affiliate workflow lives in community plugins, so vet them — quality varies widely. Pairs well with [gohugoio/hugo](https://github.com/gohugoio/hugo): point a content site's outbound links at your YOURLS domain and link edits never trigger a rebuild.
