---
github_url: https://github.com/netdata/netdata
full_name: netdata/netdata
category: devops-infra
tags: [observability, self-hosted, alerting, go]
stars: 79556
language: Go
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# netdata

Zero-config, per-second observability agent for hosts and containers — one install gives auto-detected collectors, auto-generated dashboards, per-metric ML anomaly detection, and hundreds of stock alerts. Claims ~5% of one core / ~150MiB RAM per node, with a tiered on-disk engine (per-second → per-minute → per-hour) for retention.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The loudest open grievance is UI-related — a request to disable the redesigned UI sits among the top-reacted open issues ([netdata/netdata#15640](https://github.com/netdata/netdata/issues/15640), 33👍) — while a Kafka-monitoring request is the single most-reacted item still open ([#4819](https://github.com/netdata/netdata/issues/4819), 38👍).
- Most of the historically highest-voted asks have since shipped and been closed: Windows support ([#92](https://github.com/netdata/netdata/issues/92), 67👍), authentication ([#70](https://github.com/netdata/netdata/issues/70), 59👍), PostgreSQL collection ([#82](https://github.com/netdata/netdata/issues/82), 51👍), and configurable alerts ([#88](https://github.com/netdata/netdata/issues/88), 30👍).
- Actively maintained on a fast cadence — 20 tagged releases at a ~13-day median gap, latest 2026-04-27 — against a moderate backlog of ~357 open issues (incl. PRs).
