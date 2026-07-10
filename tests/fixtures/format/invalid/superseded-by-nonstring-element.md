---
github_url: https://github.com/Example/Legacy
full_name: Example/Legacy
category: fixture-rel
tags: [alpha]
stars: 100
status: stale
source: manual
superseded_by: [123]
---

# Legacy

Invalid: superseded_by elements must be strings. A non-string ELEMENT is a
different code path from a non-array value — Rust's strict_string_vec rejects
the numeric element, Node's validateMeta rejects it via `.some(typeof != string)`.
