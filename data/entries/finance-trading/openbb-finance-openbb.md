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

## Personal Notes

- The free Bloomberg-substitute data layer: `pip install openbb`, one standardized call like `obb.equity.price.historical(provider="yfinance")`, swap `provider=` to change sources, `.to_df()` straight into pandas. Ignore Terminal-era tutorials — v4 rewrote everything, and the CLI is a separate `openbb-cli` package.
- Unified interface is not unified data: out of the box only keyless providers (yfinance, SEC, CBOE) answer, deeper fundamentals/news coverage (FMP, Intrinio, Benzinga) needs paid API keys, and returned fields still vary by provider despite the standard schema.
- License gotcha: MIT until May 2024, AGPL-3.0 since — the network-copyleft clause bites if it sits inside a hosted product (OpenBB sells a commercial license for that case).
- Ships a first-party `mcp_server` extension that exposes every endpoint as agent tools — the natural way to feed market data to agents, same ecosystem as [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers). It is a research/data layer, not a backtester or execution engine — bring your own.
