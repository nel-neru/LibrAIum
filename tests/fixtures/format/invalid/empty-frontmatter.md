---
---

# Ghost entry

The frontmatter block is empty: it parses to YAML `null`, not a mapping.
Rust's typed deserialization rejects this; Node must reject it too instead
of returning `{ meta: null }` and crashing every consumer downstream.
