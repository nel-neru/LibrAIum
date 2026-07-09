---
github_url: https://github.com/casey/just
full_name: casey/just
category: devops-infra
tags: [task-runner, cli, rust, developer-experience]
stars: 26100
language: Rust
last_github_push: 2026-07-02
last_checked: 2026-07-08
status: active
source: manual
added_date: 2026-06-24
reception_gathered: 2026-07-09
---

# just

A command runner — like make, but without the build-system baggage. Cross-platform, great error messages.

## Setup

```bash
brew install just    # or: cargo install just
just --list          # in a repo with a justfile
```

- Drop a `justfile` at the repo root; recipes are invoked as `just <recipe>`.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- Most of the tracker's loudest feature requests have already shipped and closed: parallel task execution ([casey/just#626](https://github.com/casey/just/issues/626), 83👍), files-as-dependencies ([#867](https://github.com/casey/just/issues/867), 74👍), and per-recipe flags/options ([#476](https://github.com/casey/just/issues/476), 66👍) are all resolved, indicating requests tend to get absorbed rather than languish.
- The loudest still-open threads are the module-system improvement tracking issue ([#2252](https://github.com/casey/just/issues/2252), 57👍) and a long-running debate over which config-file format to standardize on ([#395](https://github.com/casey/just/issues/395), 47👍).
- Maintenance is very active: 20 tagged releases at a median gap of ~8 days (latest 2026-06-30), against a backlog of ~177 open issues/PRs.
- No production adopters are listed in the README, so there is limited public signal on named large-scale users.

## Personal Notes

- Adopted in every new repo: a `justfile` beats a README full of copy-paste commands.
- Recipes can be written in any language via shebangs — handy for mixed Rust/Node projects like LibrAIum.
