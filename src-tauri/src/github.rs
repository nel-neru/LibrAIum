use std::time::Duration;

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
    // Same 10s bound as the Node MCP server: a stalled connection must not hang a
    // refresh (ureq has no overall timeout by default). http_status_as_error is
    // turned off so a 4xx/5xx comes back as Ok(resp) — ureq 3's Error::StatusCode
    // carries no body, and we need GitHub's error text to build the message below.
    let agent: ureq::Agent = ureq::Agent::config_builder()
        .timeout_global(Some(Duration::from_secs(10)))
        .http_status_as_error(false)
        .build()
        .into();
    let mut req = agent
        .get(url.as_str())
        .header("User-Agent", "LibrAIum/1.0")
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2022-11-28");
    if let Some(t) = token {
        if !t.is_empty() {
            req = req.header("Authorization", &format!("Bearer {t}"));
        }
    }
    // With http_status_as_error(false), call() only errs on transport failures
    // (DNS, connect, the 10s timeout); HTTP status is inspected on the response.
    let mut resp = req
        .call()
        .map_err(|e| AppError::GitHub(format!("{full_name}: {e}")))?;
    let code = resp.status().as_u16();
    if (200..300).contains(&code) {
        return resp
            .body_mut()
            .read_json::<GhRepo>()
            .map_err(|e| AppError::GitHub(format!("invalid response for {full_name}: {e}")));
    }
    let body = resp.body_mut().read_to_string().unwrap_or_default();
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

/// Apply fresh GitHub metadata to an entry. Returns true if it became stale.
pub fn apply_refresh(entry: &mut Entry, gh: &GhRepo, stale_days: u32) -> bool {
    // Keep the entry in its authoritative (directory-derived) category. save_entry
    // builds the destination path from meta.category, and the refresh commands pass
    // the directory-derived id as previous_id — so if the frontmatter category has
    // drifted from the on-disk directory, a metadata-only refresh would otherwise
    // silently MOVE the file and change its id. Pin category to the id's directory
    // (store.rs: "the directory the file lives in is authoritative for the id").
    if let Some((dir_category, _)) = entry.id.split_once('/') {
        entry.meta.category = dir_category.to_string();
    }
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

/// The refresh sweep's per-entry decision from one fetch result. A rate limit
/// means every remaining request would fail identically (60/hr unauthenticated),
/// so the whole sweep stops; any other error is per-entry and the sweep goes on.
/// Extracting this makes the break-vs-continue decision testable without the
/// real network call + inter-request sleep that refresh_all otherwise embeds.
pub enum FetchOutcome {
    Proceed(GhRepo),
    Skip(String),
    Stop(String),
}

pub fn classify_fetch(result: Result<GhRepo>) -> FetchOutcome {
    match result {
        Ok(gh) => FetchOutcome::Proceed(gh),
        Err(e @ AppError::RateLimited(_)) => FetchOutcome::Stop(format!(
            "{e} — aborted the remaining refreshes; retry after setting a token."
        )),
        Err(e) => FetchOutcome::Skip(e.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::EntryMeta;

    #[test]
    fn classify_fetch_stops_only_on_rate_limit() {
        // Ok -> Proceed with the payload.
        match classify_fetch(Ok(gh(None, false))) {
            FetchOutcome::Proceed(g) => assert_eq!(g.full_name, "owner/repo"),
            _ => panic!("Ok must Proceed"),
        }
        // 403/429 -> Stop the whole sweep (one clear aborted-message).
        match classify_fetch(Err(AppError::RateLimited("owner/repo: HTTP 429".into()))) {
            FetchOutcome::Stop(msg) => assert!(msg.contains("aborted the remaining"), "{msg}"),
            _ => panic!("RateLimited must Stop"),
        }
        // Any other error -> Skip this entry, continue the sweep.
        match classify_fetch(Err(AppError::GitHub("owner/repo: HTTP 404".into()))) {
            FetchOutcome::Skip(msg) => assert!(msg.contains("404"), "{msg}"),
            _ => panic!("non-rate-limit error must Skip"),
        }
    }

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
                reception_gathered: None,
                superseded_by: vec![],
                pairs_with: vec![],
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

    #[test]
    fn apply_refresh_pins_category_to_the_id_directory() {
        // Entry lives in directory "actual-dir" (id) but its frontmatter category
        // has drifted to "claimed-cat". A metadata refresh must correct the
        // frontmatter to the authoritative directory, NOT move the file — so
        // save_entry (which builds the path from meta.category with previous_id =
        // the id) keeps writing to entries/actual-dir/.
        let mut e = entry("active");
        e.id = "actual-dir/owner-repo".into();
        e.meta.category = "claimed-cat".into();
        apply_refresh(&mut e, &gh(Some("2026-07-01T00:00:00Z".into()), false), 180);
        assert_eq!(
            e.meta.category, "actual-dir",
            "refresh must pin category to the id's directory, not leave the drift"
        );
    }
}
