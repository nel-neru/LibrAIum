---
github_url: https://github.com/fixture/quoted-stars
full_name: fixture/quoted-stars
category: fixture-types
stars: "8750"
---

# Quoted stars

`stars` is a YAML string, not a number. Rust's typed serde (u64) rejects it;
the Node parser must reject it too instead of silently carrying a string.
