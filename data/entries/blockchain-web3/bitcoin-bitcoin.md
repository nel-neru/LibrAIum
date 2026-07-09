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
reception_gathered: 2026-07-09
---

# bitcoin

The reference implementation of the Bitcoin protocol — a full node that downloads and validates every block and transaction on the P2P network, with an optional wallet and GUI. Consensus behavior is defined by this codebase rather than any spec, making it the ground truth for the whole ecosystem.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The most-reacted issues on the tracker are recurring "release schedule" coordination threads (e.g. [bitcoin/bitcoin#17432](https://github.com/bitcoin/bitcoin/issues/17432), 72👍; [#20851](https://github.com/bitcoin/bitcoin/issues/20851), 68👍; [#32275](https://github.com/bitcoin/bitcoin/issues/32275), 67👍), so the top of the list reflects how closely the ecosystem tracks each version rather than open defects.
- The loudest policy dispute concerns arbitrary data in witness scripts — "Witness scripts being abused to bypass datacarriersize limit (CVE-2023-50428)" drew 49👍 ([#29187](https://github.com/bitcoin/bitcoin/issues/29187)) — alongside a debate over removing legacy message signing ([#27515](https://github.com/bitcoin/bitcoin/issues/27515), 46👍); both are now closed.
- Maintenance is steady and mature: 20 tagged releases at a ~38-day median interval (latest 2026-07-08), against a large review surface (~681 open issues including PRs). No adopters are listed in the README.
