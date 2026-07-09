// search_repos v2: the lexical filter pipeline plus self-diagnosing empty
// results. LLM callers rarely retry a bare zero — the diagnostics (closest
// real tags, tokens that match nothing library-wide, valid category ids)
// turn one failed call into a second, corrected one. Node-only tool
// ergonomics: the desktop app's fuzzy search (search.rs) is a different
// surface on purpose, so nothing here needs Rust parity.
import { summarize, today } from "./store.js";

export function editDistance(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// Lexical only (no embeddings): containment either way, or edit distance <= 2
// — enough to catch the vectordb/vector-db and hyphenation typo class.
// Containment requires the contained side to be >= 3 chars: short language
// tags ("c", "go") are substrings of half the dictionary and would otherwise
// pollute every suggestion (same failure class as the old tok.includes(tag)
// bug in suggest.js).
function closestTags(vocab, want) {
  const w = want.toLowerCase();
  const contains = (outer, inner) => inner.length >= 3 && outer.includes(inner);
  return vocab
    .filter((t) => t !== w)
    .filter((t) => contains(t, w) || contains(w, t) || editDistance(t, w) <= 2)
    .slice(0, 5);
}

function haystack(e) {
  return `${e.meta.full_name} ${(e.meta.tags ?? []).join(" ")} ${e.meta.language ?? ""} ${e.body}`.toLowerCase();
}

const hasTag = (e, t) => (e.meta.tags ?? []).some((et) => et.toLowerCase() === t.toLowerCase());

const SORT_KEY = {
  stars: (e) => e.meta.stars ?? 0,
  freshness: (e) => (e.meta.last_github_push ? Date.parse(e.meta.last_github_push) : -Infinity),
  added: (e) => (e.meta.added_date ? Date.parse(e.meta.added_date) : -Infinity),
};

export function searchRepos(entries, categories, params = {}) {
  const {
    query,
    category,
    tags,
    any_tags,
    language,
    min_stars,
    status,
    updated_within_days,
    sort = "stars",
    today: todayStr = today(), // injectable for tests
  } = params;

  const rawTokens = (query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  // '-token' negates; a bare '-' is noise and drops out of both lists.
  const exclude = rawTokens.filter((t) => t.startsWith("-") && t.length > 1).map((t) => t.slice(1));
  const include = rawTokens.filter((t) => !t.startsWith("-"));

  const minPush =
    updated_within_days != null
      ? Date.parse(`${todayStr}T00:00:00Z`) - updated_within_days * 86_400_000
      : null;

  const results = entries
    .filter((e) => !category || e.meta.category === category)
    .filter((e) => !status || e.meta.status === status)
    .filter((e) => min_stars == null || (e.meta.stars ?? 0) >= min_stars)
    .filter((e) => !tags?.length || tags.every((t) => hasTag(e, t))) // AND
    .filter((e) => !any_tags?.length || any_tags.some((t) => hasTag(e, t))) // OR
    .filter((e) => !language || (e.meta.language ?? "").toLowerCase() === language.toLowerCase())
    .filter((e) => {
      if (minPush == null) return true;
      const push = e.meta.last_github_push;
      return !!push && Date.parse(`${push}T00:00:00Z`) >= minPush;
    })
    .filter((e) => {
      if (!include.length && !exclude.length) return true;
      const hay = haystack(e);
      return include.every((tok) => hay.includes(tok)) && !exclude.some((tok) => hay.includes(tok));
    });

  const key = SORT_KEY[sort] ?? SORT_KEY.stars;
  results.sort((a, b) => key(b) - key(a));

  const payload = { count: results.length, results: results.map(summarize) };
  if (results.length) return payload;

  // Zero results: explain which ingredient failed instead of a bare zero.
  const vocab = [...new Set(entries.flatMap((e) => (e.meta.tags ?? []).map((t) => t.toLowerCase())))];
  const diagnostics = {};
  const hints = [];

  const tagSuggestions = {};
  for (const t of [...(tags ?? []), ...(any_tags ?? [])]) {
    if (!vocab.includes(t.toLowerCase())) {
      const close = closestTags(vocab, t);
      if (close.length) tagSuggestions[t] = close;
    }
  }
  if (Object.keys(tagSuggestions).length) {
    diagnostics.tag_suggestions = tagSuggestions;
    hints.push(
      Object.entries(tagSuggestions)
        .map(([bad, close]) => `unknown tag "${bad}" — closest real tag${close.length > 1 ? "s" : ""}: ${close.join(", ")}`)
        .join("; ")
    );
  }

  const unmatchedTokens = include.filter((tok) => !entries.some((e) => haystack(e).includes(tok)));
  if (unmatchedTokens.length) {
    diagnostics.unmatched_query_tokens = unmatchedTokens;
    hints.push(`query token(s) matching nothing library-wide: ${unmatchedTokens.join(", ")} — retry without them`);
  }

  if (category && !categories.some((c) => c.id === category)) {
    diagnostics.valid_categories = categories.map((c) => c.id);
    hints.push(`unknown category "${category}" — see valid_categories`);
  }

  if (!hints.length) {
    hints.push(
      "filters are individually valid but their combination matches nothing — relax one (drop min_stars/status, or move tags to any_tags for OR semantics)"
    );
  }
  payload.note = hints.join(". ");
  payload.diagnostics = diagnostics;
  return payload;
}
