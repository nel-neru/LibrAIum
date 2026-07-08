---
github_url: https://github.com/strapi/strapi
full_name: strapi/strapi
category: blog-content
tags: [headless-cms, self-hosted, typescript]
stars: 72629
language: TypeScript
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# strapi

Open-source headless CMS in Node/TypeScript — model content types in the admin panel and every one gets an auto-generated REST API (GraphQL via the official plugin). The standard self-hostable content backend for JAMstack blogs, running on SQLite for dev and PostgreSQL/MySQL/MariaDB in production.

## Personal Notes

- Default pick when a blog or content site needs a real editor UI decoupled from the frontend — pair it with [vercel/next.js](https://github.com/vercel/next.js) or [sveltejs/kit](https://github.com/sveltejs/kit) rendering the content; if there's no non-developer editor, a plain static site generator is less to run.
- It's a long-running Node service, not a git-based CMS: budget roughly 2 CPU / 4 GB RAM for production, and stay on top of upgrades — v5 shipped several CVEs through 2025–26 (SQL injection in the Content-Type Builder, rate-limit bypass), so self-hosting means owning the patch cadence.
- The v4→v5 migration is a real project: the Document Service replaced the Entity Service, REST responses were flattened (`documentId` instead of numeric ids), and community plugins lag — pin versions and test the API shape before upgrading.
- Core is MIT but SSO, audit logs, and review workflows sit behind paid tiers; MongoDB support is long gone (v3-era), and SQLite is dev-only — use Postgres from day one to avoid a data migration later.
