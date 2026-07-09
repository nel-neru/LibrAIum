---
github_url: https://github.com/fixture/stars-exponent
full_name: fixture/stars-exponent
category: fixture-types
stars: 1e3
---

# Exponent-form stars

`stars` is written in exponent form (`1e3`). The JS `yaml` lib resolves it to
the integer 1000, but serde_yaml (u64) rejects any float-form scalar. Both
implementations must reject it: an integer field accepts only a plain decimal
token (`^[+-]?(0|[1-9][0-9]*)$`), never hex/octal/binary/float/exponent forms.
