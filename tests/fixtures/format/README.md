# Entry file format fixtures

Golden fixtures for the LibrAIum entry file format. The format is
**dual-implemented on purpose** — Rust (`src-tauri/src/frontmatter.rs`,
`store.rs`, `models.rs`) and Node (`mcp-server/lib/store.js`) — and both
implementations must accept, reject and produce identical results. These
fixtures pin down what "identical" means.

These are **format** fixtures, not data fixtures: `valid/` files use synthetic
category ids (`fixture-*`) that intentionally do not exist in
`data/master/categories.yaml`. They exercise the parser contract only.
`scripts/validate-data.mjs` validates the live `data/` directory (parser
contract **plus** data-level rules such as category existence, slug/dir
agreement and duplicate detection) and never scans `tests/`.

## The format contract

An entry file is UTF-8 text (an optional leading BOM is stripped). Line
endings may be LF or CRLF — the CR is stripped during line splitting (Rust
`str::lines()`, Node `split(/\r?\n/)`) and never reaches frontmatter values
or the body:

```
---
<YAML frontmatter>
---

<Markdown body>
```

Line-based splitting rules, identical in both implementations:

1. Line 1 must be exactly `---` (trailing whitespace tolerated). Anything
   else — including an empty file — is a parse error ("does not start with
   '---' frontmatter").
2. The frontmatter ends at the **first** subsequent line that is exactly
   `---` (trailing whitespace tolerated). If no such line exists the file is
   rejected ("unterminated frontmatter").
3. Everything between the delimiters is parsed as YAML and must yield a
   **mapping**; a YAML error rejects the file even when the delimiters are
   well-formed, and so does frontmatter that parses to `null` (empty block),
   a scalar, or a sequence.
4. Everything after the closing delimiter is the Markdown body; leading blank
   lines are stripped. A bare `---` in the body (Markdown horizontal rule) is
   plain body text because it comes after the close.

Frontmatter schema (`EntryMeta` in `src-tauri/src/models.rs`):

| field              | type                              | required | default    |
| ------------------ | --------------------------------- | -------- | ---------- |
| `github_url`       | string (github.com repo URL)      | yes      | —          |
| `full_name`        | string (`owner/repo`)             | yes      | —          |
| `category`         | string (category id)              | yes      | —          |
| `tags`             | array of non-empty strings        | no       | `[]`       |
| `stars`            | non-negative number               | no       | `0`        |
| `language`         | string                            | no       | absent     |
| `last_github_push` | string `YYYY-MM-DD`               | no       | absent     |
| `last_checked`     | string `YYYY-MM-DD`               | no       | absent     |
| `status`           | `active \| stale \| archived`     | no       | `active`   |
| `source`           | `manual \| mcp \| x-collection`   | no       | `manual`   |
| `added_date`       | string `YYYY-MM-DD`               | no       | absent     |

Derived invariants (enforced on real data by `scripts/validate-data.mjs`):

- File name is `slugify(full_name) + ".md"`; `slugify` lowercases, maps `/`
  to `-`, keeps `[a-zA-Z0-9-_.]` (so dots survive: `sveltejs/kit.js` →
  `sveltejs-kit.js`), maps everything else to `-`, and trims leading/trailing
  `-`.
- Parent directory name equals `meta.category`, and that id must exist in
  `data/master/categories.yaml` (ids are unique, kebab-case
  `^[a-z0-9-]+$`, names non-empty).
- `normalizeGithubUrl(github_url).fullName` equals `full_name`
  case-insensitively; `full_name` is unique case-insensitively across all
  entries.

## Fixtures

`valid/` — must parse in both implementations:

| file                       | exercises                                              |
| -------------------------- | ------------------------------------------------------ |
| `example-minimal.md`       | the three required fields only; all defaults           |
| `example-full.md`          | every field populated; mixed-case `full_name`          |
| `yuru-nihongo.md`          | Unicode (Japanese, accents, emoji) in tags and body    |
| `sveltejs-kit.js.md`       | dot in the repo name → dot in the file stem            |
| `mega-tags-notes.md`       | 12 tags (block style), multi-paragraph notes, code fences |
| `hr-after-frontmatter.md`  | bare `---` horizontal rules in the body after the close |
| `crlf.md`                  | every line ends CRLF (protected by `.gitattributes -text`) — CRs must be stripped, not leak into values/body |

`invalid/` — must be rejected by both implementations:

| file                          | defect                                            |
| ----------------------------- | ------------------------------------------------- |
| `no-frontmatter.md`           | no `---` block at all                             |
| `unterminated-frontmatter.md` | opening `---` but no closing delimiter            |
| `malformed-yaml.md`           | delimiters fine, YAML between them does not parse |
| `empty.md`                    | zero-byte file                                    |
| `empty-frontmatter.md`        | delimiters fine, but the YAML between them is empty — parses to `null`, not a mapping |

## Known constraint: bare `---` inside a YAML value

Both splitters are **line-based** and stop at the first `---` line after the
opening delimiter, *before* the YAML is parsed. Consequently a YAML value
that legitimately contains a bare `---` line at column 0 — e.g. a block
scalar such as

```yaml
description: |
  first line
  ---
  this never survives
```

— is terminated early: the `---` inside the scalar is taken as the
frontmatter close, and the remainder leaks into the body (usually surfacing
as a YAML error or silently truncated metadata). A spec-compliant YAML
document would allow this; our dual Rust/Node implementation pair does not.

This is an accepted limitation of keeping two small, dependency-light
implementations in lockstep (a full YAML-aware splitter would have to be
ported identically to both sides). No current `EntryMeta` field uses block
scalars, so the constraint is theoretical for real data. It is documented
here and tracked by the format conformance fixtures: if either
implementation ever changes its splitting rule, add matching fixtures under
`valid/`/`invalid/` and update **both** implementations together.
