use std::fs;
use std::path::{Path, PathBuf};

use crate::error::{AppError, Result};
use crate::frontmatter;
use crate::models::{Category, Entry, EntryMeta};

pub fn entries_dir(data_dir: &Path) -> PathBuf {
    data_dir.join("entries")
}

/// "owner/repo" -> "owner-repo", filesystem-safe.
pub fn slugify(full_name: &str) -> String {
    let mut slug = String::with_capacity(full_name.len());
    for c in full_name.chars() {
        match c {
            '/' => slug.push('-'),
            c if c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.' => {
                slug.push(c.to_ascii_lowercase())
            }
            _ => slug.push('-'),
        }
    }
    slug.trim_matches('-').to_string()
}

/// Accepts any github.com repo URL shape and returns ("owner/repo", canonical url).
pub fn normalize_github_url(url: &str) -> Result<(String, String)> {
    let trimmed = url.trim().trim_end_matches('/');
    let rest = trimmed
        .strip_prefix("https://github.com/")
        .or_else(|| trimmed.strip_prefix("http://github.com/"))
        .or_else(|| trimmed.strip_prefix("github.com/"))
        .or_else(|| trimmed.strip_prefix("git@github.com:"))
        .ok_or_else(|| AppError::msg(format!("not a github.com repository URL: {url}")))?;
    let rest = rest.trim_end_matches(".git");
    let parts: Vec<&str> = rest.splitn(3, '/').collect();
    if parts.len() < 2 || parts[0].is_empty() || parts[1].is_empty() {
        return Err(AppError::msg(format!("cannot extract owner/repo from: {url}")));
    }
    let full_name = format!("{}/{}", parts[0], parts[1]);
    let canonical = format!("https://github.com/{full_name}");
    Ok((full_name, canonical))
}

fn entry_from_file(path: &Path) -> Result<Entry> {
    let content = fs::read_to_string(path)?;
    let (meta, body) = frontmatter::parse(&content)
        .map_err(|e| AppError::msg(format!("{}: {e}", path.display())))?;
    let slug = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or_default()
        .to_string();
    // The directory the file lives in is authoritative for the id.
    let dir_category = path
        .parent()
        .and_then(|p| p.file_name())
        .and_then(|s| s.to_str())
        .unwrap_or(&meta.category)
        .to_string();
    Ok(Entry {
        id: format!("{dir_category}/{slug}"),
        slug,
        path: path.to_string_lossy().to_string(),
        meta,
        body,
    })
}

pub fn list_entries(data_dir: &Path) -> Result<Vec<Entry>> {
    let dir = entries_dir(data_dir);
    let mut out = Vec::new();
    if !dir.exists() {
        return Ok(out);
    }
    for cat in fs::read_dir(&dir)? {
        let cat = cat?.path();
        if !cat.is_dir() {
            continue;
        }
        for file in fs::read_dir(&cat)? {
            let file = file?.path();
            if file.extension().and_then(|e| e.to_str()) == Some("md") {
                match entry_from_file(&file) {
                    Ok(e) => out.push(e),
                    Err(e) => eprintln!("[libraium] skipping unreadable entry: {e}"),
                }
            }
        }
    }
    out.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(out)
}

pub fn get_entry(data_dir: &Path, id: &str) -> Result<Entry> {
    let (category, slug) = id
        .split_once('/')
        .ok_or_else(|| AppError::msg(format!("invalid entry id: {id}")))?;
    let path = entries_dir(data_dir).join(category).join(format!("{slug}.md"));
    if !path.exists() {
        return Err(AppError::NotFound(id.to_string()));
    }
    entry_from_file(&path)
}

/// Find an existing entry registering the same repository (case-insensitive full_name).
pub fn find_duplicate(data_dir: &Path, full_name: &str) -> Result<Option<Entry>> {
    let needle = full_name.to_ascii_lowercase();
    Ok(list_entries(data_dir)?
        .into_iter()
        .find(|e| e.meta.full_name.to_ascii_lowercase() == needle))
}

/// Create or update. `previous_id` is Some when updating; handles category moves.
pub fn save_entry(
    data_dir: &Path,
    meta: &EntryMeta,
    body: &str,
    previous_id: Option<&str>,
) -> Result<Entry> {
    let slug = slugify(&meta.full_name);
    if slug.is_empty() {
        return Err(AppError::msg("full_name produced an empty slug"));
    }
    let dir = entries_dir(data_dir).join(&meta.category);
    fs::create_dir_all(&dir)?;
    let path = dir.join(format!("{slug}.md"));

    // On create, refuse to overwrite a different repo's file silently.
    if previous_id.is_none() && path.exists() {
        return Err(AppError::Duplicate(meta.full_name.clone()));
    }

    fs::write(&path, frontmatter::serialize(meta, body)?)?;

    // Remove the old file if the entry moved (category change or rename).
    if let Some(prev) = previous_id {
        if let Some((prev_cat, prev_slug)) = prev.split_once('/') {
            let old = entries_dir(data_dir).join(prev_cat).join(format!("{prev_slug}.md"));
            if old != path && old.exists() {
                fs::remove_file(&old)?;
            }
        }
    }
    entry_from_file(&path)
}

pub fn delete_entry(data_dir: &Path, id: &str) -> Result<()> {
    let entry = get_entry(data_dir, id)?;
    fs::remove_file(entry.path)?;
    Ok(())
}

