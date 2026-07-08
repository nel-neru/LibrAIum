# no-frontmatter

This file has no frontmatter block at all. Both parsers must reject it:
the very first line of an entry file must be exactly `---`.

## Personal Notes

- Expected error (Node): "file does not start with '---' frontmatter".
