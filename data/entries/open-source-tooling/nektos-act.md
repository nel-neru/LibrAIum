---
github_url: https://github.com/nektos/act
full_name: nektos/act
category: open-source-tooling
tags: [github-actions, ci-cd, containers, cli, go]
stars: 70991
language: Go
last_github_push: 2026-07-03
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# act

Runs GitHub Actions workflows locally in Docker containers — `act push` replays the event against `.github/workflows/` in seconds instead of a commit/push/wait cycle. Maps runner labels to container images so the same YAML works locally and on GitHub.

## Setup

```bash
brew install act    # or: gh extension install nektos/gh-act
act -l              # list jobs; `act push` replays the push event
```

- Needs a running Docker daemon; first run prompts for a runner-image size (medium is the sane default).

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The most-reacted items on the tracker are all early parity gaps with hosted GitHub Actions runners that have since shipped and closed — Actions v2 support ([nektos/act#74](https://github.com/nektos/act/issues/74), 221👍), working services ([#173](https://github.com/nektos/act/issues/173), 130👍), composite actions ([#339](https://github.com/nektos/act/issues/339), 73👍), and artifact support ([#169](https://github.com/nektos/act/issues/169), 70👍) — so most historic complaints reflect a tool that has closed the gap rather than open pain.
- The loudest still-open request is Podman as an alternative to the Docker daemon ([#303](https://github.com/nektos/act/issues/303), 61👍), signalling friction for users who don't run Docker.
- Maintenance looks steady and mature: 20 tagged releases at a ~31-day median interval, most recently 2026-06-01, though the tracker still carries a sizeable backlog (~344 open issues/PRs).
- No adopters are named in the README (limited public signal on named users).
