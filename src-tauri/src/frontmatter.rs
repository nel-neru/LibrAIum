use crate::error::{AppError, Result};
use crate::models::EntryMeta;

/// Split a `---` fenced YAML frontmatter document into (yaml, body).
pub fn split(content: &str) -> Result<(String, String)> {
    let content = content.trim_start_matches('\u{feff}');
    let mut lines = content.lines();
    match lines.next() {
        Some(l) if l.trim_end() == "---" => {}
        _ => return Err(AppError::msg("file does not start with '---' frontmatter")),
    }
    let mut yaml = String::new();
    let mut body = String::new();
    let mut in_yaml = true;
    for line in lines {
        if in_yaml && line.trim_end() == "---" {
            in_yaml = false;
            continue;
        }
        if in_yaml {
            yaml.push_str(line);
            yaml.push('\n');
        } else {
            body.push_str(line);
            body.push('\n');
        }
    }
    if in_yaml {
        return Err(AppError::msg(
            "unterminated frontmatter: closing '---' not found",
        ));
    }
    Ok((yaml, body.trim_start_matches('\n').to_string()))
}

pub fn parse(content: &str) -> Result<(EntryMeta, String)> {
    let (yaml, body) = split(content)?;
    // Integer fields must be PLAIN DECIMAL tokens. serde_yaml (libyaml) and the
    // Node twin's yaml lib resolve exotic numeric scalars differently — serde
    // accepts hex/octal/binary (0x3e8, 0o1750, 0b…), the JS lib accepts
    // 1e3/1000.0/01750 — so the same file could parse on one side and be
    // rejected on the other. Restrict both to ^[+-]?[0-9]+$ so they stay in
    // lockstep (mirrored in store.js parseEntry). Runs before serde so the raw
    // token is still visible.
    reject_non_decimal_int(&yaml, "stars")?;
    let meta: EntryMeta = serde_norway::from_str(&yaml)?;
    Ok((meta, body))
}

/// True iff `tok` is a plain decimal integer, optionally signed — the ONLY
/// integer form the dual-implemented format accepts for stars / category order.
fn is_plain_decimal(tok: &str) -> bool {
    let digits = tok.strip_prefix(['+', '-']).unwrap_or(tok);
    match digits.as_bytes() {
        [] => false,
        [b'0'] => true,      // exactly zero
        [b'0', ..] => false, // leading zero (serde_yaml rejects it too)
        _ => digits.bytes().all(|b| b.is_ascii_digit()),
    }
}

/// Reject any line assigning `<key>: <value>` whose value is a non-decimal
/// integer form (hex/octal/binary/float/exponent/leading-zero). Quoted, empty,
/// and block values are left to the typed parse. Scans trimmed line-starts so
/// it works for a top-level `stars:` (frontmatter) and an indented `order:`
/// (category items) alike. Shared by frontmatter::parse and categories::load.
pub fn reject_non_decimal_int(yaml: &str, key: &str) -> Result<()> {
    let needle = format!("{key}:");
    for line in yaml.lines() {
        if let Some(rest) = line.trim_start().strip_prefix(&needle) {
            let val = rest.split(" #").next().unwrap_or(rest).trim();
            if val.is_empty() || val.starts_with('"') || val.starts_with('\'') {
                continue; // null / block scalar / quoted string — typed parse handles it
            }
            if !is_plain_decimal(val) {
                return Err(AppError::msg(format!(
                    "field '{key}' must be a plain decimal integer (got '{val}') — hex/octal/binary/float/exponent forms are rejected"
                )));
            }
        }
    }
    Ok(())
}

pub fn serialize(meta: &EntryMeta, body: &str) -> Result<String> {
    let mut yaml = serde_norway::to_string(meta)?;
    yaml = flow_seq(&yaml, "tags", &meta.tags);
    yaml = flow_seq(&yaml, "superseded_by", &meta.superseded_by);
    yaml = flow_seq(&yaml, "pairs_with", &meta.pairs_with);
    let body = body.trim_end();
    Ok(format!("---\n{yaml}---\n\n{body}\n"))
}

