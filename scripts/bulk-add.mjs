#!/usr/bin/env node
// Batch intake for the library — the /add-entry pipeline in a loop, plus a
// candidate-sourcing mode over your GitHub stars. User-invoked only: every
// network call is inside an explicit run of this script.
//
// Intake mode (writes skeleton entries):
//   node scripts/bulk-add.mjs <url>... [--category <id>]
//   node scripts/bulk-add.mjs --file targets.txt        # lines: url[,category]
//   echo "https://github.com/o/r,devops-infra" | node scripts/bulk-add.mjs --stdin
//
// Candidate mode (writes NOTHING — prints a triage table to hand-review):
//   node scripts/bulk-add.mjs --from-stars [--user <name>] [--min-stars <n>]
//        [--language <L>] [--pushed-within <days>]
//
// Skeletons carry a placeholder Reception bullet on purpose — the /bulk-add
// command drafts real Reception notes (third-party signal) before anything is
// committed. The script never commits.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  resolveDataDir,
  listEntries,
  loadCategories,
  normalizeGithubUrl,
  findDuplicate,
  fetchGithubRepo,
  guardRedirectedDuplicate,
  computeStatus,
  today,
} from "../mcp-server/lib/store.js";
import { findRejected } from "../mcp-server/lib/rejected.js";

const STOPWORDS = new Set(
  "a an and are as at be by for from has have in is it of on or that the to with your you their its via app apps tool tools library libraries framework frameworks".split(" ")
);

function tokens(text) {
  return new Set(
    (text ?? "")
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
  );
}

// Lexical category proposal (no embeddings): score each shelf by how many of
// its descriptor tokens — category name/description plus the tags already used
// on that shelf — appear in the repo's text. Highest score wins; ties keep
// categories.yaml order.
export function proposeCategory(repo, categories, tagsByCat) {
  const hay = tokens(`${repo.description ?? ""} ${repo.language ?? ""} ${(repo.topics ?? []).join(" ")} ${repo.full_name}`);
  let best = null;
  let bestScore = 0;
  for (const c of categories) {
    // Tags must be tokenized into the descriptor too: the haystack splits on
    // hyphens ("vector database" -> vector, database), so a raw hyphenated tag
    // like "vector-db" could otherwise never match — most library tags are
    // hyphenated, which would leave the shelf's tag vocabulary dead weight.
    const descriptor = new Set(tokens(`${c.name} ${c.description ?? ""}`));
    for (const tag of tagsByCat.get(c.id) ?? []) for (const t of tokens(tag)) descriptor.add(t);
    let score = 0;
    for (const t of descriptor) if (hay.has(t)) score++;
    // Strict > keeps categories.yaml order on ties (first shelf wins).
    if (score > bestScore) {
      bestScore = score;
      best = c.id;
    }
  }
  return { category: best, score: bestScore };
}

function skeleton(gh, category) {
  const repoName = gh.full_name.split("/").pop();
  const meta = {
    github_url: `https://github.com/${gh.full_name}`,
    full_name: gh.full_name,
    category,
    tags: [],
    stars: gh.stargazers_count,
    language: gh.language ?? null,
    last_github_push: gh.pushed_at?.slice(0, 10) ?? null,
    last_checked: today(),
    status: computeStatus(gh.archived, gh.pushed_at),
    source: "manual",
    added_date: today(),
  };
  const body = `# ${repoName}\n\n${gh.description ?? "(no description)"}\n\n## Reception\n\n- \n`;
  return { meta, body };
}

async function intake(dataDir, targets, defaultCategory) {
  // saveNewEntry is imported lazily so a --from-stars run never risks a write.
  const { saveNewEntry } = await import("../mcp-server/lib/store.js");
  const catIds = new Set(loadCategories(dataDir).map((c) => c.id));
  const added = [];
  const dups = [];
  const failed = [];

  for (const { url, category } of targets) {
    const cat = category || defaultCategory;
    try {
      if (!cat) throw new Error("no category — use 'url,category' lines or --category <id>");
      if (!catIds.has(cat)) throw new Error(`unknown category '${cat}'`);
      const { fullName } = normalizeGithubUrl(url);
      const dup = findDuplicate(dataDir, fullName);
      if (dup) {
        dups.push({ url, id: dup.id });
        continue;
      }
      const gh = await fetchGithubRepo(fullName);
      guardRedirectedDuplicate(dataDir, fullName, gh.full_name);
      const { meta, body } = skeleton(gh, cat);
      const entry = saveNewEntry(dataDir, meta, body);
      added.push(entry.id);
    } catch (e) {
      failed.push({ url, error: e.message });
    }
  }

  console.log(`\n=== bulk-add summary ===`);
  console.log(`added   (${added.length}): ${added.join(", ") || "—"}`);
  console.log(`skipped (${dups.length}): ${dups.map((d) => `${d.url} → ${d.id}`).join(", ") || "—"}`);
  console.log(`failed  (${failed.length}): ${failed.map((f) => `${f.url}: ${f.error}`).join("; ") || "—"}`);
  if (added.length) {
    console.log(`\nSkeletons written with placeholder notes — draft real Reception before committing.`);
    const validator = join(dirname(fileURLToPath(import.meta.url)), "validate-data.mjs");
    execFileSync(process.execPath, [validator, "--data-dir", dataDir], { stdio: "inherit" });
  }
  return { added, dups, failed };
}

