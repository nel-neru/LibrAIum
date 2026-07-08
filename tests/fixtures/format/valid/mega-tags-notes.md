---
github_url: https://github.com/mega/tags-notes
full_name: mega/tags-notes
category: fixture-many-tags
tags:
  - agent-loop-reasoning
  - multi-agent
  - agent-memory
  - mcp-server
  - vector-db
  - rag
  - prompt-engineering
  - evaluation
  - llm-infra
  - typescript
  - python
  - rust
stars: 98765
language: Python
last_github_push: 2026-07-05
last_checked: 2026-07-08
status: active
source: x-collection
added_date: 2026-07-02
---

# tags-notes

Many tags (block-sequence YAML style rather than flow style) plus a long,
multi-paragraph Personal Notes section containing fenced code blocks.

## Personal Notes

The notes section can hold arbitrary Markdown, including fences:

```js
import { parseEntry } from "../mcp-server/lib/store.js";
const { meta, body } = parseEntry(content);
console.log(meta.tags.length); // 12
```

Indented content and a second fence in another language:

```rust
let entry = frontmatter::parse(&content)?;
assert_eq!(entry.meta.tags.len(), 12);
```

- Bullet after the fences.
- Another bullet, with `inline code` and **bold**.

A closing paragraph to make sure trailing content is preserved verbatim.
