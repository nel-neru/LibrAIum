---
github_url: https://github.com/fixture/stars-hex
full_name: fixture/stars-hex
category: fixture-types
stars: 0x3e8
---

# Hex-form stars

`stars` is written in hexadecimal (`0x3e8`). serde_yaml resolves it to 1000
while the JS `yaml` lib resolves it differently — the exact kind of cross-parser
disagreement the plain-decimal-only contract exists to prevent. Both sides must
reject it.
