---
github_url: https://github.com/Example/Legacy
full_name: Example/Legacy
category: fixture-rel
tags: [alpha]
stars: 100
status: stale
source: manual
superseded_by: Example/Successor
---

# Legacy

Invalid: superseded_by must be an ARRAY of owner/repo full_names, not a bare
scalar. Both parsers must reject this in lockstep — Rust's strict_string_vec
expects a YAML sequence, and Node's validateMeta rejects the non-array.
