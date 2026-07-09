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

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- Multi-account support is the loudest open request by a wide margin — a long-standing issue asking to allow multiple account credentials leads the tracker ([cli/cli#326](https://github.com/cli/cli/issues/326), 496👍) and remains open.
- Packaging and auth friction recur in the top issues: an expired GPG key blocking install/update is still open ([#9569](https://github.com/cli/cli/issues/9569), 196👍), while earlier pain around SAML-enforced access was addressed with docs ([#2661](https://github.com/cli/cli/issues/2661), 233👍, closed) and GitHub Enterprise support has since shipped ([#273](https://github.com/cli/cli/issues/273), 301👍, closed).
- Several PR/workflow ergonomics remain open feature requests — a default push target for `pr create` ([#1718](https://github.com/cli/cli/issues/1718), 176👍), reading notifications ([#659](https://github.com/cli/cli/issues/659), 171👍), and `gh pr push` ([#2189](https://github.com/cli/cli/issues/2189), 159👍).
- Maintenance is steady: 20 releases at a ~14-day median cadence (latest 2026-07-02), against a large backlog of ~1,033 open issues and PRs.
- No adopters are named in the README, so downstream-usage signal is limited beyond the issue tracker.
