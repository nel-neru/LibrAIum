---
github_url: https://github.com/hashicorp/vault
full_name: hashicorp/vault
category: security
tags: [secrets-management, encryption, self-hosted, go]
stars: 35896
language: Go
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# vault

Identity-based secrets management — short-lived dynamic credentials for databases and clouds, encryption as a service via the transit engine, and lease-based automatic revocation. Ships as a single Go binary with integrated Raft storage, so HA no longer needs an external Consul cluster.

## Personal Notes

- The reach-for once a team outgrows `.env` files and per-cloud secret stores — dynamic DB/AWS credentials that auto-revoke on lease expiry are the killer feature over static-key vaults. Heavy for small projects, though; day-2 ops (policies, upgrades, audit devices) are a real cost, and a managed cloud secret manager often covers plain KV needs.
- Biggest operational gotcha: restarts leave Vault sealed. Configure auto-unseal against a cloud KMS from day one, or someone is hand-entering Shamir key shares at 3am.
- License is BUSL 1.1 since 1.15 (now under IBM) — no longer OSI open source. If that matters, OpenBao is the Linux Foundation MPL fork; drift is still modest but growing.
- On [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes), inject secrets via the Agent Injector or Vault Secrets Operator rather than wiring tokens by hand. Note the 2.0 line (2026-04) breaks unauthenticated rekey automation and drops mlock in containers — set `disable_mlock = true` before upgrading.
