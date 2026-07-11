// get_related: the structured relationship graph around one library entry.
//
// Node-only, no Rust twin — get_related has no desktop consumer, so this file is
// deliberately kept out of the parity-watched store.js (same discipline as
// suggest.js / overview.js). Edges are authored one-directionally in the
// frontmatter (superseded_by / pairs_with, see models.rs); this module derives
// the inverse (supersedes) and the symmetric union (pairs_with) at read time, so
// the stored data can never disagree with itself.
import { summarize } from "./store.js";

// Resolve full_names to shelved entries (summarized, shelved:true) or, for a
// target not in the library, a bare {full_name, shelved:false} — a migration
// target may be recorded before it is added to the shelf.
export function resolveNames(entries, names) {
  return (names ?? []).map((name) => {
    const hit = entries.find((e) => e.meta.full_name?.toLowerCase() === name.toLowerCase());
    return hit ? { ...summarize(hit), shelved: true } : { full_name: name, shelved: false };
  });
}

// Everything related to `target`: forward succession (authored superseded_by),
// reverse succession (derived — who lists target as their superseded_by), and
// the symmetric pairings (target's own pairs_with unioned with entries that
// point back at it). All full_name comparison is case-insensitive.
export function getRelated(entries, target) {
  const self = target.meta.full_name.toLowerCase();

  const superseded_by = resolveNames(entries, target.meta.superseded_by);

  const supersedes = entries
    .filter((e) => (e.meta.superseded_by ?? []).some((n) => n.toLowerCase() === self))
    .map((e) => ({ ...summarize(e), shelved: true }));

  const pairNames = [];
  const seen = new Set();
  const own = target.meta.pairs_with ?? [];
  const back = entries
    .filter((e) => (e.meta.pairs_with ?? []).some((n) => n.toLowerCase() === self))
    .map((e) => e.meta.full_name);
  for (const name of [...own, ...back]) {
    const key = name.toLowerCase();
    if (key === self || seen.has(key)) continue;
    seen.add(key);
    pairNames.push(name);
  }
  const pairs_with = resolveNames(entries, pairNames);

  return { superseded_by, supersedes, pairs_with };
}
