#!/usr/bin/env node
// LibrAIum MCP server (stdio) — lets Claude Code search, inspect, get
// suggestions from, and add to your personal best-practice repo library.
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "node:fs";

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
  bodySection,
  today,
  computeStatus,
} from "./lib/store.js";
import { suggest, alternativesFor, tagAlternatives } from "./lib/suggest.js";
import { compare, resolveSelector } from "./lib/compare.js";
import { overview } from "./lib/overview.js";
import { searchRepos } from "./lib/search.js";
import { getRelated, resolveNames } from "./lib/related.js";
import { findByReception } from "./lib/reception.js";

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
      "All filters are optional; the text query matches name, tags, language and body ('-token' " +
      "excludes). tags = AND, any_tags = OR; language is exact (case-insensitive); " +
      "updated_within_days filters on push freshness; sort: stars | freshness | added. " +
      "Zero results come back with diagnostics (closest real tags, dead query tokens, valid " +
      "category ids) — use them to retry. Call get_library_overview first when unsure of ids/tags.",
    inputSchema: {
      query: z.string().optional().describe("free-text query; prefix a token with '-' to exclude it"),
      category: z.string().optional().describe("category id, e.g. 'ai-agent'"),
      tags: z.array(z.string()).optional().describe("all listed tags must be present (AND)"),
      any_tags: z.array(z.string()).optional().describe("at least one listed tag present (OR)"),
      language: z.string().optional().describe("exact primary language, case-insensitive, e.g. 'Rust'"),
      min_stars: z.number().optional(),
      status: z.enum(["active", "stale", "archived"]).optional(),
      updated_within_days: z.number().int().min(1).optional().describe("last GitHub push within N days"),
      sort: z.enum(["stars", "freshness", "added"]).default("stars"),
    },
  },
  async (params) => {
    try {
      return json(searchRepos(listEntries(DATA_DIR), loadCategories(DATA_DIR), params));
    } catch (e) {
      return jsonError(e.message);
    }
  }
);

server.registerTool(
  "get_repo_details",
  {
    title: "Get repository details",
    description:
      "Full details of one library entry — metadata plus the Markdown body including its " +
      "Reception (reception: third-party signal — recurring complaints, notable adopters, known " +
      "limitations, migration signal) and, where the owner has used it, firsthand Personal Notes. " +
      "Accepts an entry id ('category/owner-repo'), an 'owner/repo' name, or a GitHub URL. For " +
      "stale/archived entries the response carries alternatives: active same-category entries " +
      "sharing tags (the shelf's suggested successors; empty array = none shelved yet).",
    inputSchema: { id_or_url: z.string() },
  },
  async ({ id_or_url }) => {
    // Wrap the body like every other tool handler: an unreadable entries/ root
    // (or any other throw from listEntries) must surface as the standard
    // {error} JSON envelope, not a bare SDK-level error string.
    try {
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
      const result = {
        ...summarize(entry),
        meta: entry.meta,
        body: entry.body,
        // Convenience projection of the '## Reception' section so callers need
        // not parse the Markdown body; null when none has been gathered yet.
        reception: bodySection(entry.body, "reception"),
      };
      // Authored relationship edges, resolved to shelved entries (or bare names
      // for not-yet-shelved targets). Surfaced whenever present, independent of
      // status — pairings and succession are useful on active entries too.
      if (entry.meta.superseded_by?.length) {
        result.superseded_by = resolveNames(entries, entry.meta.superseded_by);
      }
      if (entry.meta.pairs_with?.length) {
        result.pairs_with = resolveNames(entries, entry.meta.pairs_with);
      }
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
    } catch (e) {
      return jsonError(e.message);
    }
  }
);

server.registerTool(
  "suggest_for_new_project",
  {
    title: "Suggest repositories for a new project",
    description:
      "Given a description of a project the user wants to build, rank the library's repositories " +
      "by fit and return the best candidates with reasoning, concrete adoption steps, each entry's " +
      "Reception (reception: third-party signal — complaints, adopters, limitations), and any " +
      "firsthand Personal Notes bullets (personal_notes; null when none are recorded). " +
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
      "each entry's Reception verbatim (reception: third-party signal — complaints, adopters, " +
      "limitations) plus any firsthand Personal Notes, shared vs unique tags, and computed decision " +
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
      reception: z
        .string()
        .optional()
        .describe("Markdown Reception — sourced THIRD-PARTY signal (recurring complaints, adopters, known limitations, migration signal); left as a placeholder if omitted. This is the primary layer."),
      personal_notes: z
        .string()
        .optional()
        .describe("Markdown Personal Notes — the USER's own FIRSTHAND take (gotchas, pairings). Optional; include ONLY when the user voiced genuine firsthand experience — never synthesized third-party signal (that goes in reception) and never invented."),
    },
  },
  async ({ github_url, category, tags, reception, personal_notes }) => {
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
      // Reception (third-party signal) is the primary layer on every entry;
      // Personal Notes (firsthand) is appended only when genuinely provided, so
      // the two-layer contract stays honest (see the libraium-first skill).
      let body = `# ${repoName}\n\n${gh.description ?? "(no description)"}\n\n## Reception\n\n${reception ?? "- "}\n`;
      if (personal_notes && personal_notes.trim()) {
        body += `\n## Personal Notes\n\n${personal_notes.trim()}\n`;
      }
      const entry = saveNewEntry(DATA_DIR, meta, body);
      return json({ added: entry.id, ...summarize(entry) });
    } catch (e) {
      return jsonError(e.message);
    }
  }
);

