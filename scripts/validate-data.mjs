#!/usr/bin/env node
// validate-data.mjs — integrity check for the LibrAIum data/ directory.
//
// Usage: node scripts/validate-data.mjs [--data-dir <dir>]
//
// Deliberately reuses the MCP server's data layer (mcp-server/lib/store.js) so the
// validator accepts exactly what the Node implementation accepts. The format itself
// is dual-implemented (Rust: src-tauri/src/frontmatter.rs + store.rs) — see
// tests/fixtures/format/README.md for the format contract and known constraints.
//
// Exit code: 0 when clean, 1 when any problem was found.
// Output: one line per problem ("<file>: <problem>"), then a summary line.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, isAbsolute } from "node:path";
import {
  resolveDataDir,
  parseEntry,
  loadCategories,
  slugify,
  normalizeGithubUrl,
} from "../mcp-server/lib/store.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KEBAB_RE = /^[a-z0-9-]+$/;
const STATUSES = new Set(["active", "stale", "archived"]);
const SOURCES = new Set(["manual", "mcp", "x-collection"]);
const REQUIRED = ["github_url", "full_name", "category"];
const DATE_FIELDS = ["last_github_push", "last_checked", "added_date", "reception_gathered"];
const REL_FIELDS = ["superseded_by", "pairs_with"];
const OWNER_REPO_RE = /^[^/\s]+\/[^/\s]+$/;

const dataDir = resolveDataDir(process.argv);
const problems = [];
const warnings = []; // non-failing: dangling relationship targets (may be shelved later)
const relRefs = []; // {lbl, field, name} — existence checked after the full scan (forward refs)
const problem = (file, msg) => problems.push(`${file}: ${msg}`);

/** Print paths relative to cwd when they are inside it, absolute otherwise. */
function label(path) {
  const rel = relative(process.cwd(), path);
  return rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel : path;
}

// ---------- categories.yaml ----------
const catPath = join(dataDir, "master", "categories.yaml");
const catLabel = label(catPath);
let categories = [];
let categoriesLoaded = false;
if (!existsSync(catPath)) {
  problem(catLabel, "categories.yaml not found");
} else {
  try {
    categories = loadCategories(dataDir);
    categoriesLoaded = true;
  } catch (e) {
    problem(catLabel, `failed to parse: ${e.message}`);
  }
}

const catIds = new Set();
for (const cat of categories) {
  const id = cat?.id;
  if (typeof id !== "string" || id.trim() === "") {
    problem(catLabel, `category with name '${cat?.name ?? "?"}' has a missing or empty id`);
  } else {
    if (!KEBAB_RE.test(id)) problem(catLabel, `category id '${id}' is not kebab-case (must match ^[a-z0-9-]+$)`);
    if (catIds.has(id)) problem(catLabel, `duplicate category id '${id}'`);
    catIds.add(id);
  }
  if (typeof cat?.name !== "string" || cat.name.trim() === "") {
    problem(catLabel, `category '${id ?? "?"}' has a missing or empty name`);
  }
}

// ---------- entry files ----------
const entriesRoot = join(dataDir, "entries");
let entryCount = 0;
const fullNames = new Map(); // lowercased full_name -> first file seen

