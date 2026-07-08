use serde::{Deserialize, Serialize};

fn default_status() -> String {
    "active".into()
}

fn default_source() -> String {
    "manual".into()
}

/// YAML frontmatter of one entry file (`data/entries/<category>/<slug>.md`).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct EntryMeta {
    pub github_url: String,
    pub full_name: String,
    pub category: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub stars: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    /// YYYY-MM-DD of the latest push on GitHub
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_github_push: Option<String>,
    /// YYYY-MM-DD this entry's metadata was last refreshed
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_checked: Option<String>,
    /// active | stale | archived
    #[serde(default = "default_status")]
    pub status: String,
    /// manual | mcp | x-collection
    #[serde(default = "default_source")]
    pub source: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub added_date: Option<String>,
}

/// A fully loaded entry: metadata + Markdown body + its location.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entry {
    /// "<category>/<slug>" — stable identifier derived from the file path
    pub id: String,
    pub slug: String,
    /// Absolute path of the backing file
    pub path: String,
    pub meta: EntryMeta,
    /// Markdown body (summary + `## Personal Notes`)
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub color: String,
    #[serde(default)]
    pub icon: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryFile {
    pub categories: Vec<Category>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SearchQuery {
    #[serde(default)]
    pub query: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub min_stars: Option<u64>,
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct RefreshReport {
    pub refreshed: usize,
    pub became_stale: usize,
    pub errors: Vec<String>,
}
