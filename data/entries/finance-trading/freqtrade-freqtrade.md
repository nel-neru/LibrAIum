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

## Personal Notes

- The default choice when starting a trading bot — but begin in dry-run and stay there longer than feels necessary; the project's own docs say backtesting never replaces dry-run.
- Backtests assume zero slippage and guess intra-candle ordering (exit signal → stoploss → ROI → trailing stop), so results flatter the strategy; run the built-in `lookahead-analysis` / `recursive-analysis` and `--timeframe-detail` before trusting numbers, and use static pairlists for reproducibility.
- FreqAI is a genuine differentiator: self-retraining models on live data with scikit-learn, XGBoost/LightGBM/CatBoost, reinforcement learning, or [pytorch/pytorch](https://github.com/pytorch/pytorch) backends — but it can't be combined with dynamic VolumePairlists (needs all training data up front).
- Setup friction is the TA-Lib native dependency (Python 3.11+ required); the official Docker image sidesteps the whole build.
