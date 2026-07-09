---
github_url: https://github.com/OpenBB-finance/OpenBB
full_name: OpenBB-finance/OpenBB
category: finance-trading
tags: [market-data, python, cli, mcp-server]
stars: 70325
language: Python
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# OpenBB

Open-source investment research platform: one Python interface over 30+ market-data providers — equities, options, crypto, macro — with standardized schemas and pandas output. The open Platform is the data layer; the Workspace UI on top is proprietary.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The loudest still-open request on the tracker is broker/execution integration — a call to add Interactive Brokers support ([OpenBB-finance/OpenBB#343](https://github.com/OpenBB-finance/OpenBB/issues/343), 11👍) — pointing to a gap between the data-layer focus and users who want order routing alongside research.
- The most-reacted issues otherwise cluster around early installation and dependency friction, especially on macOS: a `sentencepiece` wheel that wouldn't resolve ([#34](https://github.com/OpenBB-finance/OpenBB/issues/34), 11👍), `scipy` version pinning ([#25](https://github.com/OpenBB-finance/OpenBB/issues/25)), and several macOS setup threads ([#21](https://github.com/OpenBB-finance/OpenBB/issues/21), [#42](https://github.com/OpenBB-finance/OpenBB/issues/42), [#70](https://github.com/OpenBB-finance/OpenBB/issues/70)) — all now closed.
- Actively maintained with a steady release rhythm: 20 tagged releases at a ~28-day median cadence (latest 2026-04-25) against a moderate ~71 open issues/PRs.
- No adopters are named in the README, so third-party adoption is limited public signal.
