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

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The loudest reaction on the tracker was to a breaking removal — dropping the built-in `eth_compilers` / `eth_compileSolidity` RPC endpoints in the 1.6.0 release ([ethereum/go-ethereum#3793](https://github.com/ethereum/go-ethereum/issues/3793), 88👍, since closed).
- The Go-library surface drew recurring ergonomics requests, both eventually closed: bundling transaction receipts into block queries ([#17044](https://github.com/ethereum/go-ethereum/issues/17044), 52👍) and event support in the abigen-generated bindings ([#2792](https://github.com/ethereum/go-ethereum/issues/2792), 23👍).
- Operators pushed on maintenance policy — a request for an LTS or stable branch ([#21937](https://github.com/ethereum/go-ethereum/issues/21937), 22👍) — and on mempool fairness, where random ordering of equally-priced transactions was flagged as incentivising competitive spam ([#21350](https://github.com/ethereum/go-ethereum/issues/21350), 40👍); both are closed.
- Actively maintained on a fast release train — 20 tagged releases at a ~20-day median cadence, latest 2026-06-22 — against a ~380-item open issue/PR backlog.
