// End-to-end smoke test: spawns the MCP server over stdio and exercises all
// five tools against the repository's seeded data/ directory, plus a second
// server over test/fixtures/stale-lib — a tiny checked-in library with a
// GUARANTEED stale entry. Stale-dependent scenarios live there, so refreshing
// the real library (which may legitimately flip a dormant repo back to
// active, as openai/swarm did upstream in 2026-04) can never break the suite.
// No network needed (add_repo is only tested through its pre-network
// validation paths).
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

function startServer(dataDir) {
  const server = spawn(process.execPath, [join(HERE, "..", "index.js")], {
    env: { ...process.env, LIBRAIUM_DATA_DIR: dataDir },
    stdio: ["pipe", "pipe", "inherit"],
  });
  const rl = createInterface({ input: server.stdout });
  const pending = new Map();
  let nextId = 1;
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
  async function handshake(name) {
    const init = await request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name, version: "0.0.0" },
    });
    assert.equal(init.result.serverInfo.name, "libraium");
    server.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }) + "\n"
    );
  }
  return { request, handshake, kill: () => server.kill() };
}

function toolJson(response) {
  assert.equal(response.error, undefined, JSON.stringify(response.error));
  return JSON.parse(response.result.content[0].text);
}

const main = startServer(resolve(HERE, "..", "..", "data"));
const staleLib = startServer(resolve(HERE, "fixtures", "stale-lib"));

