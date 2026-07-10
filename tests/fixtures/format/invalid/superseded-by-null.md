---
github_url: https://github.com/Example/Legacy
full_name: Example/Legacy
category: fixture-rel
tags: [alpha]
stars: 100
status: stale
source: manual
superseded_by: null
---

# Legacy

Invalid: an explicit null is the subtlest parity point — serde's `default` fires
only on an ABSENT key, so a present `null` reaches strict_string_vec (Rust) and
the non-array check (Node), and both reject it. Absent would be fine; null is not.