server.registerTool(
  "get_related",
  {
    title: "Related repositories — succession and pairings",
    description:
      "The structured relationship graph for one library entry: authored succession " +
      "(superseded_by → its replacement(s); supersedes → what it replaces, derived), " +
      "symmetric pairings (pairs_with, derived union of both directions), and the " +
      "tag-heuristic alternatives (active same-category entries sharing a tag). " +
      "Targets not yet shelved come back as {full_name, shelved:false}. Use this to " +
      "answer 'what should I use instead of X?' and 'what pairs with X?'. Accepts an " +
      "entry id ('category/owner-repo'), an 'owner/repo' name, or a GitHub URL.",
    inputSchema: { id_or_url: z.string() },
  },
  async ({ id_or_url }) => {
    try {
      const entries = listEntries(DATA_DIR);
      const target = resolveSelector(entries, id_or_url);
      if (!target) return jsonError(`no entry found for "${id_or_url}"`);
      return json({
        id: target.id,
        full_name: target.meta.full_name,
        ...getRelated(entries, target),
        // Pure tag heuristic (distinct from authored superseded_by, which may be
        // cross-category or name unshelved targets); shown for every entry.
        alternatives: tagAlternatives(entries, target, 3).map((a) => ({
          ...summarize(a),
          shared_tags: (a.meta.tags ?? []).filter((t) =>
            (target.meta.tags ?? []).some((tt) => tt.toLowerCase() === t.toLowerCase())
          ),
        })),
      });
    } catch (e) {
      return jsonError(e.message);
    }
  }
);

server.registerTool(
  "find_by_reception",
  {
    title: "Find repositories by their Reception signal",
    description:
      "Query the library's moat — the synthesized third-party Reception — across every entry. " +
      "Match a free-text `query` (an adopter name, a technology, a complaint keyword) and/or a " +
      "`signal`: 'migration' (what people move to/from), 'caution' (documented gotchas, " +
      "deprecation, limitations), or 'adopter' (named production adopters). Returns matching " +
      "entries with the specific Reception bullets that matched — the evidence, not the whole " +
      "entry. At least one of query/signal is required. Use it to answer 'which shelved repos " +
      "have a documented memory complaint?', 'who names adopter X?', 'what has migration signal?'.",
    inputSchema: {
      query: z.string().optional().describe("case-insensitive substring matched against Reception bullets"),
      signal: z.enum(["migration", "caution", "adopter"]).optional().describe("filter to bullets carrying this kind of signal"),
    },
  },
  async ({ query, signal }) => {
    try {
      if (!query?.trim() && !signal) {
        return jsonError("provide a query and/or a signal (migration | caution | adopter)");
      }
      const results = findByReception(listEntries(DATA_DIR), { query, signal });
      return json({ count: results.length, query: query ?? null, signal: signal ?? null, results });
    } catch (e) {
      return jsonError(e.message);
    }
  }
);

// Entries as MCP resources: Claude Code surfaces these in @-mention
// autocomplete, so typing '@libraium' and picking one pulls the full entry
// Markdown (notes, gotchas, pairings) into context with zero tool round-trips.
server.registerResource(
  "entry",
  new ResourceTemplate("entry://{category}/{slug}", {
    list: () => ({
      resources: listEntries(DATA_DIR).map((e) => ({
        uri: `entry://${e.id}`,
        name: `${e.meta.full_name} — ${e.meta.category}`,
        mimeType: "text/markdown",
      })),
    }),
  }),
  {
    title: "LibrAIum entry",
    description: "A curated repository entry (frontmatter + summary + its Reception, and any firsthand Personal Notes) as raw Markdown.",
    mimeType: "text/markdown",
  },
  (uri, { category, slug }) => {
    // Resolve by entry id, never by joining the URI segments into a path —
    // a crafted entry://../../x yields an id that matches no real entry and
    // 404s here, so the read can never escape data/entries.
    const id = `${category}/${slug}`;
    const entry = listEntries(DATA_DIR).find((e) => e.id === id);
    if (!entry) throw new Error(`no entry for ${uri.href}`);
    return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: readFileSync(entry.path, "utf8") }] };
  }
);

await server.connect(new StdioServerTransport());
console.error(`[libraium-mcp] serving data from ${DATA_DIR}`);
