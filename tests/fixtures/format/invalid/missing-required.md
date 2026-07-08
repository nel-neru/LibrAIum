---
category: fixture-types
tags:
  - orphan
---

# Missing required fields

A well-formed mapping that lacks `github_url` and `full_name`. Rust's serde
fails on the missing required fields; the Node parser must reject identically
rather than returning a partial meta object.
