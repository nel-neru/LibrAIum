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

## Personal Notes

- The reference point for any retention-based learning product — before writing a scheduler, read rslib's FSRS integration; `pip install anki` gives you the same headless backend for scripting collections and generating decks without the GUI.
- License is AGPL-3.0-or-later, so embedding rslib/pylib in a closed product is off the table — interoperate via `.apkg` files or the AnkiConnect add-on instead.
- Self-hosted sync server is built in since 2.1.57 (`SYNC_USER1=user:pass anki --syncserver`), but it speaks plain HTTP — front it with a TLS reverse proxy, and keep client and server versions in lockstep or sync stops working.
- The add-on API (aqt) has no stability guarantee — add-ons routinely break across releases, so pin the Anki version when a workflow depends on them.
