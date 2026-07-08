// Ranking for suggest_for_new_project: lexical scoring of the project
// description against tags, category, name, language and body text.
import { firstSummaryLine } from "./store.js";

const STOPWORDS = new Set(
  "a an and are as at be by for from has have i in is it my of on or that the to want with using use build make new project app".split(" ")
);

export function tokenize(text) {
  return [...new Set(
    (text ?? "")
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
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
  const tagHits = tags.filter((tag) =>
    tokens.some((tok) => tag === tok || tag.includes(tok) || tok.includes(tag))
  );
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

  const notesIdx = bodyLower.indexOf("## personal notes");
  if (notesIdx !== -1 && bodyHits.some((tok) => bodyLower.indexOf(tok, notesIdx) !== -1)) {
    lexical += 3;
    reasons.push("your Personal Notes mention related topics");
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

export function adoptionSteps(entry) {
  const steps = [
    `git clone ${entry.meta.github_url}`,
    `Read its README against your requirements — then check your Personal Notes in LibrAIum (${entry.id}) for firsthand gotchas.`,
  ];
  const tags = entry.meta.tags ?? [];
  if (tags.includes("mcp-server")) {
    steps.push(`If it ships an MCP server: claude mcp add ${entry.meta.full_name.split("/")[1]} -- <its run command>`);
  }
  if (tags.includes("vector-db")) {
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
      relevance_score: score,
      why: reasons,
      how_to_adopt: adoptionSteps(entry),
    })),
  };
}
