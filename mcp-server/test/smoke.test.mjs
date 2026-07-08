// End-to-end smoke test: spawns the MCP server over stdio and exercises all
// four tools against the repository's seeded data/ directory. No network needed
// (add_repo is only tested through its pre-network validation paths).
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const server = spawn(process.execPath, [join(HERE, "..", "index.js")], {
  env: { ...process.env, LIBRAIUM_DATA_DIR: resolve(HERE, "..", "..", "data") },
  stdio: ["pipe", "pipe", "inherit"],
});

const rl = createInterface({ input: server.stdout });
const pending = new Map();
rl.on("line", (line) => {
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

let nextId = 1;
function request(method, params) {
  const id = nextId++;
  return new Promise((resolvePromise, reject) => {
    pending.set(id, resolvePromise);
    // 30s: server boot (node + SDK import) can exceed 10s when the test runs
    // right after cargo/vite stages on a loaded machine (observed flake).
    setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 30_000).unref();
    server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });
}
function notify(method, params) {
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
}
function toolJson(response) {
  assert.equal(response.error, undefined, JSON.stringify(response.error));
  return JSON.parse(response.result.content[0].text);
}

try {
  // handshake
  const init = await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke", version: "0.0.0" },
  });
  assert.equal(init.result.serverInfo.name, "libraium");
  notify("notifications/initialized", {});

  // all four tools registered
  const tools = await request("tools/list", {});
  assert.deepEqual(
    tools.result.tools.map((t) => t.name).sort(),
    ["add_repo", "get_repo_details", "search_repos", "suggest_for_new_project"]
  );

  // search: free text
  const search = toolJson(
    await request("tools/call", { name: "search_repos", arguments: { query: "vector" } })
  );
  assert.ok(search.count >= 1);
  assert.ok(search.results.some((r) => r.full_name === "qdrant/qdrant"));

  // search: filters find the stale seed entry
  const stale = toolJson(
    await request("tools/call", {
      name: "search_repos",
      arguments: { category: "ai-agent", status: "stale" },
    })
  );
  assert.equal(stale.count, 1);
  assert.equal(stale.results[0].full_name, "openai/swarm");

  // details: by URL, includes Personal Notes body
  const details = toolJson(
    await request("tools/call", {
      name: "get_repo_details",
      arguments: { id_or_url: "https://github.com/qdrant/qdrant" },
    })
  );
  assert.ok(details.body.includes("## Personal Notes"));

  // details: by id and by full_name resolve to the same entry
  const byId = toolJson(
    await request("tools/call", {
      name: "get_repo_details",
      arguments: { id_or_url: "ai-agent/qdrant-qdrant" },
    })
  );
  assert.equal(byId.full_name, details.full_name);

  // suggest: the flagship tool returns ranked, reasoned suggestions
  const suggestions = toolJson(
    await request("tools/call", {
      name: "suggest_for_new_project",
      arguments: {
        project_description:
          "RAG agent combining a vector DB and knowledge management, exposed to Claude Code as an MCP server",
      },
    })
  );
  assert.ok(suggestions.suggestions.length >= 2);
  assert.ok(suggestions.suggestions[0].why.length > 0);
  assert.ok(suggestions.suggestions[0].how_to_adopt.length > 0);
  assert.ok(suggestions.suggestions.some((s) => s.full_name === "qdrant/qdrant"));

  // suggest: an irrelevant query must return ZERO suggestions — status/stars
  // alone must never clear the relevance threshold (regression: star-ranked
  // noise with empty `why` on garbage input).
  const irrelevant = toolJson(
    await request("tools/call", {
      name: "suggest_for_new_project",
      arguments: { project_description: "underwater basket weaving simulator in COBOL zzz9" },
    })
  );
  assert.equal(irrelevant.suggestions.length, 0, JSON.stringify(irrelevant.suggestions));
  assert.match(irrelevant.note, /relevance threshold/);

  // suggest: whitespace-only description fails schema validation outright
  const emptyDesc = await request("tools/call", {
    name: "suggest_for_new_project",
    arguments: { project_description: "   " },
  });
  assert.ok(
    emptyDesc.error || emptyDesc.result?.isError,
    `whitespace-only description must be rejected, got: ${JSON.stringify(emptyDesc).slice(0, 200)}`
  );

  // suggest: stopword-only description gets the explicit no-keywords note
  const stopwordsOnly = toolJson(
    await request("tools/call", {
      name: "suggest_for_new_project",
      arguments: { project_description: "build a new app" },
    })
  );
  assert.equal(stopwordsOnly.suggestions.length, 0);
  assert.match(stopwordsOnly.note, /no usable keywords/);

  // add_repo: duplicate and unknown-category are rejected before any network call
  const dup = toolJson(
    await request("tools/call", {
      name: "add_repo",
      arguments: { github_url: "https://github.com/qdrant/qdrant", category: "ai-agent" },
    })
  );
  assert.match(dup.error, /already registered/);

  const badCat = toolJson(
    await request("tools/call", {
      name: "add_repo",
      arguments: { github_url: "https://github.com/foo/bar", category: "not-a-category" },
    })
  );
  assert.match(badCat.error, /unknown category/);

  // add_repo: a traversal-shaped category must be rejected, never reach the fs
  const evilCat = toolJson(
    await request("tools/call", {
      name: "add_repo",
      arguments: { github_url: "https://github.com/foo/bar2", category: "../evil" },
    })
  );
  assert.match(evilCat.error, /unknown category/);

  console.log("✓ MCP smoke test passed — 4 tools, 12 scenarios");
  process.exitCode = 0;
} catch (e) {
  console.error("✗ MCP smoke test failed:", e);
  process.exitCode = 1;
} finally {
  server.kill();
}
