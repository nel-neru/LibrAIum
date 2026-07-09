---
github_url: https://github.com/langchain-ai/langgraph
full_name: langchain-ai/langgraph
category: ai-agent
tags: [agent-loop-reasoning, multi-agent, agent-memory, python]
stars: 17900
language: Python
last_github_push: 2026-07-06
last_checked: 2026-07-08
status: active
source: manual
added_date: 2026-06-25
reception_gathered: 2026-07-09
---

# langgraph

Graph-based agent orchestration: nodes are steps, edges are control flow, state is checkpointed. Human-in-the-loop and persistence built in.

## Reception

<!-- Third-party reception, not the owner's firsthand experience.
     Synthesized from public GitHub issues/releases; each claim carries its source. Last gathered: 2026-07-09. -->

- Fast-moving with a large surface: ~20 recent releases at a ~1-day median cadence and ~611 open issues — expect frequent updates and API churn, not a settled API.
- A v1 with breaking changes is in flight — the "v1 roadmap – feedback wanted" thread ([langchain-ai/langgraph#4973](https://github.com/langchain-ai/langgraph/issues/4973), 30👍) and the `config.configurable` → `context` migration ([#5023](https://github.com/langchain-ai/langgraph/issues/5023), 29👍) are the most-reacted issues; pin the version and read release notes before upgrading.
- The checkpointer is both the draw and a common pain point: the Postgres checkpointer's SSL/connection errors ([#3716](https://github.com/langchain-ai/langgraph/issues/3716)) and lost streamed state on run cancellation ([#5672](https://github.com/langchain-ai/langgraph/issues/5672)) recur on the tracker.
- Prebuilt-agent gotchas draw reactions: state serialization fails with `create_react_agent` + a `BaseStore` tool ([#5891](https://github.com/langchain-ai/langgraph/issues/5891), 21👍), and langgraph-cli / langgraph-api version mismatches bite ([#6706](https://github.com/langchain-ai/langgraph/issues/6706)) — keep the CLI and API packages in lockstep.

## Personal Notes

- The checkpointing/persistence story is the reason to pick this over hand-rolled loops.
- Keep graphs shallow — deep conditional graphs get hard to debug; prefer subgraphs.
- Good replacement for the archived openai/swarm experiments.