try {
  await main.handshake("smoke");

  // all six tools registered
  const tools = await main.request("tools/list", {});
  assert.deepEqual(
    tools.result.tools.map((t) => t.name).sort(),
    ["add_repo", "compare_repos", "get_library_overview", "get_repo_details", "search_repos", "suggest_for_new_project"]
  );

  // overview: counts reconcile and the tag vocabulary is search-filterable
  const map = toolJson(
    await main.request("tools/call", { name: "get_library_overview", arguments: {} })
  );
  assert.equal(map.totals.categories, map.categories.length);
  assert.equal(
    map.categories.reduce((n, c) => n + c.entry_count, 0),
    map.totals.entries,
    "per-category counts must sum to the library total"
  );
  assert.ok(map.data_dir.endsWith("data"));
  const sampleTag = Object.keys(map.tags)[0];
  const tagHit = toolJson(
    await main.request("tools/call", { name: "search_repos", arguments: { tags: [sampleTag] } })
  );
  assert.ok(tagHit.count >= 1, `vocabulary tag "${sampleTag}" must be filterable`);

  // search: free text
  const search = toolJson(
    await main.request("tools/call", { name: "search_repos", arguments: { query: "vector" } })
  );
  assert.ok(search.count >= 1);
  assert.ok(search.results.some((r) => r.full_name === "qdrant/qdrant"));

  // search: status filter over the real library — status-agnostic of any
  // particular seed (a metadata refresh may flip entries; stale semantics are
  // pinned on the fixture server below)
  const active = toolJson(
    await main.request("tools/call", {
      name: "search_repos",
      arguments: { category: "ai-agent", status: "active" },
    })
  );
  assert.ok(active.count >= 1);
  assert.ok(active.results.some((r) => r.full_name === "qdrant/qdrant"));

  // details: by URL, includes Personal Notes body
  const details = toolJson(
    await main.request("tools/call", {
      name: "get_repo_details",
      arguments: { id_or_url: "https://github.com/qdrant/qdrant" },
    })
  );
  assert.ok(details.body.includes("## Personal Notes"));

  // details: by id and by full_name resolve to the same entry
  const byId = toolJson(
    await main.request("tools/call", {
      name: "get_repo_details",
      arguments: { id_or_url: "ai-agent/qdrant-qdrant" },
    })
  );
  assert.equal(byId.full_name, details.full_name);

  // suggest: the flagship tool returns ranked, reasoned suggestions
  const suggestions = toolJson(
    await main.request("tools/call", {
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
  const qdrant = suggestions.suggestions.find((s) => s.full_name === "qdrant/qdrant");
  assert.ok(
    Array.isArray(qdrant.personal_notes) && qdrant.personal_notes.length >= 1,
    "suggestions must inline the owner's Personal Notes bullets"
  );

  // suggest: an irrelevant query must return ZERO suggestions — status/stars
  // alone must never clear the relevance threshold (regression: star-ranked
  // noise with empty `why` on garbage input).
  const irrelevant = toolJson(
    await main.request("tools/call", {
      name: "suggest_for_new_project",
      arguments: { project_description: "underwater basket weaving simulator in COBOL zzz9" },
    })
  );
  assert.equal(irrelevant.suggestions.length, 0, JSON.stringify(irrelevant.suggestions));
  assert.match(irrelevant.note, /relevance threshold/);

  // suggest: whitespace-only description fails schema validation outright
  const emptyDesc = await main.request("tools/call", {
    name: "suggest_for_new_project",
    arguments: { project_description: "   " },
  });
  assert.ok(
    emptyDesc.error || emptyDesc.result?.isError,
    `whitespace-only description must be rejected, got: ${JSON.stringify(emptyDesc).slice(0, 200)}`
  );

  // suggest: stopword-only description gets the explicit no-keywords note
  const stopwordsOnly = toolJson(
    await main.request("tools/call", {
      name: "suggest_for_new_project",
      arguments: { project_description: "build a new app" },
    })
  );
  assert.equal(stopwordsOnly.suggestions.length, 0);
  assert.match(stopwordsOnly.note, /no usable keywords/);

  // compare: real pair — matrix shape, verbatim notes, shared tags (no
  // status assumptions here)
  const matrix = toolJson(
    await main.request("tools/call", {
      name: "compare_repos",
      arguments: { entries: ["openai/swarm", "langchain-ai/langgraph"] },
    })
  );
  assert.equal(matrix.entries.length, 2);
  assert.ok(
    matrix.entries.every((e) => typeof e.personal_notes === "string" && e.personal_notes.includes("- "))
  );
  assert.ok(matrix.shared_tags.length >= 1, "swarm and langgraph share the multi-agent tag");

  // compare: whole-shelf mode and the entries-XOR-category contract
  const shelf = toolJson(
    await main.request("tools/call", { name: "compare_repos", arguments: { category: "ai-agent" } })
  );
  assert.ok(shelf.entries.length >= 2);
  const both = toolJson(
    await main.request("tools/call", {
      name: "compare_repos",
      arguments: { entries: ["a/b", "c/d"], category: "ai-agent" },
    })
  );
  assert.match(both.error, /exactly one of/);

  // add_repo: duplicate and unknown-category are rejected before any network call
  const dup = toolJson(
    await main.request("tools/call", {
      name: "add_repo",
      arguments: { github_url: "https://github.com/qdrant/qdrant", category: "ai-agent" },
    })
  );
  assert.match(dup.error, /already registered/);

  const badCat = toolJson(
    await main.request("tools/call", {
      name: "add_repo",
      arguments: { github_url: "https://github.com/foo/bar", category: "not-a-category" },
    })
  );
  assert.match(badCat.error, /unknown category/);

  // add_repo: a traversal-shaped category must be rejected, never reach the fs
  const evilCat = toolJson(
    await main.request("tools/call", {
      name: "add_repo",
      arguments: { github_url: "https://github.com/foo/bar2", category: "../evil" },
    })
  );
  assert.match(evilCat.error, /unknown category/);

  // ---- fixture server: guaranteed-stale scenarios ----
  await staleLib.handshake("smoke-stale");

  // search: the status filter finds the guaranteed-stale entry
  const staleSearch = toolJson(
    await staleLib.request("tools/call", { name: "search_repos", arguments: { status: "stale" } })
  );
  assert.equal(staleSearch.count, 1);
  assert.equal(staleSearch.results[0].full_name, "old/dormant");

  // compare: stale hint + succession note, deterministic forever
  const staleMatrix = toolJson(
    await staleLib.request("tools/call", {
      name: "compare_repos",
      arguments: { entries: ["old/dormant", "new/active"] },
    })
  );
  assert.ok(staleMatrix.decision_hints.some((h) => h.includes("old/dormant is stale")));
  assert.deepEqual(staleMatrix.shared_tags, ["multi-agent"]);
  assert.equal(
    staleMatrix.entries[0].personal_notes,
    "- Superseded in practice; use new/active for real work."
  );

  console.log("✓ MCP smoke test passed — 6 tools, 19 scenarios (main + stale-fixture server)");
  process.exitCode = 0;
} catch (e) {
  console.error("✗ MCP smoke test failed:", e);
  process.exitCode = 1;
} finally {
  main.kill();
  staleLib.kill();
}
