---
github_url: https://github.com/openai/swarm
full_name: openai/swarm
category: ai-agent
tags: [multi-agent, agent-loop-reasoning, python]
stars: 19800
language: Python
last_github_push: 2025-03-11
last_checked: 2026-07-08
status: stale
source: manual
added_date: 2026-06-22
---

# swarm

Educational framework for lightweight multi-agent orchestration — handoffs and routines.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases and adopter mentions;
     each claim carries its source. Last gathered: 2026-07-09. -->

- The tracker reflects the project's explicitly educational framing rather than production defects: the most-reacted open issue points users to a related "brother project," GPTSwarm ([openai/swarm#42](https://github.com/openai/swarm/issues/42), 15👍), while others question the design's minimalism ([#59](https://github.com/openai/swarm/issues/59)) or argue the OpenAI Assistants API is the better fit ([#45](https://github.com/openai/swarm/issues/45)).
- Provider portability is an open ask — support for Hugging Face and LangChain models beyond OpenAI ([#35](https://github.com/openai/swarm/issues/35)) — reinforcing that the framework is scoped to OpenAI's own APIs.
- Effectively frozen: no tagged GitHub releases, a last push of 2025-03-11, and ~38 open issues/PRs left unaddressed, so treat it as a reference to learn handoffs and routines from rather than an evolving dependency.

## Personal Notes

- Kept for the *handoff* pattern documentation — the idea survived even though the repo is dormant.
- Superseded in practice; use langgraph or the provider-native agent SDKs for real work.
