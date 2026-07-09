#!/usr/bin/env node
// Headless metadata refresh: fetch live GitHub data for every (matching)
// entry and update the scalar frontmatter lines in place — stars, language,
// last_github_push, last_checked, status. User-invoked only: this is the
// design doc's "explicit refresh" path; nothing may schedule it.
//
// Default is a dry run (prints the delta digest, writes nothing):
//   node scripts/refresh-metadata.mjs [--write] [--category <id>]
//        [--only <entry-id|owner/repo>] [--stale-days <n>] [--data-dir <dir>]
//
// Files are rewritten line-by-line, never via parseEntry→serializeEntry:
// YAML.stringify would turn the flow-style `tags: [a, b]` every entry uses
// into block style and churn the whole library. Only the refreshed scalar
// lines change.
//
// Renamed repos (GitHub 301s and reports a new full_name) are NEVER rewritten
// automatically — the new name changes slug/id, so the file move is left to
// the user (mirrors guardRedirectedDuplicate semantics in both add paths).
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import {
  listEntries,
  fetchGithubRepo,
  computeStatus,
  today,
  resolveDataDir,
} from "../mcp-server/lib/store.js";

const HERE = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { write: false, category: null, only: null, staleDays: 180 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--write") args.write = true;
    else if (a === "--dry-run") args.write = false;
    else if (a === "--category") args.category = argv[++i];
    else if (a === "--only") args.only = argv[++i];
    else if (a === "--stale-days") args.staleDays = Number(argv[++i]);
    else if (a === "--data-dir") i++; // consumed by resolveDataDir
    else {
      console.error(`unknown flag: ${a}`);
      console.error("usage: refresh-metadata.mjs [--write] [--category <id>] [--only <entry-id|owner/repo>] [--stale-days <n>] [--data-dir <dir>]");
      process.exit(2);
    }
  }
  if (!Number.isInteger(args.staleDays) || args.staleDays <= 0) {
    console.error("--stale-days must be a positive integer");
    process.exit(2);
  }
  return args;
}

// EntryMeta field order (models.rs) — a missing scalar line is inserted after
// the nearest preceding key so refreshed files keep the canonical order.
const FIELD_ORDER = [
  "github_url", "full_name", "category", "tags", "stars",
  "language", "last_github_push", "last_checked", "status", "source", "added_date",
];

export function setScalar(lines, key, value) {
  const rendered = `${key}: ${value}`;
  const idx = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (idx !== -1) {
    if (lines[idx] === rendered) return false;
    lines[idx] = rendered;
    return true;
  }
  const before = FIELD_ORDER.slice(0, FIELD_ORDER.indexOf(key));
  let insertAt = 0;
  for (let i = 0; i < lines.length; i++) {
    const k = lines[i].match(/^([a-z_]+):/)?.[1];
    if (k && before.includes(k)) insertAt = i + 1;
  }
  lines.splice(insertAt, 0, rendered);
  return true;
}

export function rewriteEntry(path, next) {
  const raw = readFileSync(path, "utf8");
  const lines = raw.split("\n");
  const open = lines.findIndex((l) => l.trimEnd() === "---");
  const close = lines.findIndex((l, i) => i > open && l.trimEnd() === "---");
  if (open === -1 || close === -1) throw new Error(`no frontmatter block in ${path}`);
  const fm = lines.slice(open + 1, close);
  let changed = false;
  for (const [key, value] of Object.entries(next)) {
    if (value === null || value === undefined) continue; // never write nulls
    changed = setScalar(fm, key, value) || changed;
  }
  if (changed) {
    writeFileSync(path, [...lines.slice(0, open + 1), ...fm, ...lines.slice(close)].join("\n"));
  }
  return changed;
}

// Only run the network/CLI body when invoked directly — importing the module
// (e.g. for unit tests over setScalar/rewriteEntry) must not fire a refresh.
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
    `[warn] no GITHUB_TOKEN/GH_TOKEN — anonymous GitHub API limit is 60 req/h, this run needs ${entries.length}.\n` +
      "       try: export GITHUB_TOKEN=$(gh auth token)"
  );
}

console.error(`${args.write ? "refreshing" : "dry run over"} ${entries.length} entrie(s) from ${dataDir}\n`);

const changedRows = [];
const renames = [];
const errors = [];
let unchanged = 0;

for (const e of entries) {
  let gh;
  try {
    gh = await fetchGithubRepo(e.meta.full_name);
  } catch (err) {
    errors.push(`${e.id}: ${err.message}`);
    continue;
  }
  if (gh.full_name.toLowerCase() !== e.meta.full_name.toLowerCase()) {
    // Header contract (lines 16-18): a renamed repo (GitHub 301s to a new
    // full_name) is NEVER rewritten automatically — the new name changes
    // slug/id, so the file move is left to the user. Report it and skip; do
    // not rewrite scalars under the stale name (which also silently cleared a
    // legitimate `stale` flag off the renamed repo's fresh push date).
    renames.push(`${e.id}: ${e.meta.full_name} -> ${gh.full_name}`);
    continue;
  }
  const next = {
    stars: gh.stargazers_count,
    language: gh.language ?? null, // keep the existing line when GitHub reports none
    last_github_push: (gh.pushed_at ?? "").slice(0, 10) || null,
    last_checked: today(),
    status: computeStatus(gh.archived, gh.pushed_at, args.staleDays),
  };
  const deltas = [];
  if (next.stars !== (e.meta.stars ?? 0)) deltas.push(`stars ${e.meta.stars ?? 0} -> ${next.stars}`);
  if (next.language && next.language !== e.meta.language) deltas.push(`language ${e.meta.language ?? "-"} -> ${next.language}`);
  if (next.last_github_push && next.last_github_push !== e.meta.last_github_push) {
    deltas.push(`push ${e.meta.last_github_push ?? "-"} -> ${next.last_github_push}`);
  }
  if (next.status !== e.meta.status) deltas.push(`STATUS ${e.meta.status} -> ${next.status} !`);
  if (!deltas.length) {
    unchanged++;
  } else {
    changedRows.push(`${e.id.padEnd(42)} ${deltas.join(", ")}`);
  }
  if (args.write) rewriteEntry(e.path, next);
}

if (changedRows.length) {
  console.log(`— deltas (${changedRows.length}) —`);
  for (const r of changedRows) console.log(r);
} else {
  console.log("no metadata drift.");
}
console.log(`\n${unchanged} unchanged${args.write ? "" : " (dry run — nothing written; add --write to apply)"}`);
if (renames.length) {
  console.log(`\n— RENAMED upstream (manual action: move the file per /add-entry rename rules) —`);
  for (const r of renames) console.log(r);
}
if (errors.length) {
  console.log(`\n— errors (${errors.length}) —`);
  for (const r of errors) console.log(r);
}

if (args.write) {
  console.error("\nrunning validate-data …");
  execFileSync(process.execPath, [join(HERE, "validate-data.mjs"), "--data-dir", dataDir], {
    stdio: "inherit",
  });
}

process.exit(errors.length ? 1 : 0);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) await runCli();
