import { api } from "./api.js";

export const app = $state({
  view: "dashboard", // dashboard | library | categories | settings
  entries: [],
  results: [],
  categories: [],
  settings: { data_dir: "", stale_days: 180 },
  dataDir: "",
  filters: { query: "", category: "", tag: "", status: "", minStars: "" },
  selectedId: null,
  showAdd: false,
  loading: false,
  busy: "", // label of a long-running action
  error: "",
  toast: "",
});

let toastTimer;
export function showToast(msg) {
  app.toast = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (app.toast = ""), 3500);
}

export function fail(e) {
  const msg = typeof e === "string" ? e : (e?.message ?? String(e));
  app.error = msg;
  showToast(`⚠ ${msg}`);
}

export async function bootstrap() {
  app.loading = true;
  try {
    const [entries, categories, settings, dataDir] = await Promise.all([
      api.listEntries(),
      api.getCategories(),
      api.getSettings(),
      api.getDataDir(),
    ]);
    app.entries = entries;
    app.results = entries;
    app.categories = categories;
    app.settings = settings;
    app.dataDir = dataDir;
  } catch (e) {
    fail(e);
  } finally {
    app.loading = false;
  }
}

export async function reloadEntries() {
  try {
    app.entries = await api.listEntries();
    await runSearch();
  } catch (e) {
    fail(e);
  }
}

export async function runSearch() {
  const f = app.filters;
  try {
    app.results = await api.searchEntries({
      query: f.query || null,
      category: f.category || null,
      tags: f.tag ? [f.tag] : [],
      min_stars: f.minStars === "" || f.minStars === null ? null : Number(f.minStars),
      status: f.status || null,
    });
  } catch (e) {
    fail(e);
  }
}

export function openLibraryWith(patch) {
  Object.assign(app.filters, { query: "", category: "", tag: "", status: "", minStars: "" }, patch);
  app.view = "library";
  runSearch();
}

export function selectEntry(id) {
  app.selectedId = id;
}

export function categoryOf(id) {
  return app.categories.find((c) => c.id === id);
}

export function categoryColor(id) {
  return categoryOf(id)?.color || "#64748b";
}
