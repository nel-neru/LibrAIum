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

## Personal Notes

- The fastest answer to "what is this box doing right now" — you get per-second metrics before you'd finish writing a Prometheus scrape config. It complements rather than replaces a fleet-wide stack: it exports to Prometheus/InfluxDB/Graphite for long-term storage.
- Know the licensing split: the agent is GPLv3+, but the v2 dashboard UI is closed-source, served from a CDN, and nudges toward Netdata Cloud (optional, has a free tier). Anonymous telemetry is on by default — opt out at install time (`--disable-telemetry`) or via the `.opt-out-of-anonymous-statistics` file.
- Default retention is modest by design; for longer history or many nodes, stream children to a parent node instead of fattening every agent. The stock alarm set is extensive and can be noisy — expect to silence a handful early on.
- Newer releases ship an MCP server, so an agent's live metrics are queryable from Claude Code — same ecosystem as [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers).
