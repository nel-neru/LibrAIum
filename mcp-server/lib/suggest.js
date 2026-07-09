// Ranking for suggest_for_new_project: lexical scoring of the project
// description against tags, category, name, language and body text.
import { firstSummaryLine, bodySection } from "./store.js";

const STOPWORDS = new Set(
  "a an and are as at be by for from has have i in is it my of on or that the to want with using use build make new project app".split(" ")
);

export function tokenize(text) {
  return [...new Set(
    (text ?? "")
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      // '.' stays in the split class for names like node.js / .net, but a
      // sentence-final period would otherwise glue onto the last word of
      // every sentence ("…in Rust." → "rust.") and silently miss the exact
      // language match and substring category/name matching. Strip trailing
      // dots only; stripped tokens re-pass the length/stopword filter below.
      .map((t) => t.replace(/\.+$/, ""))
      .filter((t) => t.length > 1 && !STOPWORDS.has(t))
  )];
}

export function scoreEntry(entry, tokens, categories) {
  // Relevance must come from the query: `lexical` accumulates token-derived
  // evidence only. Status and stars adjust the final score (ranking among
  // relevant entries) but can never make an entry relevant by themselves.
  let lexical = 0;
  const reasons = [];

  const tags = (entry.meta.tags ?? []).map((t) => t.toLowerCase());
  // Tag evidence flows one way: a query token equal to, or contained in, a
  // (usually compound, kebab-case) tag — "vector" hits vector-db. The reverse
  // direction (tag inside token) is never evidence: it turns short tags into
  // wildcards ("c" ⊂ "cobol", "rag" ⊂ "dragon") the moment single-word
  // language tags exist in the taxonomy.
  const tagHits = tags.filter((tag) => tokens.some((tok) => tag.includes(tok)));
  if (tagHits.length) {
    lexical += tagHits.length * 8;
    reasons.push(`tags match: ${tagHits.join(", ")}`);
  }

  const cat = categories.find((c) => c.id === entry.meta.category);
  const catText = `${entry.meta.category} ${cat?.name ?? ""} ${cat?.description ?? ""}`.toLowerCase();
  const catHits = tokens.filter((tok) => catText.includes(tok));
  if (catHits.length) {
    lexical += Math.min(catHits.length, 3) * 3;
    reasons.push(`category "${entry.meta.category}" is relevant`);
  }

  const nameHits = tokens.filter((tok) => entry.meta.full_name.toLowerCase().includes(tok));
  if (nameHits.length) {
    lexical += nameHits.length * 6;
    reasons.push(`name matches: ${nameHits.join(", ")}`);
  }

  const lang = (entry.meta.language ?? "").toLowerCase();
  if (lang && tokens.includes(lang)) {
    lexical += 4;
    reasons.push(`written in ${entry.meta.language}`);
  }

  const bodyLower = entry.body.toLowerCase();
  const bodyHits = tokens.filter((tok) => bodyLower.includes(tok));
  lexical += Math.min(bodyHits.length, 10);

  // Reward query relevance landing inside the curated sections — the community
  // Reception layer or, for entries the owner has used, firsthand Personal Notes.
  const sectionIdxs = ["## reception", "## personal notes"]
    .map((h) => bodyLower.indexOf(h))
    .filter((i) => i !== -1);
  const notesIdx = sectionIdxs.length ? Math.min(...sectionIdxs) : -1;
  if (notesIdx !== -1 && bodyHits.some((tok) => bodyLower.indexOf(tok, notesIdx) !== -1)) {
    lexical += 3;
    reasons.push("its Reception/notes mention related topics");
  }

  let score = lexical;
  switch (entry.meta.status) {
    case "active": score += 3; break;
    case "stale": score -= 3; reasons.push("⚠ flagged stale — verify before adopting"); break;
    case "archived": score -= 6; reasons.push("⚠ archived on GitHub"); break;
  }

  score += Math.min(Math.log10((entry.meta.stars ?? 0) + 1) * 1.2, 6);

  return { score: Math.round(score * 10) / 10, lexical, reasons };
}

// Mirror of Rust search::suggest_alternatives (src-tauri/src/search.rs) —
// keep the formula identical on BOTH sides: candidates share the target's
// category, are active, and are not the target; score = sharedTagCount * 1000
// + min(stars, 999); require >= 1000 (at least one shared tag); sort by score
// desc (stable), take max. Tag comparison is ASCII-case-insensitive
// (eq_ignore_ascii_case parity — tags are kebab-case ASCII by convention).
export function alternativesFor(entries, target, max = 3) {
  return entries
    .filter((e) => e.id !== target.id)
    .filter((e) => e.meta.category === target.meta.category)
    .filter((e) => (e.meta.status ?? "active") === "active")
    .map((e) => {
      const overlap = (e.meta.tags ?? []).filter((t) =>
        (target.meta.tags ?? []).some((tt) => tt.toLowerCase() === t.toLowerCase())
      ).length;
      return { score: overlap * 1000 + Math.min(e.meta.stars ?? 0, 999), e };
    })
    .filter(({ score }) => score >= 1000)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ e }) => e);
}

