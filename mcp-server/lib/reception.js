// find_by_reception: query the library's moat — the synthesized third-party
// Reception — structurally, without changing how it's stored. Reception is
// authored as attributive bullets ("Adopters include…", "Teams migrate to…",
// "the most-reacted issue complains…", each with a source), so a lexical scan
// over those bullets already answers "which repos have a documented memory
// complaint?" / "who names adopter X?" / "what has migration signal?" — none of
// which the whole-entry search surfaces as evidence. Node-only, no format change
// (kept out of the parity-watched store.js, like related.js/overview.js).
import { bodySection } from "./store.js";

// Cue vocabularies per signal. Lowercased substring match against each bullet.
const CUES = {
  migration: [
    "migrate", "migrated", "migrating", "migration",
    "superseded", "supersede", "replaced by", "replacement",
    "moved to", "moving to", "switch to", "switching to", "switched to",
    "instead of", "in favor of", "successor", "deprecated in favor",
  ],
  caution: [
    "gotcha", "caveat", "avoid", "deprecated", "unmaintained", "abandoned",
    "memory leak", "leak", "breaking change", "regression", "footgun",
    "sharp edge", "limitation", "buggy", "fragile", "flaky", "slow",
    "not production", "don't", "avoid using", "watch out", "pitfall",
  ],
  adopter: [
    "adopter", "adopters include", "adopted by", "used by", "used in production",
    "in production at", "powers", "trusted by", "companies using", "relied on by",
    "runs at", "deployed at",
  ],
};

// The `- ` bullets of an entry's `## Reception` section (provenance comment and
// blank lines dropped). Empty when the section is absent or has no real bullets.
export function receptionBullets(entry) {
  const section = bodySection(entry.body ?? "", "reception");
  if (!section) return [];
  return section
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);
}

// Entries whose Reception bullets match a free-text `query` (case-insensitive
// substring) AND/OR a `signal` cue set. Returns each match with the specific
// bullets that hit, so the caller sees the evidence, not the whole entry. The
// caller must pass at least one criterion (an all-match query is not useful).
export function findByReception(entries, { query, signal } = {}) {
  const q = query?.trim().toLowerCase() || null;
  const cues = signal ? CUES[signal] : null;
  if (!q && !cues) return [];

  const out = [];
  for (const e of entries) {
    const bullets = receptionBullets(e);
    if (!bullets.length) continue;
    const matches = bullets.filter((b) => {
      const lb = b.toLowerCase();
      return (q ? lb.includes(q) : true) && (cues ? cues.some((c) => lb.includes(c)) : true);
    });
    if (matches.length) {
      out.push({
        id: e.id,
        full_name: e.meta.full_name,
        category: e.meta.category,
        status: e.meta.status ?? "active",
        matches,
      });
    }
  }
  return out;
}
