---
github_url: https://github.com/Example/Legacy
full_name: Example/Legacy
category: fixture-rel
tags: [alpha]
stars: 100
status: active
source: manual
pairs_with: friend/lib
---

# Legacy

Invalid: pairs_with must be an ARRAY of owner/repo full_names, not a bare scalar
(the symmetric counterpart to superseded-by-string.md). Both parsers reject it in
lockstep — this locks the two relationship fields to the same rejection contract.
