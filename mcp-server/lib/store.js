// Data access for the LibrAIum data directory (YAML frontmatter + Markdown).
// Mirrors the Rust data layer in src-tauri/src/store.rs — keep formats in sync.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const HERE = dirname(fileURLToPath(import.meta.url));

/** Resolution order: --data-dir flag > env > ./data (cwd) > repo-relative ../data > ~/LibrAIum/data */
export function resolveDataDir(argv = process.argv) {
  const flagIdx = argv.indexOf("--data-dir");
  if (flagIdx !== -1 && argv[flagIdx + 1]) return resolve(argv[flagIdx + 1]);
  if (process.env.LIBRAIUM_DATA_DIR) return resolve(process.env.LIBRAIUM_DATA_DIR);
  for (const candidate of [resolve("data"), resolve(HERE, "..", "..", "data")]) {
    if (existsSync(join(candidate, "master", "categories.yaml"))) return candidate;
  }
  return join(homedir(), "LibrAIum", "data");
}

export function splitFrontmatter(content) {
  // /\r?\n/ mirrors Rust's str::lines(): CRLF files parse identically to LF
  // (the \r must not leak into the last frontmatter value or the body).
  // ﻿+ mirrors Rust's trim_start_matches('\u{feff}'): ALL leading BOMs
  // are stripped, not just the first.
  const lines = content.replace(/^﻿+/, "").split(/\r?\n/);
  if (lines[0]?.trimEnd() !== "---") throw new Error("file does not start with '---' frontmatter");
  const end = lines.findIndex((l, i) => i > 0 && l.trimEnd() === "---");
  if (end === -1) throw new Error("unterminated frontmatter");
  return {
    yaml: lines.slice(1, end).join("\n"),
    body: lines.slice(end + 1).join("\n").replace(/^\n+/, ""),
  };
}

// Mirror of Rust's typed serde deserialization of EntryMeta (models.rs):
// untyped YAML.parse accepts what serde rejects (quoted numbers, numeric
// strings, missing required keys), so validate shapes explicitly. Types only —
// emptiness/enums/date formats are data-level rules (validate-data.mjs), and
// Rust likewise accepts e.g. an empty full_name at parse time.
const REQUIRED_STRING_FIELDS = ["github_url", "full_name", "category"];
const OPTION_STRING_FIELDS = ["language", "last_github_push", "last_checked", "added_date"];
const DEFAULTED_STRING_FIELDS = ["status", "source"]; // serde default fns — absent ok, null is NOT

function validateMeta(meta) {
  for (const key of REQUIRED_STRING_FIELDS) {
    if (typeof meta[key] !== "string") {
      throw new Error(`frontmatter field '${key}' must be a string (got ${meta[key] === undefined ? "nothing" : typeof meta[key]})`);
    }
  }
  for (const key of OPTION_STRING_FIELDS) {
    const v = meta[key];
    if (v !== undefined && v !== null && typeof v !== "string") {
      throw new Error(`frontmatter field '${key}' must be a string or absent (got ${typeof v})`);
    }
  }
  for (const key of DEFAULTED_STRING_FIELDS) {
    const v = meta[key];
    if (v !== undefined && typeof v !== "string") {
      throw new Error(`frontmatter field '${key}' must be a string (got ${v === null ? "null" : typeof v})`);
    }
  }
  if (meta.tags !== undefined && (!Array.isArray(meta.tags) || meta.tags.some((t) => typeof t !== "string"))) {
    throw new Error("frontmatter field 'tags' must be an array of strings");
  }
  const stars = meta.stars;
  if (stars !== undefined && (typeof stars !== "number" || !Number.isInteger(stars) || stars < 0)) {
    throw new Error(`frontmatter field 'stars' must be a non-negative integer (got ${JSON.stringify(stars)})`);
  }
}

export function parseEntry(content) {
  const { yaml, body } = splitFrontmatter(content);
  const meta = YAML.parse(yaml);
  // Frontmatter that is empty or not a YAML mapping parses to null/scalar/
  // array here — reject it so callers (listEntries) skip the file instead of
  // crashing on meta.stars.
  if (meta === null || typeof meta !== "object" || Array.isArray(meta)) {
    throw new Error("frontmatter is not a YAML mapping");
  }
  validateMeta(meta);
  return { meta, body };
}

