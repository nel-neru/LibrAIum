use std::path::PathBuf;
use std::sync::Mutex;

use chrono::Utc;
use tauri::State;

use crate::models::{Category, Entry, EntryMeta, RefreshReport, SearchQuery};
use crate::settings::Settings;
use crate::{categories, github, gitops, search, settings, store};

pub struct AppState {
    pub config_dir: PathBuf,
    pub settings: Mutex<Settings>,
}

impl AppState {
    fn snapshot(&self) -> Settings {
        self.settings.lock().expect("settings lock").clone()
    }
    fn data_dir(&self) -> PathBuf {
        settings::resolve_data_dir(&self.snapshot())
    }
}

const KEYRING_SERVICE: &str = "LibrAIum";
const KEYRING_USER: &str = "github_token";

fn read_github_token() -> Option<String> {
    keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .ok()?
        .get_password()
        .ok()
        .filter(|t| !t.is_empty())
}

fn today() -> String {
    Utc::now().date_naive().format("%Y-%m-%d").to_string()
}

type CmdResult<T> = Result<T, String>;

fn err<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

// ---------- settings ----------

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> Settings {
    state.snapshot()
}

#[tauri::command]
pub fn update_settings(state: State<AppState>, new_settings: Settings) -> CmdResult<Settings> {
    settings::save(&state.config_dir, &new_settings).map_err(err)?;
    let resolved = settings::resolve_data_dir(&new_settings);
    settings::bootstrap_data_dir(&resolved).map_err(err)?;
    *state.settings.lock().expect("settings lock") = new_settings.clone();
    Ok(new_settings)
}

#[tauri::command]
pub fn get_data_dir(state: State<AppState>) -> String {
    state.data_dir().to_string_lossy().to_string()
}

// ---------- entries ----------

#[derive(serde::Serialize)]
pub struct EntriesPayload {
    pub entries: Vec<Entry>,
    /// Files/dirs skipped during the scan — surfaced as a GUI toast so a
    /// shrunken list is never silent.
    pub warnings: Vec<String>,
}

#[tauri::command]
pub fn list_entries(state: State<AppState>) -> CmdResult<EntriesPayload> {
    let (entries, warnings) = store::scan_entries(&state.data_dir()).map_err(err)?;
    Ok(EntriesPayload { entries, warnings })
}

#[tauri::command]
pub fn search_entries(state: State<AppState>, query: SearchQuery) -> CmdResult<Vec<Entry>> {
    let entries = store::list_entries(&state.data_dir()).map_err(err)?;
    Ok(search::search(&entries, &query))
}

#[tauri::command]
pub fn get_entry(state: State<AppState>, id: String) -> CmdResult<Entry> {
    store::get_entry(&state.data_dir(), &id).map_err(err)
}

#[tauri::command]
pub fn save_entry(
    state: State<AppState>,
    meta: EntryMeta,
    body: String,
    previous_id: Option<String>,
) -> CmdResult<Entry> {
    store::save_entry(&state.data_dir(), &meta, &body, previous_id.as_deref()).map_err(err)
}

#[tauri::command]
pub fn delete_entry(state: State<AppState>, id: String) -> CmdResult<()> {
    store::delete_entry(&state.data_dir(), &id).map_err(err)
}

#[tauri::command]
pub fn check_duplicate(state: State<AppState>, github_url: String) -> CmdResult<Option<Entry>> {
    let (full_name, _) = store::normalize_github_url(&github_url).map_err(err)?;
    store::find_duplicate(&state.data_dir(), &full_name).map_err(err)
}

/// Register a repo from just its URL: fetch metadata and create the entry.
#[tauri::command]
pub async fn add_repo_from_url(
    state: State<'_, AppState>,
    github_url: String,
    category: String,
    tags: Vec<String>,
    notes: Option<String>,
) -> CmdResult<Entry> {
    let data_dir = state.data_dir();
    let stale_days = state.snapshot().stale_days;
    tauri::async_runtime::spawn_blocking(move || {
        let (full_name, _) = store::normalize_github_url(&github_url).map_err(err)?;
        if let Some(existing) = store::find_duplicate(&data_dir, &full_name).map_err(err)? {
            return Err(format!("already registered as {}", existing.id));
        }
        let gh = github::fetch_repo(&full_name, read_github_token().as_deref()).map_err(err)?;
        // A renamed repo 301-redirects and the API returns the NEW full_name —
        // re-check duplicates under it, or a rename bypasses the check above.
        store::guard_redirected_duplicate(&data_dir, &full_name, &gh.full_name).map_err(err)?;
        let push_date: Option<String> = gh
            .pushed_at
            .as_deref()
            .map(|s| s.chars().take(10).collect());
        let meta = EntryMeta {
            // Derived from the API's post-redirect name, not the typed URL, so
            // github_url can never contradict full_name (validate-data invariant).
            github_url: format!("https://github.com/{}", gh.full_name),
            full_name: gh.full_name.clone(),
            category,
            tags,
            stars: gh.stargazers_count,
            language: gh.language.clone(),
            last_github_push: push_date.clone(),
            last_checked: Some(today()),
            status: github::compute_status(
                gh.archived,
                push_date.as_deref(),
                Utc::now().date_naive(),
                stale_days,
            ),
            source: "manual".into(),
            added_date: Some(today()),
        };
        let repo_name = gh.full_name.split('/').next_back().unwrap_or(&gh.full_name);
        let body = format!(
            "# {}\n\n{}\n\n## Personal Notes\n\n{}\n",
            repo_name,
            gh.description.as_deref().unwrap_or("(no description)"),
            notes.as_deref().unwrap_or("- "),
        );
        store::save_entry(&data_dir, &meta, &body, None).map_err(err)
    })
    .await
    .map_err(err)?
}

