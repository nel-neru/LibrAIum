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
---

# langgraph

Graph-based agent orchestration: nodes are steps, edges are control flow, state is checkpointed. Human-in-the-loop and persistence built in.

## Personal Notes

- The checkpointing/persistence story is the reason to pick this over hand-rolled loops.
- Keep graphs shallow — deep conditional graphs get hard to debug; prefer subgraphs.
- Good replacement for the archived openai/swarm experiments.
