#!/usr/bin/env node
// Read-only Reception evidence dossier: for each (matching) entry, gather
// third-party signal from GitHub — the most-reacted issues (complaints /
// limitations), release cadence + open-issue count (maturity), and any README
// "used by / adopters" links — and print a per-entry dossier for a human (or
// the /reception command) to synthesize a `## Reception` section from.
//
// This script WRITES NOTHING. It is GitHub-only (every call is `gh api`, no
// new third-party hosts) and User-invoked only — the design doc's on-demand
// network path; nothing may schedule it.
//
//   node scripts/reception-scan.mjs [--json] [--category <id>]
//        [--only <entry-id|owner/repo>] [--data-dir <dir>]
//
// Each entry costs ~4 `gh` calls, and `gh` search has a tighter budget
// (~30/min) — scope a run with --only/--category rather than sweeping the whole
// library at once. Export GITHUB_TOKEN first: export GITHUB_TOKEN=$(gh auth token)
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { listEntries, resolveDataDir } from "../mcp-server/lib/store.js";

// ---------- pure shaping/ranking (unit-tested; no network) ----------

// Most-reacted issues first (ties broken by lower number = older/canonical),
// capped. Input rows are already normalized to { number, title, url, state, reactions }.
export function rankIssues(issues, max = 8) {
  return [...(issues ?? [])]
    .filter((i) => i && typeof i.number === "number")
    .sort((a, b) => (b.reactions ?? 0) - (a.reactions ?? 0) || a.number - b.number)
    .slice(0, max)
    .map((i) => ({
      number: i.number,
      title: (i.title ?? "").trim(),
      url: i.url ?? null,
      state: i.state ?? null,
      reactions: i.reactions ?? 0,
    }));
}

// Release maturity from published-at date strings: count, newest date, and the
// median gap (days) between consecutive releases. Null when there are no
// releases; medianIntervalDays is null with fewer than two.
export function releaseCadence(publishedDates) {
  const ts = (publishedDates ?? [])
    .map((d) => (typeof d === "string" ? Date.parse(d) : NaN))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a); // newest first
  if (!ts.length) return null;
  const latest = new Date(ts[0]).toISOString().slice(0, 10);
  let medianIntervalDays = null;
  if (ts.length >= 2) {
    const gaps = [];
    for (let i = 0; i < ts.length - 1; i++) gaps.push((ts[i] - ts[i + 1]) / 86_400_000);
    gaps.sort((a, b) => a - b);
    const mid = Math.floor(gaps.length / 2);
    medianIntervalDays = Math.round(
      gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2
    );
  }
  return { count: ts.length, latest, medianIntervalDays };
}

// Adopter/"used by" links from a README: find the first heading whose text
// signals adoption, then collect [name](url) links until the next heading.
// Deduped by url, capped. Pure over the raw README text; null README => [].
export function parseAdopters(readme, max = 10) {
  const lines = (readme ?? "").split(/\r?\n/);
  const headingRe = /^#{1,6}\s+.*(used by|adopters|who(?:'s| is| uses| use)|trusted by|in production|showcase|companies)/i;
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start === -1) return [];
  const out = [];
  const seen = new Set();
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i])) break; // next heading ends the block
    const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
    let m;
    while ((m = linkRe.exec(lines[i])) !== null) {
      const url = m[2];
      if (seen.has(url)) continue;
      seen.add(url);
      out.push({ name: m[1].trim(), url });
      if (out.length >= max) return out;
    }
  }
  return out;
}

// Assemble the dossier from an entry + the raw gathered GitHub data. Pure.
export function buildDossier(entry, raw = {}) {
  const { issues, releases, repo, readme } = raw;
  return {
    id: entry.id,
    full_name: entry.meta.full_name,
    github_url: entry.meta.github_url,
    category: entry.meta.category,
    stars: entry.meta.stars ?? 0,
    status: entry.meta.status ?? "active",
    last_github_push: entry.meta.last_github_push ?? null,
    open_issues: repo?.open_issues_count ?? null,
    top_issues: rankIssues(issues),
    release_cadence: releaseCadence(releases),
    adopters: parseAdopters(readme),
  };
}

// Human-readable dossier — the evidence a Reception section is written from.
export function formatDossier(d) {
  const out = [];
  out.push(
    `${d.id}  (${d.full_name})  ★${d.stars}  ${d.status}` +
      (d.last_github_push ? `  push ${d.last_github_push}` : "")
  );
  const rc = d.release_cadence;
  const cadence = rc
    ? `releases: ${rc.count} (latest ${rc.latest}` +
      (rc.medianIntervalDays != null ? `, ~${rc.medianIntervalDays}d median gap)` : ")")
    : "releases: none published";
  out.push(`  open issues (incl. PRs): ${d.open_issues ?? "?"}   ${cadence}`);
  if (d.top_issues.length) {
    out.push("  top issues by reactions (complaints / limitations):");
    for (const i of d.top_issues) {
      out.push(`    #${i.number} (${i.reactions}👍, ${i.state}) ${i.title}`);
      if (i.url) out.push(`      ${i.url}`);
    }
  } else {
    out.push("  top issues by reactions: (none found — limited public signal)");
  }
  if (d.adopters.length) {
    out.push("  adopters named in README:");
    for (const a of d.adopters) out.push(`    ${a.name} — ${a.url}`);
  } else {
    out.push("  adopters named in README: (none linked — do not claim adopters without a source)");
  }
  return out.join("\n");
}

