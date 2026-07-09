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
reception_gathered: 2026-07-09
---

# vault

Identity-based secrets management — short-lived dynamic credentials for databases and clouds, encryption as a service via the transit engine, and lease-based automatic revocation. Ships as a single Go binary with integrated Raft storage, so HA no longer needs an external Consul cluster.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The two loudest open requests are long-standing auth and usability gaps: Yubikey as an auth backend ([hashicorp/vault#131](https://github.com/hashicorp/vault/issues/131), 210👍) and recursive key listing in the KV engine ([#5275](https://github.com/hashicorp/vault/issues/5275), 201👍).
- Permission introspection and operations docs are recurring open asks — listing every secret path a user is authorized to view ([#5362](https://github.com/hashicorp/vault/issues/5362), 106👍) and documentation for backup and restore ([#5683](https://github.com/hashicorp/vault/issues/5683), 93👍) both remain unresolved.
- Several heavily-upvoted requests have since shipped and are closed: Kubernetes secrets syncing ([#7364](https://github.com/hashicorp/vault/issues/7364), 114👍) and a Let's Encrypt / ACME secret engine ([#4950](https://github.com/hashicorp/vault/issues/4950), 102👍).
- Maintenance is steady — 20 tracked releases at a median of 15 days apart, latest 2026-06-17 — though the tracker carries a large backlog (~1,523 open issues and PRs).
