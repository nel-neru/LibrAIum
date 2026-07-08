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

## Personal Notes

- The default micro image is deliberately bare; most real workflows need `-P ubuntu-latest=catthehacker/ubuntu:act-latest` (put it in `.actrc`). The `full-*` parity images work but cost tens of GB of disk.
- Nothing injects `GITHUB_TOKEN` locally — pass `-s GITHUB_TOKEN="$(gh auth token)"`; gate act-only divergence with `if: ${{ !env.ACT }}` steps.
- Linux containers only: macOS/Windows jobs and anything needing systemd won't run faithfully. On Apple Silicon, add `--container-architecture linux/amd64`.
- Keep workflow steps thin by delegating to [casey/just](https://github.com/casey/just) recipes — then act only has to reproduce the runner, not the logic.