// Bullets whose wording signals a warning — surfaced ahead of neutral notes.
const CAUTION_CUES = ["gotcha", "caveat", "avoid", "superseded", "don't", "instead", "deprecated", "watch", "⚠"];

// The owner's firsthand notes are the library's core value; inline up to 3
// bullets so the single suggest call carries them without a get_repo_details
// follow-up. Query-token bullets first, then caution cues, then body order.
// Returns null when the entry has no real bullets (bare "- " stubs excluded)
// so callers can tell "no experience recorded" from "nothing matched".
export function extractNotes(entry, tokens = []) {
  const body = entry.body ?? "";
  // Case-insensitive line-start match on the ORIGINAL body — never a
  // lowercased index into the original, which misaligns on length-expanding
  // Unicode (e.g. Turkish 'İ') and silently drops the notes (see bodySection).
  const head = /^##\s+personal notes[^\n]*\n?/im.exec(body);
  if (head === null) return null;
  const bullets = [];
  for (const line of body.slice(head.index + head[0].length).split("\n")) {
    if (/^#{1,6}\s/.test(line)) break; // next heading ends the section
    const m = line.match(/^-\s+(.*\S)\s*$/);
    if (m) bullets.push(m[1]);
  }
  if (!bullets.length) return null;
  return bullets
    .map((text, i) => {
      const lower = text.toLowerCase();
      return {
        text,
        i,
        tokenHit: tokens.some((tok) => lower.includes(tok)) ? 1 : 0,
        cueHit: CAUTION_CUES.some((cue) => lower.includes(cue)) ? 1 : 0,
      };
    })
    .sort((a, b) => b.tokenHit - a.tokenHit || b.cueHit - a.cueHit || a.i - b.i)
    .slice(0, 3)
    .map((b) => b.text);
}

// The owner-authored '## Setup' section: verified install/run commands (fenced
// code lines) and step bullets, in body order. Null when the section is absent
// so adoptionSteps knows to fall back to the generic clone/README pointer.
export function extractSetup(entry) {
  const body = entry.body ?? "";
  // Same case-insensitive original-body match as extractNotes/bodySection.
  const head = /^##\s+setup[^\n]*\n?/im.exec(body);
  if (head === null) return null;
  const steps = [];
  let inFence = false;
  for (const line of body.slice(head.index + head[0].length).split("\n")) {
    if (/^#{1,6}\s/.test(line)) break; // next heading ends the section
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      if (line.trim()) steps.push(line.trim());
      continue;
    }
    const m = line.match(/^-\s+(.*\S)\s*$/);
    if (m) steps.push(m[1]);
  }
  return steps.length ? steps : null;
}

export function adoptionSteps(entry) {
  // Owner-verified Setup commands beat the generic clone/README dance — this is
  // the first-hour friction the library exists to remove.
  const setup = extractSetup(entry);
  const steps = setup
    ? [...setup, `Then check its Reception in LibrAIum (${entry.id}) for the community's take and known limitations.`]
    : [
        `git clone ${entry.meta.github_url}`,
        `Read its README against your requirements — then check its Reception in LibrAIum (${entry.id}) for the community's take and known limitations.`,
      ];
  const tags = entry.meta.tags ?? [];
  if (!setup && tags.includes("mcp-server")) {
    steps.push(`If it ships an MCP server: claude mcp add ${entry.meta.full_name.split("/")[1]} -- <its run command>`);
  }
  if (!setup && tags.includes("vector-db")) {
    steps.push("Runs as infrastructure — check for a docker-compose.yml or a hosted option before embedding.");
  }
  return steps;
}

export function suggest(entries, categories, projectDescription, goals = "", maxResults = 5) {
  const tokens = tokenize(`${projectDescription} ${goals}`);
  const ranked = entries
    .map((e) => ({ entry: e, ...scoreEntry(e, tokens, categories) }))
    // lexical > 0: an active, high-star entry must never surface on a query
    // that matches nothing — status/stars alone used to clear the threshold.
    .filter((r) => r.lexical > 0 && r.score > 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return {
    query_tokens: tokens,
    suggestions: ranked.map(({ entry, score, reasons }) => ({
      id: entry.id,
      full_name: entry.meta.full_name,
      github_url: entry.meta.github_url,
      category: entry.meta.category,
      tags: entry.meta.tags ?? [],
      stars: entry.meta.stars ?? 0,
      status: entry.meta.status,
      summary: firstSummaryLine(entry.body),
      // Reception (third-party signal) is the primary curated layer; personal_notes
      // stays populated only for the reference seeds the owner has used firsthand.
      reception: bodySection(entry.body, "reception"),
      personal_notes: extractNotes(entry, tokens),
      relevance_score: score,
      why: reasons,
      how_to_adopt: adoptionSteps(entry),
    })),
  };
}
