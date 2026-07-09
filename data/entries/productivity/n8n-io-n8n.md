---
github_url: https://github.com/n8n-io/n8n
full_name: n8n-io/n8n
category: productivity
tags: [workflow-orchestration, low-code, self-hosted, typescript]
stars: 195689
language: TypeScript
last_github_push: 2026-07-08
last_checked: 2026-07-09
status: active
source: manual
added_date: 2026-07-09
---

# n8n

Fair-code workflow automation platform — a visual node canvas with escape hatches to real JavaScript/Python code, 400+ integrations, and native AI-agent/LangChain nodes. Self-hosts from a single Docker container or `npx n8n`.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The "fair-code" licensing is the loudest point of contention by a wide margin — the top-reacted issue on the tracker disputes the open-source framing outright ([n8n-io/n8n#40](https://github.com/n8n-io/n8n/issues/40), 267👍, since closed), so evaluate the license before self-hosting rather than assuming OSI-standard terms.
- The AI-agent nodes draw a distinct cluster of complaints: tool usages not persisted in agent memory ([#14361](https://github.com/n8n-io/n8n/issues/14361), 33👍, still open), lack of response streaming ([#11597](https://github.com/n8n-io/n8n/issues/11597), 31👍, closed), and a hard 5-minute AI-node timeout ([#11886](https://github.com/n8n-io/n8n/issues/11886), 17👍, closed).
- The HTTP Request node surfaces integration friction of its own — Bearer auth reportedly breaks with pagination ([#16005](https://github.com/n8n-io/n8n/issues/16005), 23👍, open).
- Very actively maintained but with a heavy backlog: the last 20 tracked releases land at a median gap of roughly zero days (often several a day, latest 2026-07-08), against ~1,455 open issues and PRs. No adopters are listed in the README.
