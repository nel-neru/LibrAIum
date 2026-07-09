---
github_url: https://github.com/acme/reception-demo
full_name: acme/reception-demo
category: fixture-reception
tags: [reception, third-party-signal, fixture]
stars: 4242
language: Go
last_github_push: 2026-07-06
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# reception-demo

Fixture pinning the `## Reception` body section (third-party, attributive) alongside an
optional `## Personal Notes` section, so the dual Rust/Node parsers keep agreeing on
entry bodies that carry the new content layer.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- Issues frequently cite slow cold-start on large inputs — the most-upvoted open issue
  asks for streaming ingestion ([acme/reception-demo#412](https://github.com/acme/reception-demo/issues/412)).
- Adopters include [example-org/thing](https://github.com/example-org/thing), which cites
  it as its default pipeline backend.
- Teams commonly migrate to it from hand-rolled scripts for the built-in retries; pairs
  with [mega/tags-notes](https://github.com/mega/tags-notes) for storage.
- Maintenance signal is strong: tagged releases roughly monthly and an actively triaged
  tracker (limited public benchmarking — treat perf claims as version-specific).

## Personal Notes

- Optional firsthand layer, retained only where the owner has genuinely used the tool.
