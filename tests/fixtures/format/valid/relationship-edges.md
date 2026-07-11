---
github_url: https://github.com/Example/Legacy
full_name: Example/Legacy
category: fixture-rel
tags: [alpha, beta]
stars: 100
status: stale
source: manual
superseded_by: [Example/Successor, other/tool]
pairs_with: [friend/lib]
---

# Legacy

Fixture exercising structured succession (superseded_by) and affinity
(pairs_with) edges — populated arrays in flow style, appended after all other
EntryMeta fields, and round-tripped byte-identically by both the Rust and Node
serializers (conformance --serialize).
