---
github_url: https://github.com/freqtrade/freqtrade
full_name: freqtrade/freqtrade
category: finance-trading
tags: [trading-bot, backtesting, machine-learning, self-hosted, python]
stars: 52176
language: Python
last_github_push: 2026-07-07
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# freqtrade

Open-source crypto trading bot in Python — strategies are pandas code, with built-in backtesting, hyperopt parameter search, FreqAI machine-learning models, and control via Telegram or the FreqUI web interface. Trades spot and futures on the major CCXT exchanges (Binance, Kraken, OKX, Bybit, Gate) and is the de facto starting point for building an algo-trading bot.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The loudest historical demand on the tracker was short-selling and richer position management — the top-reacted issue asked for a short option ([freqtrade/freqtrade#892](https://github.com/freqtrade/freqtrade/issues/892), 31👍), backed by a strategy-interface discussion for shorts and position management ([#2183](https://github.com/freqtrade/freqtrade/issues/2183), 15👍) and a position-stacking/pyramiding request ([#1519](https://github.com/freqtrade/freqtrade/issues/1519), 13👍); all are now closed, consistent with the futures/short support the summary describes.
- Remaining open requests center on backtesting realism and exchange-side order types — Monte Carlo backtesting ([#2821](https://github.com/freqtrade/freqtrade/issues/2821), 10👍) and exchange-native take-profit orders on Binance ([#7499](https://github.com/freqtrade/freqtrade/issues/7499), 7👍) are still open.
- The ta-lib dependency has been a recurring friction point, with users asking to drop it ([#2509](https://github.com/freqtrade/freqtrade/issues/2509), 6👍, closed).
- Actively maintained with a steady release rhythm — 20 tagged releases at a ~29-day median interval (latest 2026-06-29) and a small open-issue backlog (43 open including PRs); no adopters are listed in the README.
