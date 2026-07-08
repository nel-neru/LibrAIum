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
    let meta: EntryMeta = serde_yaml::from_str(&yaml)?;
    Ok((meta, body))
}

pub fn serialize(meta: &EntryMeta, body: &str) -> Result<String> {
    let yaml = serde_yaml::to_string(meta)?;
    let body = body.trim_end();
    Ok(format!("---\n{yaml}---\n\n{body}\n"))
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
    fn defaults_applied() {
        let minimal = "---\ngithub_url: https://github.com/a/b\nfull_name: a/b\ncategory: web-app\n---\nbody\n";
        let (meta, _) = parse(minimal).unwrap();
        assert_eq!(meta.status, "active");
        assert_eq!(meta.source, "manual");
        assert_eq!(meta.stars, 0);
        assert!(meta.tags.is_empty());
    }
}