/// Rewrite serde_yaml's block-style `<key>:` sequence into the canonical flow
/// style `<key>: [a, b]` the shipped library uses, so the Rust and Node
/// serializers emit byte-identical files (conformance --serialize / store.js
/// serializeEntry). Values are kebab-case tags or `owner/repo` full_names, both
/// of which need no quoting. An always-emitted empty list (`tags`) already reads
/// `tags: []` and passes through; a skip-if-empty field (`superseded_by`,
/// `pairs_with`) is simply absent when empty, so this is a no-op for it.
fn flow_seq(yaml: &str, key: &str, values: &[String]) -> String {
    let header = format!("{key}:");
    let mut out = String::with_capacity(yaml.len());
    let mut lines = yaml.lines().peekable();
    while let Some(line) = lines.next() {
        if line == header {
            while matches!(lines.peek(), Some(l) if l.trim_start().starts_with("- ")) {
                lines.next();
            }
            out.push_str(&header);
            out.push_str(" [");
            out.push_str(&values.join(", "));
            out.push_str("]\n");
        } else {
            out.push_str(line);
            out.push('\n');
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = "---\ngithub_url: https://github.com/owner/repo\nfull_name: owner/repo\ncategory: ai-agent\ntags: [vector-db, rag]\nstars: 8750\nlanguage: Python\nstatus: active\nsource: manual\n---\n\n# Repo\n\nSummary here.\n\n## Personal Notes\n- note\n";

    #[test]
    fn parse_and_roundtrip() {
        let (meta, body) = parse(SAMPLE).unwrap();
        assert_eq!(meta.full_name, "owner/repo");
        assert_eq!(meta.stars, 8750);
        assert_eq!(meta.tags, vec!["vector-db", "rag"]);
        assert!(body.starts_with("# Repo"));

        let out = serialize(&meta, &body).unwrap();
        let (meta2, body2) = parse(&out).unwrap();
        assert_eq!(meta, meta2);
        assert_eq!(body.trim_end(), body2.trim_end());
    }

    #[test]
    fn rejects_missing_frontmatter() {
        assert!(parse("# just markdown\n").is_err());
        assert!(parse("---\nfoo: 1\n").is_err()); // unterminated
    }

    #[test]
    fn rejects_wrong_scalar_types() {
        // Mirrors Node's validateMeta: schema string fields must BE strings —
        // serde_yaml's plain-scalar-to-String coercion is disabled on purpose.
        let base = "github_url: https://github.com/a/b\nfull_name: a/b\ncategory: web-app";
        let doc = |yaml: &str| format!("---\n{yaml}\n---\nbody\n");

        assert!(parse(&doc(&base.replace("full_name: a/b", "full_name: 12345"))).is_err());
        assert!(parse(&doc(&format!("{base}\ntags: [1]"))).is_err());
        assert!(parse(&doc(&format!("{base}\nstatus: 2026"))).is_err());
        assert!(parse(&doc(&format!("{base}\nstars: \"123\""))).is_err());

        // Option fields accept explicit null (None), same as before.
        let (meta, _) = parse(&doc(&format!("{base}\nlanguage: null"))).unwrap();
        assert!(meta.language.is_none());
    }

    #[test]
    fn serialize_emits_canonical_flow_tags() {
        let (meta, body) = parse(SAMPLE).unwrap();
        let out = serialize(&meta, &body).unwrap();
        // Canonical flow style, matching the shipped library and the Node twin
        // (byte-identity is enforced by scripts/conformance.mjs --serialize).
        assert!(out.contains("tags: [vector-db, rag]\n"), "got:\n{out}");
        assert!(
            !out.contains("\n- vector-db"),
            "must not emit block style:\n{out}"
        );

        // Empty tags round-trip as `tags: []`.
        let mut empty = meta.clone();
        empty.tags = vec![];
        assert!(serialize(&empty, &body).unwrap().contains("tags: []\n"));
    }

    #[test]
    fn serialize_emits_flow_relationship_edges() {
        let (mut meta, body) = parse(SAMPLE).unwrap();
        meta.superseded_by = vec!["langchain-ai/langgraph".into()];
        meta.pairs_with = vec!["run-llama/llama_index".into(), "a/b".into()];
        let out = serialize(&meta, &body).unwrap();
        // Flow style, byte-identical to the Node twin (conformance --serialize).
        assert!(out.contains("superseded_by: [langchain-ai/langgraph]\n"), "got:\n{out}");
        assert!(out.contains("pairs_with: [run-llama/llama_index, a/b]\n"), "got:\n{out}");
        assert!(!out.contains("\n- langchain-ai"), "must not emit block style:\n{out}");
        // Round-trips.
        let (meta2, _) = parse(&out).unwrap();
        assert_eq!(meta, meta2);

        // Empty edges are OMITTED entirely (skip_serializing_if), not `[]`.
        let (bare, body2) = parse(SAMPLE).unwrap();
        let out2 = serialize(&bare, &body2).unwrap();
        assert!(!out2.contains("superseded_by"), "empty edges must be omitted:\n{out2}");
        assert!(!out2.contains("pairs_with"), "empty edges must be omitted:\n{out2}");
    }

    #[test]
    fn integer_fields_accept_only_plain_decimal() {
        let base = "github_url: https://github.com/a/b\nfull_name: a/b\ncategory: web-app";
        let doc = |stars: &str| format!("---\n{base}\nstars: {stars}\n---\nbody\n");

        // Exotic forms the two YAML libs disagree on must be rejected on BOTH
        // sides (hex/octal/binary via serde, exp/float/leading-zero via the JS
        // lib). See tests/fixtures/format/invalid/stars-*.md for the twin.
        for bad in [
            "1e3", "1E3", "1000.0", "0x3e8", "0o1750", "0b1000", "01750", "007", "1_000",
        ] {
            assert!(parse(&doc(bad)).is_err(), "stars: {bad} must be rejected");
        }
        // Plain decimals (incl. a bare zero and an explicit +) are accepted.
        for good in ["0", "1000", "+1000"] {
            let (meta, _) = parse(&doc(good)).expect(good);
            assert!(meta.stars < u64::MAX);
        }
    }

    #[test]
    fn defaults_applied() {
        let minimal = "---\ngithub_url: https://github.com/a/b\nfull_name: a/b\ncategory: web-app\n---\nbody\n";
        let (meta, _) = parse(minimal).unwrap();
        assert_eq!(meta.status, "active");
        assert_eq!(meta.source, "manual");
        assert_eq!(meta.stars, 0);
        assert!(meta.tags.is_empty());
    }
}