function fromStars(dataDir, opts) {
  const endpoint = opts.user ? `users/${opts.user}/starred` : "user/starred";
  let out;
  try {
    out = execFileSync(
      "gh",
      ["api", endpoint, "--paginate", "-H", "Accept: application/vnd.github.star+json",
        "--jq", ".[] | {full_name: .repo.full_name, stars: .repo.stargazers_count, language: .repo.language, description: .repo.description, pushed_at: .repo.pushed_at, archived: .repo.archived, topics: .repo.topics}"],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
  } catch (e) {
    // The star+json media type nests under .repo; fall back to the plain shape.
    out = execFileSync(
      "gh",
      ["api", endpoint, "--paginate",
        "--jq", ".[] | {full_name, stars: .stargazers_count, language, description, pushed_at, archived, topics}"],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
  }
  const repos = out.split("\n").filter(Boolean).map((l) => JSON.parse(l));

  const categories = loadCategories(dataDir);
  const tagsByCat = new Map();
  for (const e of listEntries(dataDir)) {
    if (!tagsByCat.has(e.meta.category)) tagsByCat.set(e.meta.category, new Set());
    for (const t of e.meta.tags ?? []) tagsByCat.get(e.meta.category).add(t.toLowerCase());
  }

  const cutoff = opts.pushedWithin
    ? Date.parse(`${today()}T00:00:00Z`) - opts.pushedWithin * 86_400_000
    : null;

  const rows = [];
  let skippedShelved = 0;
  let skippedRejected = 0;
  for (const r of repos) {
    if (r.archived) continue;
    if (opts.minStars && (r.stars ?? 0) < opts.minStars) continue;
    if (opts.language && (r.language ?? "").toLowerCase() !== opts.language.toLowerCase()) continue;
    if (cutoff && (!r.pushed_at || Date.parse(r.pushed_at) < cutoff)) continue;
    if (findDuplicate(dataDir, r.full_name)) {
      skippedShelved++;
      continue;
    }
    // Don't re-surface a repo already evaluated and consciously declined —
    // rejected-candidates memory (data/master/rejected.yaml).
    if (findRejected(dataDir, r.full_name)) {
      skippedRejected++;
      continue;
    }
    const { category, score } = proposeCategory(r, categories, tagsByCat);
    rows.push({ ...r, category, score });
  }
  rows.sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));

  const skipNote = `${skippedShelved} already shelved${skippedRejected ? `, ${skippedRejected} previously rejected` : ""}, skipped`;
  console.log(`# ${rows.length} candidates (${skipNote}). Paste the url,category lines you want into bulk-add intake:\n`);
  for (const r of rows) {
    const cat = r.category ?? "UNMATCHED";
    console.log(`https://github.com/${r.full_name},${cat}    # ★${r.stars} ${r.language ?? "-"} — ${(r.description ?? "").slice(0, 70)}`);
  }
  return rows;
}

function parseArgs(argv) {
  const opts = { urls: [], file: null, stdin: false, category: null, fromStars: false, user: null, minStars: null, language: null, pushedWithin: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file") opts.file = argv[++i];
    else if (a === "--stdin") opts.stdin = true;
    else if (a === "--category") opts.category = argv[++i];
    else if (a === "--from-stars") opts.fromStars = true;
    else if (a === "--user") opts.user = argv[++i];
    else if (a === "--min-stars") opts.minStars = Number(argv[++i]);
    else if (a === "--language") opts.language = argv[++i];
    else if (a === "--pushed-within") opts.pushedWithin = Number(argv[++i]);
    else if (a === "--data-dir") i++; // consumed by resolveDataDir
    else if (a.startsWith("--")) throw new Error(`unknown flag: ${a}`);
    else opts.urls.push(a);
  }
  return opts;
}

function readTargets(opts) {
  const lines = [];
  if (opts.file) lines.push(...readFileSync(opts.file, "utf8").split("\n"));
  if (opts.stdin) lines.push(...readFileSync(0, "utf8").split("\n"));
  const targets = opts.urls.map((url) => ({ url, category: null }));
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [url, category] = line.split(",").map((s) => s.trim());
    if (url) targets.push({ url, category: category || null });
  }
  return targets;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    console.error("usage: bulk-add.mjs <url>... [--category <id>] | --file <f> | --stdin | --from-stars [--user <n>] [--min-stars <n>] [--language <L>] [--pushed-within <days>]");
    process.exit(2);
  }
  const dataDir = resolveDataDir();
  if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
    console.error("[warn] no GITHUB_TOKEN/GH_TOKEN — the anonymous GitHub API limit is 60 req/h. try: export GITHUB_TOKEN=$(gh auth token)");
  }
  try {
    if (opts.fromStars) {
      fromStars(dataDir, opts);
    } else {
      const targets = readTargets(opts);
      if (!targets.length) {
        console.error("no targets — pass URLs, --file, or --stdin");
        process.exit(2);
      }
      const { failed } = await intake(dataDir, targets, opts.category);
      process.exit(failed.length ? 1 : 0);
    }
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
