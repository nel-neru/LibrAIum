---
github_url: https://github.com/ethereum/go-ethereum
full_name: ethereum/go-ethereum
category: blockchain-web3
tags: [ethereum, evm, node-client, go]
stars: 51227
language: Go
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# go-ethereum

The Ethereum Foundation's Go execution client (geth) — the node software most of the ecosystem runs or forks (op-geth, BSC, Polygon's Bor all descend from it). Also the standard Go library for Ethereum: `ethclient` for JSON-RPC, `abigen` for type-safe contract bindings.

## Personal Notes

- Post-Merge, geth alone won't sync: pair it with a consensus client (Lighthouse, Prysm, Teku, ...) over the Engine API with a shared JWT secret. Same applies to private networks — the README points to Kurtosis for multi-node devnets now that a beacon chain is mandatory.
- Budget a 1TB+ fast NVMe SSD and 16GB RAM for a mainnet full node; snap sync is the default, and disk I/O — not CPU — decides whether sync takes hours or days.
- For quick contract iteration, a dev chain like Foundry's Anvil beats `geth --dev`; geth earns its keep as the node behind real deployments and as the Go library layer (abigen bindings + the simulated backend for Go tests).
- Two sharp edges: licensing is split (library is LGPL-3.0, everything under `cmd/` is GPL-3.0 — check before forking the binaries), and geth's supermajority share makes client diversity a real argument for running Reth/Nethermind/Besu if you stake.
