// compare_repos: side-by-side decision matrix over 2-5 library entries (or a
// whole category shelf). Pure local reads — the owner's Personal Notes travel
// verbatim, because they are the point of comparing from YOUR shelf instead
// of asking the internet.
import { firstSummaryLine, normalizeGithubUrl } from "./store.js";

// Same matching semantics as get_repo_details: entry id ('category/slug'),
// 'owner/repo' full name, or a GitHub URL.
export function resolveSelector(entries, selector) {
  const needle = selector.trim().toLowerCase();
  let fullName = null;
  try {
    fullName = normalizeGithubUrl(selector).fullName.toLowerCase();
  } catch {
    /* not a URL — fall through to id / name matching */
  }
  return (
    entries.find(
      (e) =>
        e.id.toLowerCase() === needle ||
        e.meta.full_name.toLowerCase() === needle ||
        (fullName && e.meta.full_name.toLowerCase() === fullName)
    ) ?? null
  );
}

// The '## Personal Notes' section content, verbatim (heading dropped — the
// field is already named after it). Null when the section is missing.
export function personalNotesSection(body) {
  const text = body ?? "";
  const idx = text.toLowerCase().indexOf("## personal notes");
  if (idx === -1) return null;
  const lines = text.slice(idx).split(/\r?\n/).slice(1);
  const out = [];
  for (const line of lines) {
    if (/^#{1,2}\s/.test(line)) break; // next section ends the notes
    out.push(line);
  }
  const section = out.join("\n").trim();
  return section || null;
}

export function compare(selected) {
  const columns = selected.map((e) => ({
    id: e.id,
    full_name: e.meta.full_name,
    stars: e.meta.stars ?? 0,
    language: e.meta.language ?? null,
    status: e.meta.status ?? "active",
    last_github_push: e.meta.last_github_push ?? null,
    added_date: e.meta.added_date ?? null,
    tags: e.meta.tags ?? [],
    summary: firstSummaryLine(e.body),
    personal_notes: personalNotesSection(e.body),
  }));

  const tagSets = columns.map((c) => new Set(c.tags.map((t) => t.toLowerCase())));
  const shared_tags = [...tagSets[0]].filter((t) => tagSets.every((s) => s.has(t)));
  const unique_tags = Object.fromEntries(
    columns.map((c, i) => [
      c.full_name,
      c.tags.filter((t) => !tagSets.some((s, j) => j !== i && s.has(t.toLowerCase()))),
    ])
  );

  const decision_hints = [];
  for (const c of columns) {
    if (c.status === "stale") {
      decision_hints.push(
        `${c.full_name} is stale (no push since ${c.last_github_push ?? "unknown"}) — check its notes for a named successor`
      );
    } else if (c.status === "archived") {
      decision_hints.push(`${c.full_name} is archived on GitHub — do not adopt for new work`);
    }
  }
  const starLeader = columns.reduce((a, b) => (b.stars > a.stars ? b : a));
  decision_hints.push(`${starLeader.full_name} is the most-starred (${starLeader.stars})`);
  const dated = columns.filter((c) => c.last_github_push);
  if (dated.length >= 2) {
    const oldest = dated.reduce((a, b) => (b.last_github_push < a.last_github_push ? b : a));
    const newest = dated.reduce((a, b) => (b.last_github_push > a.last_github_push ? b : a));
    if (oldest.full_name !== newest.full_name) {
      decision_hints.push(
        `${newest.full_name} has the freshest push (${newest.last_github_push}); ${oldest.full_name} the oldest (${oldest.last_github_push})`
      );
    }
  }
  if (columns.length >= 3) {
    const langCounts = new Map();
    for (const c of columns) {
      if (c.language) langCounts.set(c.language, (langCounts.get(c.language) ?? 0) + 1);
    }
    for (const c of columns) {
      if (c.language && langCounts.get(c.language) === 1 && langCounts.size > 1) {
        decision_hints.push(`${c.full_name} is the only ${c.language} option in this comparison`);
      }
    }
  }

  return { entries: columns, shared_tags, unique_tags, decision_hints };
}
