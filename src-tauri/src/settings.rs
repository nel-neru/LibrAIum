use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::error::Result;

/// Default category master, shipped with the app; used to bootstrap new data dirs.
pub const DEFAULT_CATEGORIES_YAML: &str = include_str!("../../data/master/categories.yaml");

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Settings {
    /// Root of the data git repository. Empty = auto-resolve.
    pub data_dir: String,
    /// Days without a GitHub push before an entry is flagged stale.
    pub stale_days: u32,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            data_dir: String::new(),
            stale_days: 180,
        }
    }
}

pub fn load(config_dir: &Path) -> Settings {
    let path = config_dir.join("settings.json");
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save(config_dir: &Path, settings: &Settings) -> Result<()> {
    fs::create_dir_all(config_dir)?;
    fs::write(
        config_dir.join("settings.json"),
        serde_json::to_string_pretty(settings)?,
    )?;
    Ok(())
}

impl From<serde_json::Error> for crate::error::AppError {
    fn from(e: serde_json::Error) -> Self {
        crate::error::AppError::Message(format!("json error: {e}"))
    }
}

/// Resolution order: explicit setting > env var > repo-local ./data (dev) > ~/LibrAIum/data.
pub fn resolve_data_dir(settings: &Settings) -> PathBuf {
    resolve_data_dir_from(
        settings,
        std::env::var("LIBRAIUM_DATA_DIR").ok().as_deref(),
        Path::new(""),
    )
}

/// Testable core of [`resolve_data_dir`]: the env-var value and the base dir
/// for the dev-repo candidates are injected so tests never mutate process
/// globals (env vars / cwd are shared across parallel test threads).
fn resolve_data_dir_from(settings: &Settings, env_dir: Option<&str>, cwd: &Path) -> PathBuf {
    if !settings.data_dir.trim().is_empty() {
        return PathBuf::from(settings.data_dir.trim());
    }
    if let Some(env_dir) = env_dir {
        if !env_dir.trim().is_empty() {
            return PathBuf::from(env_dir.trim());
        }
    }
    for candidate in ["data", "../data"] {
        let p = cwd.join(candidate);
        if p.join("master").join("categories.yaml").exists() {
            return p.canonicalize().unwrap_or(p);
        }
    }
    dirs_home().join("LibrAIum").join("data")
}

fn dirs_home() -> PathBuf {
    std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."))
}

/// Make a data dir usable: entries/, category master, git repo (best-effort).
pub fn bootstrap_data_dir(dir: &Path) -> Result<()> {
    fs::create_dir_all(dir.join("entries"))?;
    let master = dir.join("master");
    fs::create_dir_all(&master)?;
    let categories = master.join("categories.yaml");
    if !categories.exists() {
        fs::write(&categories, DEFAULT_CATEGORIES_YAML)?;
    }
    // Git-native by design; but a missing git identity must not block first run.
    if let Err(e) = crate::gitops::ensure_repo(dir) {
        eprintln!("[libraium] data dir git init skipped: {e}");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bootstrap_creates_layout() {
        let dir = std::env::temp_dir().join(format!("libraium-boot-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        bootstrap_data_dir(&dir).unwrap();
        assert!(dir.join("entries").is_dir());
        assert!(dir.join("master/categories.yaml").is_file());
        let cats = crate::categories::load(&dir).unwrap();
        assert!(cats.iter().any(|c| c.id == "ai-agent"));
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn resolve_data_dir_precedence() {
        let blank = Settings::default();
        let nowhere = Path::new("/nonexistent-libraium-test");

        // 1. explicit setting wins over everything (and is trimmed)
        let explicit = Settings {
            data_dir: "  /explicit/dir  ".into(),
            stale_days: 180,
        };
        assert_eq!(
            resolve_data_dir_from(&explicit, Some("/env/dir"), nowhere),
            PathBuf::from("/explicit/dir")
        );

        // 2. env var wins when the setting is blank; whitespace-only env falls through
        assert_eq!(
            resolve_data_dir_from(&blank, Some(" /env/dir "), nowhere),
            PathBuf::from("/env/dir")
        );

        // 3. dev-repo candidates: ./data, then ../data (probed from `cwd`)
        let tmp =
            std::env::temp_dir().join(format!("libraium-resolve-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(tmp.join("data/master")).unwrap();
        fs::write(tmp.join("data/master/categories.yaml"), "categories: []\n").unwrap();
        fs::create_dir_all(tmp.join("sub")).unwrap();

        let expected = tmp.join("data").canonicalize().unwrap();
        assert_eq!(resolve_data_dir_from(&blank, Some("  "), &tmp), expected);
        assert_eq!(
            resolve_data_dir_from(&blank, None, &tmp.join("sub")),
            expected,
            "../data candidate"
        );

        // 4. nothing anywhere -> ~/LibrAIum/data
        let fallback = resolve_data_dir_from(&blank, None, nowhere);
        assert!(
            fallback.ends_with("LibrAIum/data"),
            "got: {}",
            fallback.display()
        );
        assert!(fallback.starts_with(dirs_home()));

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn settings_roundtrip() {
        let dir = std::env::temp_dir().join(format!("libraium-set-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        let s = Settings {
            data_dir: "/tmp/x".into(),
            stale_days: 90,
        };
        save(&dir, &s).unwrap();
        let loaded = load(&dir);
        assert_eq!(loaded.data_dir, "/tmp/x");
        assert_eq!(loaded.stale_days, 90);
        let _ = fs::remove_dir_all(&dir);
    }
}
