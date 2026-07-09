#!/usr/bin/env node
// One-command user-scope registration of the libraium MCP server, plus a
// stdio doctor for when it "silently doesn't work" in some repo.
//
//   node scripts/register-mcp.mjs                # print the plan, execute nothing
//   node scripts/register-mcp.mjs --yes          # register (claude mcp add --scope user)
//   node scripts/register-mcp.mjs --yes --with-skill
//                                                # ...and install the libraium-first skill
//   node scripts/register-mcp.mjs --doctor       # no config changes: spawn the server over
//                                                # stdio, handshake, count entries
//
// Registration touches user-level config (~/.claude.json), so the default is
// show-then-confirm: nothing executes without --yes. Idempotent: an existing
// user-scope registration is removed first, so re-running after moving the
// checkout re-bakes the absolute paths.
import { existsSync, cpSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const SERVER = join(ROOT, "mcp-server", "index.js");
const DATA = join(ROOT, "data");
const SKILL_SRC = join(ROOT, "integrations", "claude", "skills", "libraium-first");
const SKILL_DST = join(homedir(), ".claude", "skills", "libraium-first");

const argSet = new Set(process.argv.slice(2));
const KNOWN = ["--yes", "--with-skill", "--doctor"];
const unknown = [...argSet].filter((a) => !KNOWN.includes(a));
if (unknown.length) {
  console.error(`unknown flag(s): ${unknown.join(", ")}`);
  console.error("usage: register-mcp.mjs [--yes] [--with-skill] [--doctor]");
  process.exit(2);
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function claudeAvailable() {
  try {
    execFileSync("claude", ["--version"], { stdio: ["ignore", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

// Shared sanity: the paths we bake in must exist before anything else.
if (!existsSync(SERVER)) fail(`server not found: ${SERVER}`);
if (!existsSync(join(DATA, "master", "categories.yaml"))) fail(`data dir looks wrong: ${DATA} (no master/categories.yaml)`);
if (!existsSync(join(ROOT, "mcp-server", "node_modules"))) {
  fail(`mcp-server/node_modules missing — run: cd ${join(ROOT, "mcp-server")} && npm install`);
}

if (argSet.has("--doctor")) {
  // Read-only diagnosis: talk to the server exactly the way Claude Code would.
  const registered = (() => {
    if (!claudeAvailable()) return "unknown (claude CLI not on PATH)";
    try {
      execFileSync("claude", ["mcp", "get", "libraium"], { stdio: ["ignore", "pipe", "pipe"] });
      return "registered (claude mcp get libraium succeeded)";
    } catch {
      return "NOT registered — run: node scripts/register-mcp.mjs --yes";
    }
  })();

  const server = spawn(process.execPath, [SERVER, "--data-dir", DATA], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  let servedFrom = "(no serving-data line seen on stderr)";
  createInterface({ input: server.stderr }).on("line", (l) => {
    const m = l.match(/serving data from (.*)$/);
    if (m) servedFrom = m[1];
  });
  const pending = new Map();
  let nextId = 1;
  createInterface({ input: server.stdout }).on("line", (line) => {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    if (msg.id != null && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  const request = (method, params) => {
    const id = nextId++;
    return new Promise((res, rej) => {
      pending.set(id, res);
      setTimeout(() => rej(new Error(`timeout waiting for ${method}`)), 30_000).unref();
      server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  };
  try {
    const init = await request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "register-mcp-doctor", version: "0.0.0" },
    });
    server.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }) + "\n");
    const search = await request("tools/call", { name: "search_repos", arguments: {} });
    const count = JSON.parse(search.result.content[0].text).count;
    console.log("libraium MCP doctor");
    console.log(`  registration : ${registered}`);
    console.log(`  server       : ${SERVER} (handshake ok, server '${init.result.serverInfo.name}')`);
    console.log(`  data dir     : ${servedFrom}`);
    console.log(`  entries      : ${count}`);
  } catch (e) {
    fail(`stdio check failed: ${e.message}`);
  } finally {
    server.kill();
  }
  process.exit(0);
}

const addArgs = ["mcp", "add", "--scope", "user", "libraium", "--", "node", SERVER, "--data-dir", DATA];
const removeArgs = ["mcp", "remove", "--scope", "user", "libraium"];

console.log("Plan:");
console.log(`  claude ${removeArgs.join(" ")}   (ignore failure — idempotency)`);
console.log(`  claude ${addArgs.join(" ")}`);
if (argSet.has("--with-skill")) {
  console.log(`  cp -r ${SKILL_SRC} -> ${SKILL_DST}`);
}

if (!argSet.has("--yes")) {
  console.log("\nNothing executed (user-level config). Re-run with --yes to apply, --doctor to diagnose.");
  process.exit(0);
}

if (!claudeAvailable()) fail("claude CLI not found on PATH — install Claude Code first");
try {
  execFileSync("claude", removeArgs, { stdio: ["ignore", "pipe", "pipe"] });
} catch {
  /* was not registered — fine */
}
execFileSync("claude", addArgs, { stdio: "inherit" });
if (argSet.has("--with-skill")) {
  cpSync(SKILL_SRC, SKILL_DST, { recursive: true });
  console.log(`installed skill: ${SKILL_DST}`);
}
console.log("\nDone. Verify with: node scripts/register-mcp.mjs --doctor  (and `claude mcp list`)");
console.log("New sessions pick the server up; already-open sessions need a restart.");
