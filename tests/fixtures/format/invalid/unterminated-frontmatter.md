---
github_url: https://github.com/broken/unterminated
full_name: broken/unterminated
category: fixture-invalid
status: active
source: manual

# unterminated

The frontmatter opened with `---` but there is no closing `---` line anywhere
in the file, so the whole file is an unterminated frontmatter block.
Expected error (Node): "unterminated frontmatter".