// ---------- metadata refresh ----------

#[tauri::command]
pub async fn refresh_entry(state: State<'_, AppState>, id: String) -> CmdResult<Entry> {
    let data_dir = state.data_dir();
    let stale_days = state.snapshot().stale_days;
    tauri::async_runtime::spawn_blocking(move || {
        let mut entry = store::get_entry(&data_dir, &id).map_err(err)?;
        let gh = github::fetch_repo(&entry.meta.full_name, read_github_token().as_deref())
            .map_err(err)?;
        github::apply_refresh(&mut entry, &gh, stale_days);
        store::save_entry(&data_dir, &entry.meta, &entry.body, Some(&entry.id)).map_err(err)
    })
    .await
    .map_err(err)?
}

#[tauri::command]
pub async fn refresh_all(state: State<'_, AppState>) -> CmdResult<RefreshReport> {
    let data_dir = state.data_dir();
    let stale_days = state.snapshot().stale_days;
    tauri::async_runtime::spawn_blocking(move || {
        let token = read_github_token();
        let entries = store::list_entries(&data_dir).map_err(err)?;
        let mut report = RefreshReport {
            refreshed: 0,
            became_stale: 0,
            errors: Vec::new(),
        };
        for mut entry in entries {
            match github::fetch_repo(&entry.meta.full_name, token.as_deref()) {
                Ok(gh) => {
                    if github::apply_refresh(&mut entry, &gh, stale_days) {
                        report.became_stale += 1;
                    }
                    match store::save_entry(&data_dir, &entry.meta, &entry.body, Some(&entry.id)) {
                        Ok(_) => report.refreshed += 1,
                        Err(e) => report.errors.push(format!("{}: {e}", entry.id)),
                    }
                }
                Err(e @ crate::error::AppError::RateLimited(_)) => {
                    // Every remaining request would fail the same way (60/hr
                    // unauthenticated) — stop the sweep with ONE clear error.
                    report.errors.push(format!(
                        "{e} — aborted the remaining refreshes; retry after setting a token."
                    ));
                    break;
                }
                Err(e) => report.errors.push(e.to_string()),
            }
            // be polite to the API; also keeps unauthenticated bursts under control
            std::thread::sleep(std::time::Duration::from_millis(150));
        }
        Ok(report)
    })
    .await
    .map_err(err)?
}

#[tauri::command]
pub fn suggest_alternatives(state: State<AppState>, id: String) -> CmdResult<Vec<Entry>> {
    let data_dir = state.data_dir();
    let target = store::get_entry(&data_dir, &id).map_err(err)?;
    let entries = store::list_entries(&data_dir).map_err(err)?;
    Ok(search::suggest_alternatives(&entries, &target, 3)
        .into_iter()
        .cloned()
        .collect())
}

// ---------- categories ----------

#[tauri::command]
pub fn get_categories(state: State<AppState>) -> CmdResult<Vec<Category>> {
    categories::load(&state.data_dir()).map_err(err)
}

#[tauri::command]
pub fn save_categories(state: State<AppState>, cats: Vec<Category>) -> CmdResult<Vec<Category>> {
    let data_dir = state.data_dir();
    categories::save(&data_dir, &cats).map_err(err)?;
    categories::load(&data_dir).map_err(err)
}

// ---------- export ----------

#[tauri::command]
pub fn export_awesome(state: State<AppState>) -> CmdResult<String> {
    let data_dir = state.data_dir();
    let entries = store::list_entries(&data_dir).map_err(err)?;
    let cats = categories::load(&data_dir).map_err(err)?;
    Ok(store::export_awesome_list(&entries, &cats))
}

// ---------- git ----------

#[tauri::command]
pub fn git_status(state: State<AppState>) -> CmdResult<gitops::GitStatus> {
    gitops::status(&state.data_dir()).map_err(err)
}

#[tauri::command]
pub fn git_init_data(state: State<AppState>) -> CmdResult<gitops::GitStatus> {
    let data_dir = state.data_dir();
    gitops::ensure_repo(&data_dir).map_err(err)?;
    gitops::status(&data_dir).map_err(err)
}

#[tauri::command]
pub fn git_commit(state: State<AppState>, message: String) -> CmdResult<String> {
    gitops::commit_all(&state.data_dir(), &message).map_err(err)
}

#[tauri::command]
pub async fn git_push(state: State<'_, AppState>) -> CmdResult<String> {
    let data_dir = state.data_dir();
    tauri::async_runtime::spawn_blocking(move || gitops::push(&data_dir).map_err(err))
        .await
        .map_err(err)?
}

#[tauri::command]
pub fn git_log(state: State<AppState>, n: usize) -> CmdResult<Vec<gitops::LogItem>> {
    gitops::log(&state.data_dir(), n.clamp(1, 100)).map_err(err)
}

// ---------- github token (OS keychain) ----------

#[tauri::command]
pub fn has_github_token() -> bool {
    read_github_token().is_some()
}

#[tauri::command]
pub fn set_github_token(token: String) -> CmdResult<()> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER).map_err(err)?;
    if token.trim().is_empty() {
        return Err("token must not be empty".into());
    }
    entry.set_password(token.trim()).map_err(err)
}

#[tauri::command]
pub fn clear_github_token() -> CmdResult<()> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER).map_err(err)?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(err(e)),
    }
}
