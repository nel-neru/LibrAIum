use serde::de::Error as DeError;
use serde::{Deserialize, Deserializer, Serialize};

fn default_status() -> String {
    "active".into()
}

fn default_source() -> String {
    "manual".into()
}

// serde_yaml quirk: a plain numeric scalar (`full_name: 12345`) deserializes
// into String as its raw text. The schema says these fields ARE strings, and
// the Node twin (store.js validateMeta) rejects non-strings — so enforce
// strictness here too and keep the reject contract identical on both sides.
fn strict_string<'de, D: Deserializer<'de>>(d: D) -> Result<String, D::Error> {
    match serde_norway::Value::deserialize(d)? {
        serde_norway::Value::String(s) => Ok(s),
        other => Err(D::Error::custom(format!(
            "expected a string, got {other:?}"
        ))),
    }
}

fn strict_opt_string<'de, D: Deserializer<'de>>(d: D) -> Result<Option<String>, D::Error> {
    match serde_norway::Value::deserialize(d)? {
        serde_norway::Value::Null => Ok(None),
        serde_norway::Value::String(s) => Ok(Some(s)),
        other => Err(D::Error::custom(format!(
            "expected a string or null, got {other:?}"
        ))),
    }
}

fn strict_string_vec<'de, D: Deserializer<'de>>(d: D) -> Result<Vec<String>, D::Error> {
    match serde_norway::Value::deserialize(d)? {
        serde_norway::Value::Sequence(seq) => seq
            .into_iter()
            .map(|v| match v {
                serde_norway::Value::String(s) => Ok(s),
                other => Err(D::Error::custom(format!(
                    "expected an array of strings, got element {other:?}"
                ))),
            })
            .collect(),
        other => Err(D::Error::custom(format!(
            "expected an array of strings, got {other:?}"
        ))),
    }
}

/// YAML frontmatter of one entry file (`data/entries/<category>/<slug>.md`).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct EntryMeta {
    #[serde(deserialize_with = "strict_string")]
    pub github_url: String,
    #[serde(deserialize_with = "strict_string")]
    pub full_name: String,
    #[serde(deserialize_with = "strict_string")]
    pub category: String,
    #[serde(default, deserialize_with = "strict_string_vec")]
    pub tags: Vec<String>,
    #[serde(default)]
    pub stars: u64,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "strict_opt_string"
    )]
    pub language: Option<String>,
    /// YYYY-MM-DD of the latest push on GitHub
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "strict_opt_string"
    )]
    pub last_github_push: Option<String>,
    /// YYYY-MM-DD this entry's metadata was last refreshed
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "strict_opt_string"
    )]
    pub last_checked: Option<String>,
    /// active | stale | archived
    #[serde(default = "default_status", deserialize_with = "strict_string")]
    pub status: String,
    /// manual | mcp | x-collection
    #[serde(default = "default_source", deserialize_with = "strict_string")]
    pub source: String,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "strict_opt_string"
    )]
    pub added_date: Option<String>,
    /// YYYY-MM-DD the `## Reception` section was last synthesized. Reception is
    /// the primary, time-sensitive layer (issues close, projects die), so its
    /// freshness is tracked in machine-readable frontmatter — not just prose.
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "strict_opt_string"
    )]
    pub reception_gathered: Option<String>,
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
    /// Markdown body (summary + `## Reception`, and any firsthand `## Personal Notes`)
    pub body: String,
}

// Same strict-scalar contract as EntryMeta (see the quirk note above): a
// hand-edited `id: 2048` must be rejected here exactly as the Node twin
// (store.js loadCategories) rejects it — never coerced into "2048", which
// would let the two sides disagree about the category master.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    #[serde(deserialize_with = "strict_string")]
    pub id: String,
    #[serde(deserialize_with = "strict_string")]
    pub name: String,
    #[serde(default, deserialize_with = "strict_string")]
    pub color: String,
    #[serde(default, deserialize_with = "strict_string")]
    pub icon: String,
    #[serde(default, deserialize_with = "strict_string")]
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
