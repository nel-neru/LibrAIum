---
github_url: https://github.com/bitcoin/bitcoin
full_name: bitcoin/bitcoin
category: blockchain-web3
tags: [blockchain, bitcoin, node-client, self-hosted, cpp]
stars: 89620
language: C++
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# bitcoin

The reference implementation of the Bitcoin protocol — a full node that downloads and validates every block and transaction on the P2P network, with an optional wallet and GUI. Consensus behavior is defined by this codebase rather than any spec, making it the ground truth for the whole ecosystem.

## Personal Notes

- Reach for it when you need a trust-nothing view of the chain or a backend for Bitcoin apps: it's a daemon you talk to over JSON-RPC (`bitcoin-cli`), REST, and ZMQ block/tx notifications — not a linkable library (the libbitcoinkernel extraction is still in progress).
- Budget for initial block download: an archival node needs 650+ GB of disk and days of sync. `prune=550` cuts storage to a few GB if you don't need to serve historical blocks, and AssumeUTXO (`loadtxoutset`) shortcuts the sync itself.
- Two recent breaking changes to know: the build moved from Autotools to CMake in v29.0 (older build guides are obsolete), and v30.0 removed legacy BDB wallets outright — run `migratewallet` to the descriptor format before upgrading old nodes.
- Review culture is famously conservative — PRs routinely sit for months. The right trade-off for money software, but don't plan around a quick upstream fix; patch locally or track the release branch.
