pub mod categories;
mod commands;
pub mod error;
pub mod frontmatter;
pub mod github;
mod gitops;
pub mod models;
pub mod search;
pub mod settings;
pub mod store;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let config_dir = app
                .path()
                .app_config_dir()
                .expect("cannot resolve app config dir");
            std::fs::create_dir_all(&config_dir).ok();
            let loaded = settings::load(&config_dir);
            let data_dir = settings::resolve_data_dir(&loaded);
            if let Err(e) = settings::bootstrap_data_dir(&data_dir) {
                eprintln!(
                    "[libraium] failed to bootstrap data dir {}: {e}",
                    data_dir.display()
                );
            }
            app.manage(commands::AppState {
                config_dir,
                settings: std::sync::Mutex::new(loaded),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::update_settings,
            commands::get_data_dir,
            commands::list_entries,
            commands::search_entries,
            commands::get_entry,
            commands::save_entry,
            commands::delete_entry,
            commands::check_duplicate,
            commands::add_repo_from_url,
            commands::refresh_entry,
            commands::refresh_all,
            commands::suggest_alternatives,
            commands::get_categories,
            commands::save_categories,
            commands::export_awesome,
            commands::git_status,
            commands::git_init_data,
            commands::git_commit,
            commands::git_push,
            commands::git_log,
            commands::has_github_token,
            commands::set_github_token,
            commands::clear_github_token,
        ])
        .run(tauri::generate_context!())
        .expect("error while running LibrAIum");
}
