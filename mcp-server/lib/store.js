// Data access for the LibrAIum data directory (YAML frontmatter + Markdown).
// Mirrors the Rust data layer in src-tauri/src/store.rs — keep formats in sync.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const HERE = dirname(fileURLToPath(import.meta.url));

/** Resolution order: --data-dir flag > env > ./data (cwd) > repo-relative ../data > ~/LibrAIum/data.
 * Values are trimmed, and whitespace-only values fall through to the next
 * tier — mirroring Rust resolve_data_dir_from (settings.rs), so a padded
 * LIBRAIUM_DATA_DIR can never point the MCP server and the desktop app at
 * different directories. argv/env are injectable so tests don't mutate
 * process globals (same design as the Rust testable core). */
export function resolveDataDir(argv = process.argv, env = process.env) {
  const flagIdx = argv.indexOf("--data-dir");
  const flagVal = flagIdx !== -1 ? argv[flagIdx + 1]?.trim() : undefined;
  if (flagVal) return resolve(flagVal);
  const envVal = env.LIBRAIUM_DATA_DIR?.trim();
  if (envVal) return resolve(envVal);
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
  // Serde-default parity (models.rs default fns): Rust materializes these on
  // parse, so every Node consumer must see the same values — an absent status
  // left undefined made search_repos' status filter silently drop entries the
  // desktop app includes, while summarize reported them "active".
  meta.tags ??= [];
  meta.stars ??= 0;
  meta.status ??= "active";
  meta.source ??= "manual";
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
    let files;
    try {
      files = readdirSync(catDir);
    } catch (e) {
      // Mirrors Rust scan_entries: one unreadable category dir must not take
      // down the whole library — skip it with a warning, like the per-file
      // path below. (An unreadable entries/ ROOT stays a hard error on both
      // sides on purpose.)
      console.error(`[libraium-mcp] skipping unreadable category dir ${catDir}: ${e.message}`);
      continue;
    }
    for (const f of files) {
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
  let parsed;
  try {
    parsed = YAML.parse(readFileSync(path, "utf8"));
  } catch (e) {
    // Raw YAML parser errors are useless to the calling LLM — say which
    // file is broken and what to do about it.
    throw new Error(`category master ${path} is invalid YAML (fix or restore it): ${e.message}`);
  }
  const categories = parsed?.categories ?? [];
  if (!Array.isArray(categories)) {
    throw new Error(`category master ${path} is malformed: 'categories' must be a list`);
  }
  // A hand-edit slip (trailing '-', bare string, unquoted numeric scalar)
  // must fail closed naming the file, item, and cause — not surface as a raw
  // TypeError or silently diverge from the Rust side. Scalar strictness
  // mirrors the Rust Category schema (models.rs strict_string + i64 order):
  // `id: 2048` or `order: "3"` is rejected identically on both sides.
  categories.forEach((c, i) => {
    const bad = (what) => {
      throw new Error(`category master ${path} is malformed: item ${i + 1} ${what} — fix or remove it`);
    };
    if (c === null || typeof c !== "object" || Array.isArray(c)) {
      bad("is not a category mapping (stray '-' or unfinished entry?)");
    }
    for (const key of ["id", "name"]) {
      if (typeof c[key] !== "string") bad(`needs a string '${key}' (got ${JSON.stringify(c[key])})`);
    }
    for (const key of ["color", "icon", "description"]) {
      if (c[key] !== undefined && typeof c[key] !== "string") {
        bad(`field '${key}' must be a string (got ${JSON.stringify(c[key])})`);
      }
    }
    // Integer, not just number: Rust's i64 rejects `order: 3.5` file-wide, so
    // accepting floats here would let the two sides serve different libraries.
    if (c.order !== undefined && !Number.isInteger(c.order)) {
      bad(`field 'order' must be an integer (got ${JSON.stringify(c.order)})`);
    }
  });
  return categories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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

// Post-fetch guard for the add path (mirrors Rust store::guard_redirected_duplicate):
// GitHub 301-redirects a renamed repo and returns the NEW full_name, so the
// pre-fetch duplicate check (on the typed name) can miss an entry already
// shelved under the new name. Same reason the canonical URL must be rebuilt
// from the API's full_name, never the input. The reverse direction (entry
// shelved under the OLD name, user types the NEW one) is undetectable without
// storing the numeric GitHub repo id — a format change, deliberately not done.
export function guardRedirectedDuplicate(dataDir, inputFullName, ghFullName) {
  if (ghFullName.toLowerCase() === inputFullName.toLowerCase()) return;
  const dup = findDuplicate(dataDir, ghFullName);
  if (dup) {
    throw new Error(
      `already registered as ${dup.id} — GitHub redirected ${inputFullName} to ${ghFullName} (repository was renamed)`
    );
  }
}

// Mirror of the desktop add path (AddRepo.svelte): LLM clients send padded or
// empty tag strings, which validate-data.mjs rejects once written and which
// never match search_repos' exact tag filter.
export function normalizeTags(tags) {
  return (tags ?? []).map((t) => t.trim()).filter(Boolean);
}

export function firstSummaryLine(body) {
  return (
    body
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#") && !l.startsWith("---")) ?? ""
  );
}

// Verbatim body of a "## <heading>" section (heading line dropped), trimmed,
// up to the next level-1/2 heading. Null when the section is absent or empty.
// Deeper (###) sub-headings stay inside the section. Shared by suggest and
// compare so both tools read entry sections one way — this replaces the two
// separate implementations that used to live in suggest.extractNotes and
// compare.personalNotesSection.
export function bodySection(body, heading) {
  const text = body ?? "";
  const idx = text.toLowerCase().indexOf(`## ${heading.toLowerCase()}`);
  if (idx === -1) return null;
  const out = [];
  for (const line of text.slice(idx).split(/\r?\n/).slice(1)) {
    if (/^#{1,2}\s/.test(line)) break; // next level-1/2 heading ends the section
    out.push(line);
  }
  const section = out.join("\n").trim();
  return section || null;
}

export function saveNewEntry(dataDir, meta, body) {
  // Defense in depth: category becomes a directory name below. Enforce the
  // category-id contract (kebab-case) here too, so no caller — and no gap in
  // upstream validation — can turn it into a path traversal ('../../x').
  if (!/^[a-z0-9-]+$/.test(meta.category)) {
    throw new Error(`invalid category '${meta.category}' (must match ^[a-z0-9-]+$)`);
  }
  const slug = slugify(meta.full_name);
  const dir = join(dataDir, "entries", meta.category);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${slug}.md`);
  if (existsSync(path)) throw new Error(`duplicate entry: ${meta.full_name} already exists`);
  writeFileSync(path, serializeEntry(meta, body));
  return { id: `${meta.category}/${slug}`, path, meta, body };
}

// fetchImpl is injectable for tests; production callers use the global fetch.
export async function fetchGithubRepo(fullName, fetchImpl = fetch) {
  const headers = {
    "User-Agent": "LibrAIum-MCP/1.0",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetchImpl(`https://api.github.com/repos/${fullName}`, {
      headers,
      // A stalled connection must not hang the MCP tool call indefinitely.
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    if (e?.name === "TimeoutError" || e?.name === "AbortError") {
      throw new Error(`GitHub API timed out after 10s for ${fullName} — check the network and retry`);
    }
    throw e;
  }
  if (!res.ok) {
    const hint =
      res.status === 404
        ? " (not found)"
        : res.status === 403 || res.status === 429
          ? " (rate limited — set GITHUB_TOKEN)"
          : "";
    throw new Error(`GitHub API ${res.status}${hint} for ${fullName}`);
  }
  return res.json();
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

// Mirror of Rust github::compute_status (github.rs): archived wins; otherwise
// a push older than staleDays whole days => stale. Both sides compare
// date-only values with an exclusive '>' boundary, so add_repo tags an
// initial status the same way the desktop app does (the MCP server has no
// access to Settings, so it uses the same 180-day default).
export function computeStatus(archived, pushedAt, staleDays = 180) {
  if (archived) return "archived";
  const day = typeof pushedAt === "string" ? pushedAt.slice(0, 10) : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    const days = (Date.parse(`${today()}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86_400_000;
    if (days > staleDays) return "stale";
  }
  return "active";
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
