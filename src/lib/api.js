import { invoke } from "@tauri-apps/api/core";

// Thin wrappers over the Tauri commands. Command args are camelCase here and
// converted to snake_case Rust params by Tauri; *struct fields* inside payloads
// (EntryMeta, SearchQuery, ...) keep their serde snake_case names.
export const api = {
  // settings
  getSettings: () => invoke("get_settings"),
  updateSettings: (newSettings) => invoke("update_settings", { newSettings }),
  getDataDir: () => invoke("get_data_dir"),

  // entries
  listEntries: () => invoke("list_entries"),
  searchEntries: (query) => invoke("search_entries", { query }),
  getEntry: (id) => invoke("get_entry", { id }),
  saveEntry: (meta, body, previousId) => invoke("save_entry", { meta, body, previousId }),
  deleteEntry: (id) => invoke("delete_entry", { id }),
  checkDuplicate: (githubUrl) => invoke("check_duplicate", { githubUrl }),
  addRepoFromUrl: (githubUrl, category, tags, notes) =>
    invoke("add_repo_from_url", { githubUrl, category, tags, notes }),

  // metadata refresh
  refreshEntry: (id) => invoke("refresh_entry", { id }),
  refreshAll: () => invoke("refresh_all"),
  suggestAlternatives: (id) => invoke("suggest_alternatives", { id }),

  // categories
  getCategories: () => invoke("get_categories"),
  saveCategories: (cats) => invoke("save_categories", { cats }),

  // export
  exportAwesome: () => invoke("export_awesome"),

  // git
  gitStatus: () => invoke("git_status"),
  gitInitData: () => invoke("git_init_data"),
  gitCommit: (message) => invoke("git_commit", { message }),
  gitPush: () => invoke("git_push"),
  gitLog: (n) => invoke("git_log", { n }),

  // github token (OS keychain)
  hasGithubToken: () => invoke("has_github_token"),
  setGithubToken: (token) => invoke("set_github_token", { token }),
  clearGithubToken: () => invoke("clear_github_token"),
};
