#!/usr/bin/env node
// LibrAIum MCP server (stdio) — lets Claude Code search, inspect, get
// suggestions from, and add to your personal best-practice repo library.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  resolveDataDir,
  listEntries,
  loadCategories,
  findDuplicate,
  guardRedirectedDuplicate,
  normalizeGithubUrl,
  normalizeTags,
  saveNewEntry,
  fetchGithubRepo,
  summarize,
  today,
  computeStatus,
} from "./lib/store.js";
import { suggest, alternativesFor } from "./lib/suggest.js";
import { compare, resolveSelector } from "./lib/compare.js";
import { overview } from "./lib/overview.js";

const DATA_DIR = resolveDataDir();

const server = new McpServer({ name: "libraium", version: "1.0.0" });

function json(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function jsonError(message) {
  return { content: [{ type: "text", text: JSON.stringify({ error: message }) }], isError: true };
}

server.registerTool(
  "search_repos",
  {
    title: "Search repositories",
    description:
      "Search the user's personally curated LibrAIum library of best-practice GitHub repositories. " +
      "All filters are optional; text query matches name, tags, language and summary. Category " +
      "ids and tags must match exactly — call get_library_overview first when unsure.",
    inputSchema: {
      query: z.string().optional().describe("free-text query"),
      category: z.string().optional().describe("category id, e.g. 'ai-agent'"),
      tags: z.array(z.string()).optional().describe("all listed tags must be present"),
      min_stars: z.number().optional(),
      status: z.enum(["active", "stale", "archived"]).optional(),
    },
  },
  async ({ query, category, tags, min_stars, status }) => {
    const q = (query ?? "").toLowerCase();
    const results = listEntries(DATA_DIR)
      .filter((e) => !category || e.meta.category === category)
      .filter((e) => !status || e.meta.status === status)
      .filter((e) => min_stars == null || (e.meta.stars ?? 0) >= min_stars)
      .filter((e) =>
        !tags?.length ||
        tags.every((t) => (e.meta.tags ?? []).some((et) => et.toLowerCase() === t.toLowerCase()))
      )
      .filter((e) => {
        if (!q) return true;
        const hay = `${e.meta.full_name} ${(e.meta.tags ?? []).join(" ")} ${e.meta.language ?? ""} ${e.body}`.toLowerCase();
        return q.split(/\s+/).every((tok) => hay.includes(tok));
      })
      .sort((a, b) => (b.meta.stars ?? 0) - (a.meta.stars ?? 0))
      .map(summarize);
    return json({ count: results.length, results });
  }
);

server.registerTool(
  "get_repo_details",
  {
    title: "Get repository details",
    description:
      "Full details of one library entry — metadata plus the Markdown body including the user's " +
      "Personal Notes (firsthand experience, gotchas, good pairings). Accepts an entry id " +
      "('category/owner-repo'), an 'owner/repo' name, or a GitHub URL. For stale/archived " +
      "entries the response carries alternatives: active same-category entries sharing tags " +
      "(the shelf's suggested successors; empty array = none shelved yet).",
    inputSchema: { id_or_url: z.string() },
  },
  async ({ id_or_url }) => {
    const entries = listEntries(DATA_DIR);
    const needle = id_or_url.trim().toLowerCase();
    let fullName = null;
    try {
      fullName = normalizeGithubUrl(id_or_url).fullName.toLowerCase();
    } catch {
      /* not a URL — fall through to id / name matching */
    }
    const entry = entries.find(
      (e) =>
        e.id.toLowerCase() === needle ||
        e.meta.full_name.toLowerCase() === needle ||
        (fullName && e.meta.full_name.toLowerCase() === fullName)
    );
    if (!entry) return jsonError(`no entry found for "${id_or_url}"`);
    const result = { ...summarize(entry), meta: entry.meta, body: entry.body };
    // Parity with the GUI's "what replaces this stale repo?" — attached at
    // exactly the decision moment; an empty array means no successor shelved.
    const status = entry.meta.status ?? "active";
    if (status === "stale" || status === "archived") {
      result.alternatives = alternativesFor(entries, entry, 3).map((a) => ({
        ...summarize(a),
        shared_tags: (a.meta.tags ?? []).filter((t) =>
          (entry.meta.tags ?? []).some((tt) => tt.toLowerCase() === t.toLowerCase())
        ),
      }));
    }
    return json(result);
  }
);

server.registerTool(
  "suggest_for_new_project",
  {
    title: "Suggest repositories for a new project",
    description:
      "Given a description of a project the user wants to build, rank the library's repositories " +
      "by fit and return the best candidates with reasoning, concrete adoption steps, and the " +
      "owner's firsthand Personal Notes bullets (personal_notes; null when none are recorded). " +
      "Use this when the user asks 'what should I use for X?'.",
    inputSchema: {
      project_description: z
        .string()
        .trim()
        .min(1, "describe the project — an empty description cannot be matched")
        .describe("what the user wants to build"),
      goals: z.string().optional().describe("extra goals/constraints, e.g. 'local-first, Python'"),
      max_results: z.number().int().min(1).max(20).default(5),
    },
  },
  async ({ project_description, goals, max_results }) => {
    // Without this, a corrupt categories.yaml rejected the whole handler and
    // the caller saw an SDK-level failure instead of the tool's {error}.
    try {
      const result = suggest(
        listEntries(DATA_DIR),
        loadCategories(DATA_DIR),
        project_description,
        goals ?? "",
        max_results ?? 5
      );
      if (result.query_tokens.length === 0) {
        return json({
          ...result,
          note: "The description contained no usable keywords (only stopwords/punctuation) — rephrase with concrete tech or domain terms, e.g. 'RAG pipeline with a vector DB in Rust'.",
        });
      }
      if (result.suggestions.length === 0) {
        return json({
          ...result,
          note: "No entry scored above the relevance threshold. The library may not cover this domain yet — consider add_repo after researching candidates.",
        });
      }
      return json(result);
    } catch (e) {
      return jsonError(e.message);
    }
  }
);

server.registerTool(
  "get_library_overview",
  {
    title: "Library overview — shelf map, tag vocabulary, health",
    description:
      "Cheap read-only map of the whole library: every category id with entry/stale/archived " +
      "counts and its top tags, the full tag vocabulary with usage counts, library totals, and " +
      "the resolved data directory. Call this FIRST when unsure which category ids or tags " +
      "exist — search_repos tag filters and add_repo categories must match them exactly.",
    inputSchema: {},
  },
  async () => {
    try {
      return json(overview(listEntries(DATA_DIR), loadCategories(DATA_DIR), DATA_DIR));
    } catch (e) {
      return jsonError(e.message);
    }
  }
);

server.registerTool(
  "compare_repos",
  {
    title: "Compare library entries side by side",
    description:
      "Decision matrix over 2-5 library entries (or a whole category shelf): aligned metadata, " +
      "each entry's full Personal Notes verbatim, shared vs unique tags, and computed decision " +
      "hints (stale/archived flags, star leader, push freshness). Use when the user weighs " +
      "options — 'LangGraph vs Dify?'. Pass exactly one of entries or category.",
    inputSchema: {
      entries: z
        .array(z.string())
        .min(2)
        .max(5)
        .optional()
        .describe("2-5 selectors: entry id ('category/owner-repo'), 'owner/repo', or GitHub URL"),
      category: z.string().optional().describe("compare a whole shelf instead (top 8 by stars)"),
    },
  },
  async ({ entries: selectors, category }) => {
    try {
      if (!!selectors?.length === !!category) {
        return jsonError("pass exactly one of: entries (2-5 selectors) or category");
      }
      const all = listEntries(DATA_DIR);
      let selected;
      if (category) {
        selected = all
          .filter((e) => e.meta.category === category)
          .sort((a, b) => (b.meta.stars ?? 0) - (a.meta.stars ?? 0))
          .slice(0, 8);
        if (selected.length < 2) {
          const ids = loadCategories(DATA_DIR).map((c) => c.id).join(", ");
          return jsonError(
            `category "${category}" has ${selected.length} entrie(s) — need at least 2 to compare. Valid ids: ${ids}`
          );
        }
      } else {
        const missing = [];
        const found = [];
        for (const s of selectors) {
          const e = resolveSelector(all, s);
          if (e) found.push(e);
          else missing.push(s);
        }
        if (missing.length) {
          return jsonError(
            `no entry found for: ${missing.join(", ")} — try search_repos to locate the right id`
          );
        }
        selected = [...new Map(found.map((e) => [e.id, e])).values()];
        if (selected.length < 2) {
          return jsonError("selectors resolved to fewer than 2 distinct entries");
        }
      }
      return json(compare(selected));
    } catch (e) {
      return jsonError(e.message);
    }
  }
);

server.registerTool(
  "add_repo",
  {
    title: "Add repository to the library",
    description:
      "Register a GitHub repository in the user's LibrAIum library. Fetches stars/language/freshness " +
      "from the GitHub API automatically. Fails on duplicates. Valid category ids and the existing " +
      "tag vocabulary come from get_library_overview — call it first and reuse tags before minting new ones.",
    inputSchema: {
      github_url: z.string(),
      category: z.string().describe("category id, e.g. 'ai-agent'"),
      tags: z.array(z.string()).default([]),
      personal_notes: z.string().optional().describe("Markdown notes: why it's worth shelving"),
    },
  },
  async ({ github_url, category, tags, personal_notes }) => {
    try {
      const { fullName } = normalizeGithubUrl(github_url);
      const dup = findDuplicate(DATA_DIR, fullName);
      if (dup) return jsonError(`already registered as ${dup.id}`);

      // Fail CLOSED when the category master is unavailable: skipping the
      // check here would accept any string, and category becomes a directory
      // name downstream.
      const categories = loadCategories(DATA_DIR);
      if (categories.length === 0) {
        return jsonError(
          `category master (master/categories.yaml) is missing or empty in ${DATA_DIR} — cannot validate category. Fix the data directory before adding repos.`
        );
      }
      if (!categories.some((c) => c.id === category)) {
        return jsonError(
          `unknown category "${category}". Valid ids: ${categories.map((c) => c.id).join(", ")}`
        );
      }

      const gh = await fetchGithubRepo(fullName);
      // A renamed repo 301-redirects and the API returns the NEW full_name —
      // re-check duplicates under it, or a rename bypasses the check above.
      guardRedirectedDuplicate(DATA_DIR, fullName, gh.full_name);
      const pushDate = gh.pushed_at?.slice(0, 10) ?? null;
      const meta = {
        // Derived from the API's post-redirect name, not the typed URL, so
        // github_url can never contradict full_name (validate-data invariant).
        github_url: `https://github.com/${gh.full_name}`,
        full_name: gh.full_name,
        category,
        tags: normalizeTags(tags),
        stars: gh.stargazers_count,
        language: gh.language ?? null,
        last_github_push: pushDate,
        last_checked: today(),
        // Match the desktop add path (commands.rs add_repo_from_url), which
        // seeds status from freshness — not just archived. Otherwise a
        // long-dormant repo added via MCP stays mislabeled 'active'.
        status: computeStatus(gh.archived, gh.pushed_at),
        source: "mcp",
        added_date: today(),
      };
      const repoName = gh.full_name.split("/").pop();
      const body = `# ${repoName}\n\n${gh.description ?? "(no description)"}\n\n## Personal Notes\n\n${personal_notes ?? "- "}\n`;
      const entry = saveNewEntry(DATA_DIR, meta, body);
      return json({ added: entry.id, ...summarize(entry) });
    } catch (e) {
      return jsonError(e.message);
    }
  }
);

await server.connect(new StdioServerTransport());
console.error(`[libraium-mcp] serving data from ${DATA_DIR}`);
