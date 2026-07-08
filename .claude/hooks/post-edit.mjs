#!/usr/bin/env node
// PostToolUse dispatcher (Write|Edit|MultiEdit).
// 1. Auto-formats Rust sources with rustfmt (best-effort, silent).
// 2. Reminds Claude when one half of the dual-implemented data format is
//    edited (Rust src-tauri store <-> Node mcp-server store).
// 3. Validates the data/ directory after any entry or category-master edit;
//    failures are fed back to Claude (exit code 2).
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { relative, resolve, isAbsolute } from "node:path";

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0); // malformed input — never break the session
}

const projectDir = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
const filePath = payload.tool_input?.file_path;
if (!filePath || typeof filePath !== "string") process.exit(0);

const abs = isAbsolute(filePath) ? filePath : resolve(projectDir, filePath);
const rel = relative(projectDir, abs).replaceAll("\\", "/");
if (rel.startsWith("..")) process.exit(0); // outside the project — not ours

const env = { ...process.env, PATH: `${process.env.PATH ?? ""}:/opt/homebrew/bin` };

// --- 1. rustfmt ---
if (rel.endsWith(".rs") && existsSync(abs)) {
  try {
    execFileSync("rustfmt", ["--edition", "2021", abs], { stdio: "ignore", env });
  } catch {
    // rustfmt missing or file mid-edit doesn't parse — formatting is best-effort
  }
}

const messages = [];

// --- 2. dual-implementation parity reminder ---
// Every Rust file that owns a rule mirrored in mcp-server/lib/store.js:
// store/frontmatter/models (format), github.rs (compute_status, 7569f6d),
// settings.rs (resolve_data_dir_from ⇔ resolveDataDir, 0fab55f),
// categories.rs+models.rs (Category schema ⇔ loadCategories, 6f2657c).
const PARITY_FILES = new Set([
  "src-tauri/src/store.rs",
  "src-tauri/src/frontmatter.rs",
  "src-tauri/src/models.rs",
  "src-tauri/src/github.rs",
  "src-tauri/src/settings.rs",
  "src-tauri/src/categories.rs",
  "mcp-server/lib/store.js",
]);
if (PARITY_FILES.has(rel)) {
  messages.push(
    `⚠ ${rel} is one half of the dual-implemented data layer (Rust app ⇔ Node MCP server). ` +
      `If parsing, serialization, slugify, URL normalization, status computation, data-dir resolution, ` +
      `or the EntryMeta/Category schemas changed, mirror the change in the counterpart file and run: node scripts/conformance.mjs`
  );
}

// --- 3. data validation ---
const touchesData =
  (rel.startsWith("data/entries/") && rel.endsWith(".md")) ||
  rel === "data/master/categories.yaml";
if (touchesData) {
  const validator = resolve(projectDir, "scripts/validate-data.mjs");
  if (existsSync(validator)) {
    try {
      // Pin the validator to the repo's data/ — the edit that triggered this
      // hook is in there. Without the flag, an exported LIBRAIUM_DATA_DIR
      // would redirect validation to a different library entirely.
      execFileSync(process.execPath, [validator, "--data-dir", resolve(projectDir, "data")], {
        stdio: ["ignore", "pipe", "pipe"],
        cwd: projectDir,
        env,
      });
    } catch (e) {
      const out = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
      console.error(`Data validation failed after editing ${rel}:\n${out}`);
      process.exit(2); // stderr is fed back to Claude for correction
    }
  }
}

if (messages.length > 0) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: messages.join("\n"),
      },
    })
  );
}
process.exit(0);