export function serializeEntry(meta, body) {
  return `---\n${YAML.stringify(meta)}---\n\n${body.trimEnd()}\n`;
}

export function listEntries(dataDir) {
  const root = join(dataDir, "entries");
  if (!existsSync(root)) return [];
  const out = [];
  for (const cat of readdirSync(root, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue;
    const catDir = join(root, cat.name);
    for (const f of readdirSync(catDir)) {
      if (!f.endsWith(".md")) continue;
      const path = join(catDir, f);
      try {
        const { meta, body } = parseEntry(readFileSync(path, "utf8"));
        out.push({ id: `${cat.name}/${f.replace(/\.md$/, "")}`, path, meta, body });
      } catch (e) {
        console.error(`[libraium-mcp] skipping ${path}: ${e.message}`);
      }
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export function loadCategories(dataDir) {
  const path = join(dataDir, "master", "categories.yaml");
  if (!existsSync(path)) return [];
  const parsed = YAML.parse(readFileSync(path, "utf8"));
  return (parsed?.categories ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

// Verbatim port of Rust store::slugify — for..of iterates Unicode code
// points exactly like Rust's .chars(), so an astral char maps to ONE dash.
export function slugify(fullName) {
  let slug = "";
  for (const c of fullName) {
    if (c === "/") slug += "-";
    else if (c.length === 1 && /[a-zA-Z0-9\-_.]/.test(c)) slug += c.toLowerCase();
    else slug += "-";
  }
  return slug.replace(/^-+|-+$/g, "");
}

// Verbatim port of Rust store::normalize_github_url: same prefix list, same
// repeated-".git" trim, same owner/repo extraction. The previous regex here
// accepted shapes Rust rejects (e.g. "github.com:a/b") — keep in lockstep.
export function normalizeGithubUrl(url) {
  const trimmed = url.trim().replace(/\/+$/, "");
  let rest = null;
  for (const prefix of ["https://github.com/", "http://github.com/", "github.com/", "git@github.com:"]) {
    if (trimmed.startsWith(prefix)) {
      rest = trimmed.slice(prefix.length);
      break;
    }
  }
  if (rest === null) throw new Error(`not a github.com repository URL: ${url}`);
  rest = rest.replace(/(?:\.git)+$/, "");
  const parts = rest.split("/");
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    throw new Error(`cannot extract owner/repo from: ${url}`);
  }
  const fullName = `${parts[0]}/${parts[1]}`;
  return { fullName, canonical: `https://github.com/${fullName}` };
}

export function findDuplicate(dataDir, fullName) {
  const needle = fullName.toLowerCase();
  return listEntries(dataDir).find((e) => e.meta.full_name?.toLowerCase() === needle) ?? null;
}

export function firstSummaryLine(body) {
  return (
    body
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#") && !l.startsWith("---")) ?? ""
  );
}

export function saveNewEntry(dataDir, meta, body) {
  const slug = slugify(meta.full_name);
  const dir = join(dataDir, "entries", meta.category);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${slug}.md`);
  if (existsSync(path)) throw new Error(`duplicate entry: ${meta.full_name} already exists`);
  writeFileSync(path, serializeEntry(meta, body));
  return { id: `${meta.category}/${slug}`, path, meta, body };
}

export async function fetchGithubRepo(fullName) {
  const headers = {
    "User-Agent": "LibrAIum-MCP/1.0",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers });
  if (!res.ok) {
    const hint = res.status === 404 ? " (not found)" : res.status === 403 ? " (rate limited — set GITHUB_TOKEN)" : "";
    throw new Error(`GitHub API ${res.status}${hint} for ${fullName}`);
  }
  return res.json();
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Compact projection used in tool results (keeps token cost low for the model). */
export function summarize(entry) {
  return {
    id: entry.id,
    full_name: entry.meta.full_name,
    github_url: entry.meta.github_url,
    category: entry.meta.category,
    tags: entry.meta.tags ?? [],
    stars: entry.meta.stars ?? 0,
    language: entry.meta.language ?? null,
    status: entry.meta.status ?? "active",
    last_github_push: entry.meta.last_github_push ?? null,
    summary: firstSummaryLine(entry.body),
  };
}
