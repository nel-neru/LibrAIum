use chrono::{NaiveDate, Utc};
use serde::Deserialize;

use crate::error::{AppError, Result};
use crate::models::Entry;

#[derive(Debug, Deserialize)]
pub struct GhRepo {
    pub full_name: String,
    pub stargazers_count: u64,
    #[serde(default)]
    pub language: Option<String>,
    #[serde(default)]
    pub pushed_at: Option<String>, // RFC3339
    #[serde(default)]
    pub archived: bool,
    #[serde(default)]
    pub description: Option<String>,
}

pub fn fetch_repo(full_name: &str, token: Option<&str>) -> Result<GhRepo> {
    let url = format!("https://api.github.com/repos/{full_name}");
    let mut req = ureq::get(&url)
        // Same 10s bound as the Node MCP server: a stalled connection must
        // not hang a refresh (ureq has no overall timeout by default).
        .timeout(std::time::Duration::from_secs(10))
        .set("User-Agent", "LibrAIum/1.0")
        .set("Accept", "application/vnd.github+json")
        .set("X-GitHub-Api-Version", "2022-11-28");
    if let Some(t) = token {
        if !t.is_empty() {
            req = req.set("Authorization", &format!("Bearer {t}"));
        }
    }
    match req.call() {
        Ok(resp) => resp
            .into_json::<GhRepo>()
            .map_err(|e| AppError::GitHub(format!("invalid response for {full_name}: {e}"))),
        Err(ureq::Error::Status(code, resp)) => {
            let body = resp.into_string().unwrap_or_default();
            let msg = body
                .lines()
                .next()
                .unwrap_or("")
                .chars()
                .take(200)
                .collect::<String>();
            match code {
                // Typed so refresh_all can abort the sweep instead of
                // collecting one identical error per remaining entry.
                403 | 429 => Err(AppError::RateLimited(format!(
                    "{full_name}: HTTP {code} (set a GitHub token in Settings) {msg}"
                ))),
                404 => Err(AppError::GitHub(format!(
                    "{full_name}: HTTP 404 (repository not found — renamed or private?) {msg}"
                ))),
                _ => Err(AppError::GitHub(format!("{full_name}: HTTP {code} {msg}"))),
            }
        }
        Err(e) => Err(AppError::GitHub(format!("{full_name}: {e}"))),
    }
}

/// Apply fresh GitHub metadata to an entry. Returns true if it became stale.
pub fn apply_refresh(entry: &mut Entry, gh: &GhRepo, stale_days: u32) -> bool {
    let today = Utc::now().date_naive();
    entry.meta.stars = gh.stargazers_count;
    entry.meta.language = gh.language.clone();
    let push_date = gh
        .pushed_at
        .as_deref()
        .map(|s| s.chars().take(10).collect::<String>());
    entry.meta.last_github_push = push_date.clone();
    entry.meta.last_checked = Some(today.format("%Y-%m-%d").to_string());

    let was_stale = entry.meta.status == "stale";
    entry.meta.status = compute_status(gh.archived, push_date.as_deref(), today, stale_days);
    !was_stale && entry.meta.status == "stale"
}

pub fn compute_status(
    archived: bool,
    push_date: Option<&str>,
    today: NaiveDate,
    stale_days: u32,
) -> String {
    if archived {
        return "archived".into();
    }
    if let Some(d) = push_date.and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()) {
        if (today - d).num_days() > stale_days as i64 {
            return "stale".into();
        }
    }
    "active".into()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::EntryMeta;

    #[test]
    fn status_logic() {
        let today = NaiveDate::from_ymd_opt(2026, 7, 8).unwrap();
        assert_eq!(
            compute_status(true, Some("2026-07-01"), today, 180),
            "archived"
        );
        assert_eq!(
            compute_status(false, Some("2026-07-01"), today, 180),
            "active"
        );
        assert_eq!(
            compute_status(false, Some("2025-01-01"), today, 180),
            "stale"
        );
        assert_eq!(compute_status(false, None, today, 180), "active");
    }

    #[test]
    fn stale_boundary_is_exclusive() {
        // Every stale badge and refresh_all's became_stale counter hang on
        // this exact `>` comparison: stale_days old stays active, +1 flips.
        let today = NaiveDate::from_ymd_opt(2026, 7, 8).unwrap();
        let at = (today - chrono::Duration::days(180))
            .format("%Y-%m-%d")
            .to_string();
        let over = (today - chrono::Duration::days(181))
            .format("%Y-%m-%d")
            .to_string();
        assert_eq!(compute_status(false, Some(&at), today, 180), "active");
        assert_eq!(compute_status(false, Some(&over), today, 180), "stale");
        // Unparseable push date = unknown freshness -> active, not stale.
        assert_eq!(
            compute_status(false, Some("not-a-date"), today, 180),
            "active"
        );
    }

    fn entry(status: &str) -> Entry {
        Entry {
            id: "ai-agent/owner-repo".into(),
            slug: "owner-repo".into(),
            path: String::new(),
            body: String::new(),
            meta: EntryMeta {
                github_url: "https://github.com/owner/repo".into(),
                full_name: "owner/repo".into(),
                category: "ai-agent".into(),
                tags: vec![],
                stars: 0,
                language: None,
                last_github_push: None,
                last_checked: None,
                status: status.into(),
                source: "manual".into(),
                added_date: None,
            },
        }
    }

    fn gh(pushed_at: Option<String>, archived: bool) -> GhRepo {
        GhRepo {
            full_name: "owner/repo".into(),
            stargazers_count: 42,
            language: Some("Rust".into()),
            pushed_at,
            archived,
            description: None,
        }
    }

    #[test]
    fn apply_refresh_returns_true_only_on_active_to_stale() {
        let old = Some("2000-01-01T00:00:00Z".to_string());
        let fresh = Some((Utc::now() - chrono::Duration::days(1)).to_rfc3339());

        // active -> stale: the one transition that must report true.
        let mut e = entry("active");
        assert!(apply_refresh(&mut e, &gh(old.clone(), false), 180));
        assert_eq!(e.meta.status, "stale");
        assert_eq!(e.meta.stars, 42);
        assert_eq!(e.meta.language.as_deref(), Some("Rust"));
        assert_eq!(e.meta.last_github_push.as_deref(), Some("2000-01-01"));
        assert!(e.meta.last_checked.is_some());

        // stale -> stale: still stale is not "became stale".
        let mut e = entry("stale");
        assert!(!apply_refresh(&mut e, &gh(old.clone(), false), 180));
        assert_eq!(e.meta.status, "stale");

        // stale -> active: recovery reports false and flips the badge back.
        let mut e = entry("stale");
        assert!(!apply_refresh(&mut e, &gh(fresh, false), 180));
        assert_eq!(e.meta.status, "active");

        // active -> archived: archived is not "became stale" either.
        let mut e = entry("active");
        assert!(!apply_refresh(&mut e, &gh(old, true), 180));
        assert_eq!(e.meta.status, "archived");
    }
}
