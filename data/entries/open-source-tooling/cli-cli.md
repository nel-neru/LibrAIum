---
github_url: https://github.com/cli/cli
full_name: cli/cli
category: open-source-tooling
tags: [cli, github, go, developer-experience]
stars: 45177
language: Go
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# cli

GitHub's official CLI (`gh`) — PRs, issues, releases, and Actions runs from the terminal, with `gh api` reaching any REST or GraphQL endpoint the porcelain commands don't cover. Single Go binary for macOS/Linux/Windows; works against GitHub.com and Enterprise Server 2.20+.

## Setup

```bash
brew install gh    # or see cli.github.com for apt/dnf/winget
gh auth login
```

- `gh auth token` prints a token for scripting; `gh api repos/<owner>/<repo>` reaches the raw API.

## Personal Notes

- The scripting backbone for repo automation: human-oriented output isn't stable across versions, so scripts should go through `--json ... --jq` (or `--template`), and `gh api --paginate` fills every gap the subcommands leave.
- In CI it's preinstalled on Actions runners — just export `GH_TOKEN` — but the built-in `GITHUB_TOKEN` won't trigger downstream workflows, so release automation that must kick off other pipelines needs a PAT or GitHub App token.
- `gh extension install` makes it a platform (any repo named `gh-*` becomes a subcommand), and `gh alias` covers the small stuff. Honest limit: GitHub-only by design — `glab` is the GitLab counterpart — and it superseded `hub` as a standalone tool rather than a git proxy.
- Wrap the team's repetitive invocations (`gh pr create --fill`, `gh release create` with assets) into [casey/just](https://github.com/casey/just) recipes so the flags live in the repo, not in shell history.