/// Render all entries as an awesome-list style Markdown document.
pub fn export_awesome_list(entries: &[Entry], categories: &[Category]) -> String {
    let mut out = String::from("# Awesome LibrAIum\n\nMy personally curated best-practice repositories, exported from [LibrAIum](https://github.com/).\n");
    let mut cats: Vec<&Category> = categories.iter().collect();
    cats.sort_by_key(|c| c.order);

    let mut listed: Vec<&str> = Vec::new();
    for cat in cats {
        let mut in_cat: Vec<&Entry> = entries.iter().filter(|e| e.meta.category == cat.id).collect();
        if in_cat.is_empty() {
            continue;
        }
        in_cat.sort_by(|a, b| b.meta.stars.cmp(&a.meta.stars));
        out.push_str(&format!("\n## {}\n\n", cat.name));
        for e in in_cat {
            listed.push(&e.meta.full_name);
            let summary = first_summary_line(&e.body);
            let lang = e.meta.language.as_deref().unwrap_or("-");
            out.push_str(&format!(
                "- [{}]({}) — {} `⭐{}` `{}`\n",
                e.meta.full_name, e.meta.github_url, summary, e.meta.stars, lang
            ));
        }
    }
    // Entries whose category is not in the master still get exported.
    let orphans: Vec<&Entry> = entries
        .iter()
        .filter(|e| !listed.contains(&e.meta.full_name.as_str()))
        .collect();
    if !orphans.is_empty() {
        out.push_str("\n## Uncategorized\n\n");
        for e in orphans {
            out.push_str(&format!("- [{}]({})\n", e.meta.full_name, e.meta.github_url));
        }
    }
    out
}

/// First non-heading, non-empty line of the body — used as a one-line summary.
pub fn first_summary_line(body: &str) -> String {
    body.lines()
        .map(str::trim)
        .find(|l| !l.is_empty() && !l.starts_with('#') && !l.starts_with("---"))
        .unwrap_or("")
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::EntryMeta;

    fn meta(full_name: &str, category: &str) -> EntryMeta {
        EntryMeta {
            github_url: format!("https://github.com/{full_name}"),
            full_name: full_name.into(),
            category: category.into(),
            tags: vec!["rag".into()],
            stars: 100,
            language: Some("Rust".into()),
            last_github_push: Some("2026-07-01".into()),
            last_checked: None,
            status: "active".into(),
            source: "manual".into(),
            added_date: Some("2026-07-08".into()),
        }
    }

    fn tmp() -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "libraium-test-{}-{:?}",
            std::process::id(),
            std::thread::current().id()
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn slugify_variants() {
        assert_eq!(slugify("Owner/Repo.js"), "owner-repo.js");
        assert_eq!(slugify("a b/c@d"), "a-b-c-d");
    }

    #[test]
    fn normalize_url_variants() {
        for u in [
            "https://github.com/owner/repo",
            "https://github.com/owner/repo/",
            "https://github.com/owner/repo.git",
            "git@github.com:owner/repo.git",
            "https://github.com/owner/repo/tree/main/sub",
        ] {
            let (full, canon) = normalize_github_url(u).unwrap();
            assert_eq!(full, "owner/repo", "input: {u}");
            assert_eq!(canon, "https://github.com/owner/repo");
        }
        assert!(normalize_github_url("https://gitlab.com/a/b").is_err());
    }

    #[test]
    fn crud_roundtrip_and_category_move() {
        let dir = tmp();
        let e = save_entry(&dir, &meta("owner/repo", "ai-agent"), "# Repo\n\nSummary.", None).unwrap();
        assert_eq!(e.id, "ai-agent/owner-repo");
        assert_eq!(list_entries(&dir).unwrap().len(), 1);

        // duplicate create refused
        assert!(save_entry(&dir, &meta("owner/repo", "ai-agent"), "", None).is_err());
        assert!(find_duplicate(&dir, "OWNER/REPO").unwrap().is_some());

        // move category
        let moved = save_entry(&dir, &meta("owner/repo", "web-app"), &e.body, Some(&e.id)).unwrap();
        assert_eq!(moved.id, "web-app/owner-repo");
        let all = list_entries(&dir).unwrap();
        assert_eq!(all.len(), 1, "old file must be removed on move");

        delete_entry(&dir, &moved.id).unwrap();
        assert!(list_entries(&dir).unwrap().is_empty());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn awesome_export_groups_by_category() {
        let dir = tmp();
        save_entry(&dir, &meta("a/x", "ai-agent"), "# x\n\nAgent tool.", None).unwrap();
        save_entry(&dir, &meta("b/y", "web-app"), "# y\n\nWeb tool.", None).unwrap();
        let cats = vec![
            Category { id: "ai-agent".into(), name: "AI Agents".into(), color: String::new(), icon: String::new(), description: String::new(), order: 1 },
            Category { id: "web-app".into(), name: "Web Apps".into(), color: String::new(), icon: String::new(), description: String::new(), order: 2 },
        ];
        let md = export_awesome_list(&list_entries(&dir).unwrap(), &cats);
        assert!(md.contains("## AI Agents"));
        assert!(md.contains("[a/x](https://github.com/a/x) — Agent tool."));
        let _ = fs::remove_dir_all(&dir);
    }
}
