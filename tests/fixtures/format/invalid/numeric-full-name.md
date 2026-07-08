---
github_url: https://github.com/fixture/numeric
full_name: 12345
category: fixture-types
---

# Numeric full_name

`full_name` parses as a YAML number. Rust's typed serde (String) rejects it;
the Node parser must reject it too instead of yielding `meta.full_name = 12345`.