// ---------- network (GitHub-only via gh; not exported, never in tests) ----------

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

// Only a genuine 404 degrades to the fallback; rate-limit / auth / network
// errors propagate so the per-entry loop reports them instead of silently
// emitting an empty dossier.
function optional404(fn, fallback) {
  try {
    return fn();
  } catch (e) {
    if (/HTTP 404|Not Found/i.test(String(e.stderr || e.message || ""))) return fallback;
    throw e;
  }
}

function ghRepo(fullName) {
  return JSON.parse(gh(["api", `repos/${fullName}`]));
}

function ghTopIssues(fullName) {
  const data = JSON.parse(
    gh([
      "api", "-X", "GET", "search/issues",
      "-f", `q=repo:${fullName} is:issue`,
      "-f", "sort=reactions", "-f", "order=desc", "-f", "per_page=15",
    ])
  );
  return (data.items ?? []).map((i) => ({
    number: i.number,
    title: i.title,
    url: i.html_url,
    state: i.state,
    reactions: i.reactions?.total_count ?? 0,
  }));
}

function ghReleases(fullName) {
  return JSON.parse(gh(["api", `repos/${fullName}/releases`, "-f", "per_page=20"]))
    .map((r) => r.published_at)
    .filter(Boolean);
}

function ghReadme(fullName) {
  return optional404(
    () => gh(["api", `repos/${fullName}/readme`, "-H", "Accept: application/vnd.github.raw"]),
    null
  );
}

function parseArgs(argv) {
  const args = { json: false, category: null, only: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") args.json = true;
    else if (a === "--category") args.category = argv[++i];
    else if (a === "--only") args.only = argv[++i];
    else if (a === "--data-dir") i++; // consumed by resolveDataDir
    else {
      console.error(`unknown flag: ${a}`);
      console.error("usage: reception-scan.mjs [--json] [--category <id>] [--only <entry-id|owner/repo>] [--data-dir <dir>]");
      process.exit(2);
    }
  }
  return args;
}

async function runCli() {
  const args = parseArgs(process.argv);
  const dataDir = resolveDataDir(process.argv, process.env);
  let entries = listEntries(dataDir);
  if (args.category) entries = entries.filter((e) => e.meta.category === args.category);
  if (args.only) {
    const needle = args.only.toLowerCase();
    entries = entries.filter(
      (e) => e.id.toLowerCase() === needle || e.meta.full_name.toLowerCase() === needle
    );
  }
  if (!entries.length) {
    console.error(`no entries matched (data dir: ${dataDir})`);
    process.exit(2);
  }
  if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
    console.error(
      `[warn] no GITHUB_TOKEN/GH_TOKEN — gh search is limited to ~10 req/min anonymously, ` +
        `this run needs ~${entries.length * 2}.\n       try: export GITHUB_TOKEN=$(gh auth token)`
    );
  }
  if (entries.length > 8 && !args.category && !args.only) {
    console.error(
      `[warn] scanning ${entries.length} entries (~${entries.length * 4} gh calls) — ` +
        `gh search has a ~30/min budget; scope with --only/--category if you hit rate limits.`
    );
  }

  const dossiers = [];
  const errors = [];
  for (const e of entries) {
    try {
      const repo = ghRepo(e.meta.full_name);
      const issues = ghTopIssues(e.meta.full_name);
      const releases = optional404(() => ghReleases(e.meta.full_name), []);
      const readme = ghReadme(e.meta.full_name);
      dossiers.push(buildDossier(e, { repo, issues, releases, readme }));
    } catch (err) {
      errors.push(`${e.id}: ${err.stderr ? String(err.stderr).trim() : err.message}`);
    }
  }

  if (args.json) {
    console.log(JSON.stringify({ data_dir: dataDir, dossiers, errors }, null, 2));
  } else {
    for (const d of dossiers) {
      console.log(formatDossier(d));
      console.log("");
    }
    console.error(
      `scanned ${dossiers.length}/${entries.length} entrie(s) from ${dataDir} — ` +
        `evidence only, nothing written. Draft each ## Reception with a source per claim.`
    );
    if (errors.length) {
      console.error(`\n— errors (${errors.length}) —`);
      for (const r of errors) console.error(r);
    }
  }
  process.exit(errors.length ? 1 : 0);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) await runCli();
