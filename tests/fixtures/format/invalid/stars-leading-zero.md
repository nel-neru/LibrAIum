---
github_url: https://github.com/fixture/stars-leading-zero
full_name: fixture/stars-leading-zero
category: fixture-types
stars: 01750
---

# Leading-zero stars

`stars` has a leading zero (`01750`). serde_yaml rejects it as an invalid
integer, while the JS `yaml` lib parses it to 1750 — a divergence. The
plain-decimal contract forbids leading zeros (`^[+-]?(0|[1-9][0-9]*)$`), so both
sides reject it.
