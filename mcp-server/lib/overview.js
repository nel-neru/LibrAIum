// get_library_overview: the one cheap call that stops agents from guessing.
// Category ids and tags must match exactly for search_repos filters and
// add_repo to work — this returns the real vocabulary, per-shelf health
// counts, and the resolved data dir (the #1 thing that goes wrong in
// practice). Read-only, no network.

function countTags(entries) {
  const counts = {};
  for (const e of entries) {
    for (const t of e.meta.tags ?? []) {
      const k = t.toLowerCase();
      counts[k] = (counts[k] ?? 0) + 1;
    }
  }
  return counts;
}

function byCountThenName(a, b) {
  return b[1] - a[1] || a[0].localeCompare(b[0]);
}

export function overview(entries, categories, dataDir) {
  const cats = categories.map((c) => {
    const inCat = entries.filter((e) => e.meta.category === c.id);
    return {
      id: c.id,
      name: c.name,
      description: c.description || null,
      entry_count: inCat.length,
      stale_count: inCat.filter((e) => e.meta.status === "stale").length,
      archived_count: inCat.filter((e) => e.meta.status === "archived").length,
      top_tags: Object.entries(countTags(inCat)).sort(byCountThenName).slice(0, 5).map(([t]) => t),
    };
  });
  // Entries whose category id is missing from the master (e.g. an id renamed
  // in the GUI) would silently vanish from the per-category map — surface them.
  const knownIds = new Set(categories.map((c) => c.id));
  const orphaned = entries.filter((e) => !knownIds.has(e.meta.category)).map((e) => e.id);
  return {
    data_dir: dataDir,
    totals: {
      entries: entries.length,
      stale: entries.filter((e) => e.meta.status === "stale").length,
      archived: entries.filter((e) => e.meta.status === "archived").length,
      categories: categories.length,
    },
    categories: cats,
    tags: Object.fromEntries(Object.entries(countTags(entries)).sort(byCountThenName)),
    ...(orphaned.length ? { orphaned_entries: orphaned } : {}),
  };
}
