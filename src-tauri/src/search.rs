use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;

use crate::models::{Entry, SearchQuery};
use crate::store::first_summary_line;

/// Filter + fuzzy-rank entries. Empty query = filter only, ranked by stars.
pub fn search(entries: &[Entry], q: &SearchQuery) -> Vec<Entry> {
    let matcher = SkimMatcherV2::default();
    let query = q.query.as_deref().map(str::trim).filter(|s| !s.is_empty());

    let mut scored: Vec<(i64, &Entry)> = entries
        .iter()
        .filter(|e| passes_filters(e, q))
        .filter_map(|e| match query {
            None => Some((e.meta.stars as i64, e)),
            Some(needle) => {
                let haystack = format!(
                    "{} {} {} {}",
                    e.meta.full_name,
                    e.meta.tags.join(" "),
                    e.meta.language.as_deref().unwrap_or(""),
                    first_summary_line(&e.body),
                );
                matcher
                    .fuzzy_match(&haystack, needle)
                    .map(|score| (score, e))
            }
        })
        .collect();

    scored.sort_by(|a, b| b.0.cmp(&a.0).then(b.1.meta.stars.cmp(&a.1.meta.stars)));
    scored.into_iter().map(|(_, e)| e.clone()).collect()
}

fn passes_filters(e: &Entry, q: &SearchQuery) -> bool {
    if let Some(cat) = q.category.as_deref() {
        if !cat.is_empty() && e.meta.category != cat {
            return false;
        }
    }
    if let Some(status) = q.status.as_deref() {
        if !status.is_empty() && e.meta.status != status {
            return false;
        }
    }
    if let Some(min) = q.min_stars {
        if e.meta.stars < min {
            return false;
        }
    }
    // Every requested tag must be present (AND semantics).
    q.tags
        .iter()
        .all(|t| e.meta.tags.iter().any(|et| et.eq_ignore_ascii_case(t)))
}

/// Alternatives for a stale entry: same category, overlapping tags, active, fresher.
/// Logic twin: `alternativesFor` in mcp-server/lib/suggest.js (attached to the
/// MCP get_repo_details response) — keep the formula identical on both sides.
pub fn suggest_alternatives<'a>(
    entries: &'a [Entry],
    target: &Entry,
    max: usize,
) -> Vec<&'a Entry> {
    let mut candidates: Vec<(i64, &Entry)> = entries
        .iter()
        .filter(|e| e.id != target.id)
        .filter(|e| e.meta.category == target.meta.category)
        .filter(|e| e.meta.status == "active")
        .map(|e| {
            let overlap = e
                .meta
                .tags
                .iter()
                .filter(|t| target.meta.tags.iter().any(|tt| tt.eq_ignore_ascii_case(t)))
                .count() as i64;
            (overlap * 1000 + (e.meta.stars as i64).min(999), e)
        })
        .filter(|(score, _)| *score >= 1000) // require at least one shared tag
        .collect();
    candidates.sort_by_key(|c| std::cmp::Reverse(c.0));
    candidates.into_iter().take(max).map(|(_, e)| e).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::EntryMeta;

    fn entry(full_name: &str, category: &str, tags: &[&str], stars: u64, status: &str) -> Entry {
        Entry {
            id: format!("{category}/{}", full_name.replace('/', "-")),
            slug: full_name.replace('/', "-"),
            path: String::new(),
            meta: EntryMeta {
                github_url: format!("https://github.com/{full_name}"),
                full_name: full_name.into(),
                category: category.into(),
                tags: tags.iter().map(|s| s.to_string()).collect(),
                stars,
                language: Some("Rust".into()),
                last_github_push: None,
                last_checked: None,
                status: status.into(),
                source: "manual".into(),
                added_date: None,
            },
            body: format!("# {full_name}\n\nA tool for things."),
        }
    }

    #[test]
    fn filters_and_fuzzy() {
        let entries = vec![
            entry(
                "qdrant/qdrant",
                "ai-agent",
                &["vector-db", "rag"],
                20000,
                "active",
            ),
            entry("chroma/chroma", "ai-agent", &["vector-db"], 15000, "active"),
            entry("sveltejs/kit", "web-app", &["framework"], 19000, "active"),
            entry("old/thing", "ai-agent", &["vector-db"], 50, "stale"),
        ];

        // fuzzy query hits the vector dbs
        let q = SearchQuery {
            query: Some("qdrnt".into()),
            ..Default::default()
        };
        let r = search(&entries, &q);
        assert_eq!(r[0].meta.full_name, "qdrant/qdrant");

        // category + status + min_stars filters
        let q = SearchQuery {
            category: Some("ai-agent".into()),
            status: Some("active".into()),
            min_stars: Some(1000),
            ..Default::default()
        };
        assert_eq!(search(&entries, &q).len(), 2);

        // tag AND semantics
        let q = SearchQuery {
            tags: vec!["vector-db".into(), "rag".into()],
            ..Default::default()
        };
        let r = search(&entries, &q);
        assert_eq!(r.len(), 1);
        assert_eq!(r[0].meta.full_name, "qdrant/qdrant");

        // empty query sorts by stars
        let q = SearchQuery::default();
        assert_eq!(search(&entries, &q)[0].meta.full_name, "qdrant/qdrant");
    }

    #[test]
    fn alternatives_share_tags_and_are_active() {
        let entries = vec![
            entry("old/thing", "ai-agent", &["vector-db"], 50, "stale"),
            entry(
                "qdrant/qdrant",
                "ai-agent",
                &["vector-db", "rag"],
                20000,
                "active",
            ),
            entry("unrelated/x", "ai-agent", &["prompt"], 90000, "active"),
        ];
        let alts = suggest_alternatives(&entries, &entries[0], 3);
        assert_eq!(alts.len(), 1);
        assert_eq!(alts[0].meta.full_name, "qdrant/qdrant");
    }
}
