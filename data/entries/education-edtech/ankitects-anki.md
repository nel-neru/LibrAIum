---
github_url: https://github.com/ankitects/anki
full_name: ankitects/anki
category: education-edtech
tags: [spaced-repetition, rust, self-hosted, cross-platform]
stars: 29019
language: Rust
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# anki

The canonical open-source spaced-repetition flashcard system — a Rust core (rslib) under a PyQt desktop shell and TypeScript/Svelte screens, glued together with protobuf. Ships both a modified SM-2 scheduler and the ML-based FSRS algorithm (opt-in per deck preset since 23.10).

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- Making FSRS the default scheduler is the loudest open request on the tracker ([ankitects/anki#3616](https://github.com/ankitects/anki/issues/3616), 68👍); the earlier ask to integrate FSRS at all was itself high-demand and has since shipped ([#2443](https://github.com/ankitects/anki/issues/2443), 41👍, closed).
- Build and packaging friction recurs across the most-reacted issues — "Is Anki too hard to build?" ([#1378](https://github.com/ankitects/anki/issues/1378), 49👍), an offline installer request ([#4241](https://github.com/ankitects/anki/issues/4241), 37👍), a plea to lower the required glibc version ([#4167](https://github.com/ankitects/anki/issues/4167), 29👍), and a launcher GUI ([#4152](https://github.com/ankitects/anki/issues/4152), 18👍) — though all four are now closed.
- Actively maintained on a fast, regular cadence (20 recent releases at a ~14-day median interval, latest 2026-06-16) against a large backlog (~385 open issues including PRs).
- No adopters are named in the README, so third-party adoption signal here is limited to the issue tracker.
