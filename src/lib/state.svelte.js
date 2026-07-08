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
  // Per-action in-flight flags. Deliberately not one shared string: three
  // independent long-running actions must not clobber each other's guard
  // and button label (starting refresh-one used to "finish" refresh-all).
  busy: { refreshAll: false, refreshOne: false, push: false },
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

// list_entries now reports files it had to skip — a silently shrunken
// library is worse than a noisy toast.
function notifyEntryWarnings(warnings = []) {
  if (!warnings.length) return;
  console.warn("[libraium] skipped entry files:", warnings);
  showToast(`⚠ ${warnings.length} entry file(s) skipped — check data/entries (details in console)`);
}

export async function bootstrap() {
  app.loading = true;
  try {
    const [{ entries, warnings }, categories, settings, dataDir] = await Promise.all([
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
    notifyEntryWarnings(warnings);
  } catch (e) {
    fail(e);
  } finally {
    app.loading = false;
  }
}

export async function reloadEntries() {
  try {
    const { entries, warnings } = await api.listEntries();
    app.entries = entries;
    notifyEntryWarnings(warnings);
    await runSearch();
  } catch (e) {
    fail(e);
  }
}

// Chip clicks call runSearch() directly (bypassing Library's debounce), so
// two searches can be in flight; last-to-RESOLVE must not win over
// last-DISPATCHED. Same sequence-token pattern as EntryDetail's load().
let searchSeq = 0;

export async function runSearch() {
  const f = app.filters;
  const seq = ++searchSeq;
  try {
    const results = await api.searchEntries({
      query: f.query || null,
      category: f.category || null,
      tags: f.tag ? [f.tag] : [],
      min_stars: f.minStars === "" || f.minStars === null ? null : Number(f.minStars),
      status: f.status || null,
    });
    if (seq !== searchSeq) return; // stale response
    app.results = results;
  } catch (e) {
    if (seq !== searchSeq) return; // stale failure
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
  return categoryOf(id)?.color || "#878580"; // Flexoki base-500 — unknown category
}