if (existsSync(entriesRoot)) {
  const catDirs = readdirSync(entriesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  for (const dirName of catDirs) {
    const files = readdirSync(join(entriesRoot, dirName)).filter((f) => f.endsWith(".md")).sort();
    for (const file of files) {
      entryCount++;
      const path = join(entriesRoot, dirName, file);
      const lbl = label(path);
      const stem = file.replace(/\.md$/, "");

      let meta;
      try {
        ({ meta } = parseEntry(readFileSync(path, "utf8")));
      } catch (e) {
        problem(lbl, `parse error: ${e.message}`);
        continue;
      }
      if (meta === null || typeof meta !== "object" || Array.isArray(meta)) {
        problem(lbl, "frontmatter is not a YAML mapping");
        continue;
      }

      // Required, non-empty string fields.
      for (const field of REQUIRED) {
        const v = meta[field];
        if (typeof v !== "string" || v.trim() === "") {
          problem(lbl, `required field '${field}' is missing or empty`);
        }
      }

      const category = meta.category;
      if (typeof category === "string" && category.trim() !== "") {
        if (category !== dirName) {
          problem(lbl, `category '${category}' does not match parent directory '${dirName}'`);
        }
        if (categoriesLoaded && !catIds.has(category)) {
          problem(lbl, `category '${category}' not found in categories.yaml`);
        }
      }

      const fullName = meta.full_name;
      if (typeof fullName === "string" && fullName.trim() !== "") {
        const expected = slugify(fullName);
        if (stem !== expected) {
          problem(lbl, `file stem '${stem}' does not match slugify(full_name) '${expected}'`);
        }
        const key = fullName.toLowerCase();
        if (fullNames.has(key)) {
          problem(lbl, `duplicate full_name '${fullName}' (already used by ${fullNames.get(key)})`);
        } else {
          fullNames.set(key, lbl);
        }
      }

      if (meta.status !== undefined && !STATUSES.has(meta.status)) {
        problem(lbl, `invalid status '${meta.status}' (expected active | stale | archived)`);
      }
      if (meta.source !== undefined && !SOURCES.has(meta.source)) {
        problem(lbl, `invalid source '${meta.source}' (expected manual | mcp | x-collection)`);
      }

      if (meta.tags !== undefined) {
        if (!Array.isArray(meta.tags)) {
          problem(lbl, `tags is not an array (got ${typeof meta.tags})`);
        } else {
          meta.tags.forEach((t, i) => {
            if (typeof t !== "string" || t.trim() === "") {
              problem(lbl, `tags[${i}] is not a non-empty string`);
            }
          });
        }
      }

      // Relationship edges (superseded_by / pairs_with). Shape errors are hard
      // (always a bug); a reference to a repo not yet shelved is a lenient
      // WARNING — a migration/pairing target may be recorded before it is added.
      // An empty array is a hard error: it must be omitted entirely so it never
      // reaches the serializer's skip-if-empty path (dual-format parity).
      for (const field of REL_FIELDS) {
        const v = meta[field];
        if (v === undefined) continue;
        if (!Array.isArray(v)) {
          problem(lbl, `${field} is not an array (got ${typeof v})`);
          continue;
        }
        if (v.length === 0) {
          problem(lbl, `${field} is an empty array — omit the field entirely instead`);
          continue;
        }
        v.forEach((name, i) => {
          if (typeof name !== "string" || !OWNER_REPO_RE.test(name)) {
            problem(lbl, `${field}[${i}] '${name}' is not a valid owner/repo full_name`);
          } else if (typeof fullName === "string" && name.toLowerCase() === fullName.toLowerCase()) {
            problem(lbl, `${field}[${i}] references itself`);
          } else {
            relRefs.push({ lbl, field, name });
          }
        });
      }

      if (
        meta.stars !== undefined &&
        (typeof meta.stars !== "number" || !Number.isFinite(meta.stars) || meta.stars < 0)
      ) {
        problem(lbl, `stars '${meta.stars}' is not a non-negative number`);
      }

      for (const field of DATE_FIELDS) {
        const v = meta[field];
        if (v !== undefined && v !== null && !(typeof v === "string" && DATE_RE.test(v))) {
          problem(lbl, `${field} '${v}' does not match YYYY-MM-DD`);
        }
      }

      if (typeof meta.github_url === "string" && meta.github_url.trim() !== "") {
        try {
          const { fullName: urlFullName } = normalizeGithubUrl(meta.github_url);
          if (
            typeof fullName === "string" &&
            fullName.trim() !== "" &&
            urlFullName.toLowerCase() !== fullName.toLowerCase()
          ) {
            problem(lbl, `github_url resolves to '${urlFullName}' which does not match full_name '${fullName}'`);
          }
        } catch (e) {
          problem(lbl, `invalid github_url: ${e.message}`);
        }
      }
    }
  }
}

// ---------- relationship existence (second pass — forward refs now resolvable) ----------
for (const { lbl, field, name } of relRefs) {
  if (!fullNames.has(name.toLowerCase())) {
    warnings.push(`${lbl}: ${field} target '${name}' is not shelved yet (ok — a migration/pairing target may be recorded before it is added)`);
  }
}

// ---------- report ----------
for (const p of problems) console.log(p);
for (const w of warnings) console.log(w);
const warnSuffix = warnings.length ? `, ${warnings.length} warning(s)` : "";
if (problems.length > 0) {
  console.log(`✗ ${problems.length} problem(s)${warnSuffix} in ${entryCount} entries, ${categories.length} categories (${dataDir})`);
  process.exit(1);
}
console.log(`✓ ${entryCount} entries, ${categories.length} categories validated${warnSuffix}`);
