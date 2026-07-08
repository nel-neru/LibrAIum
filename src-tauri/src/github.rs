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
            let hint = match code {
                404 => " (repository not found — renamed or private?)",
                403 | 429 => " (rate limited — set a GitHub token in Settings)",
                _ => "",
            };
            let body = resp.into_string().unwrap_or_default();
            let msg = body.lines().next().unwrap_or("").chars().take(200).collect::<String>();
            Err(AppError::GitHub(format!("{full_name}: HTTP {code}{hint} {msg}")))
        }
        Err(e) => Err(AppError::GitHub(format!("{full_name}: {e}"))),
    }
}

/// Apply fresh GitHub metadata to an entry. Returns true if it became stale.
pub fn apply_refresh(entry: &mut Entry, gh: &GhRepo, stale_days: u32) -> bool {
    let today = Utc::now().date_naive();
    entry.meta.stars = gh.stargazers_count;
    entry.meta.language = gh.language.clone();
    let push_date = gh.pushed_at.as_deref().map(|s| s.chars().take(10).collect::<String>());
    entry.meta.last_github_push = push_date.clone();
    entry.meta.last_checked = Some(today.format("%Y-%m-%d").to_string());

    let was_stale = entry.meta.status == "stale";
    entry.meta.status = compute_status(gh.archived, push_date.as_deref(), today, stale_days);
    !was_stale && entry.meta.status == "stale"
}

pub fn compute_status(archived: bool, push_date: Option<&str>, today: NaiveDate, stale_days: u32) -> String {
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

    #[test]
    fn status_logic() {
        let today = NaiveDate::from_ymd_opt(2026, 7, 8).unwrap();
        assert_eq!(compute_status(true, Some("2026-07-01"), today, 180), "archived");
        assert_eq!(compute_status(false, Some("2026-07-01"), today, 180), "active");
        assert_eq!(compute_status(false, Some("2025-01-01"), today, 180), "stale");
        assert_eq!(compute_status(false, None, today, 180), "active");
    }
}
