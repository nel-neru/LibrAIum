// Browser-only development mock of the Tauri IPC layer.
//
// Loaded from main.js ONLY when running under plain `vite` (import.meta.env.DEV
// and no real __TAURI_INTERNALS__). Lets the UI be developed, previewed and
// screenshotted in an ordinary browser without compiling the Rust backend.
// Never bundled into production builds (the import is dead-code-eliminated).
//
// Data below mirrors the seeded sample library in data/ — including the
// deliberately stale openai/swarm entry used to demo stale detection.

const categories = [
  { id: "ai-agent", name: "AI Agents", color: "#5E409D", icon: "cpu", description: "AI agent development", order: 1 },
  { id: "web-app", name: "Web Apps", color: "#205EA6", icon: "globe", description: "Web application frameworks", order: 2 },
  { id: "mobile-app", name: "Mobile Apps", color: "#3AA99F", icon: "phone", description: "Mobile development", order: 3 },
  { id: "desktop-app", name: "Desktop Apps", color: "#4385BE", icon: "monitor", description: "Desktop applications", order: 4 },
  { id: "game-dev", name: "Game Dev", color: "#A02F6F", icon: "gamepad", description: "Game development", order: 5 },
  { id: "devops-infra", name: "DevOps & Infra", color: "#BC5215", icon: "server", description: "CI/CD and infrastructure", order: 6 },
  { id: "data-science", name: "Data Science", color: "#AD8301", icon: "chart", description: "Data analysis and ML", order: 7 },
  { id: "security", name: "Security", color: "#AF3029", icon: "shield", description: "Security tooling", order: 8 },
];

const now = "2026-07-08";

function entry(id, meta, body) {
  return { id, meta, body };
}

let entries = [
  entry("ai-agent/langchain-ai-langgraph", {
    github_url: "https://github.com/langchain-ai/langgraph",
    full_name: "langchain-ai/langgraph",
    category: "ai-agent",
    tags: ["agent", "orchestration", "python", "graph"],
    stars: 12400, language: "Python",
    last_github_push: "2026-07-06", last_checked: now,
    status: "active", source: "manual", added_date: "2026-06-20",
  }, "# langgraph\n\nGraph-based agent orchestration on LangChain — stateful multi-actor workflows with cycles and persistence.\n\n## Personal Notes\n\n- The checkpointer API is the part worth stealing: resumable state without a DB.\n- Pairs well with `qdrant/qdrant` for long-term memory."),

  entry("ai-agent/modelcontextprotocol-servers", {
    github_url: "https://github.com/modelcontextprotocol/servers",
    full_name: "modelcontextprotocol/servers",
    category: "ai-agent",
    tags: ["mcp", "reference", "typescript"],
    stars: 8900, language: "TypeScript",
    last_github_push: "2026-07-07", last_checked: now,
    status: "active", source: "mcp", added_date: "2026-06-22",
  }, "# servers\n\nReference MCP servers maintained by the protocol team — filesystem, git, fetch, memory.\n\n## Personal Notes\n\n- Read `src/filesystem` first; the allowlist pattern there is the canonical one.\n- Good template for LibrAIum's own MCP server layout."),

  entry("ai-agent/openai-swarm", {
    github_url: "https://github.com/openai/swarm",
    full_name: "openai/swarm",
    category: "ai-agent",
    tags: ["agent", "multi-agent", "python", "教育向け"],
    stars: 19800, language: "Python",
    last_github_push: "2025-03-11", last_checked: now,
    status: "stale", source: "manual", added_date: "2026-06-20",
  }, "# swarm\n\nEducational multi-agent handoff framework. Superseded in practice, kept for the handoff pattern.\n\n## Personal Notes\n\n- Deliberately stale sample — used to demo stale detection and alternatives."),

  entry("ai-agent/qdrant-qdrant", {
    github_url: "https://github.com/qdrant/qdrant",
    full_name: "qdrant/qdrant",
    category: "ai-agent",
    tags: ["vector-db", "rag", "rust"],
    stars: 23900, language: "Rust",
    last_github_push: "2026-07-05", last_checked: now,
    status: "active", source: "manual", added_date: "2026-06-21",
  }, "# qdrant\n\nVector database with filtering that actually scales — the default choice for local RAG.\n\n## Personal Notes\n\n- Runs happily in a single container; snapshot/restore is one HTTP call.\n- Payload indexes make hybrid search practical without a second store."),

  entry("ai-agent/run-llama-llama_index", {
    github_url: "https://github.com/run-llama/llama_index",
    full_name: "run-llama/llama_index",
    category: "ai-agent",
    tags: ["rag", "framework", "python"],
    stars: 38200, language: "Python",
    last_github_push: "2026-07-07", last_checked: now,
    status: "active", source: "manual", added_date: "2026-06-23",
  }, "# llama_index\n\nData framework for LLM apps — loaders, indexes, query engines.\n\n## Personal Notes\n\n- The ingestion pipeline abstractions are the durable part; query engines churn."),

  entry("devops-infra/casey-just", {
    github_url: "https://github.com/casey/just",
    full_name: "casey/just",
    category: "devops-infra",
    tags: ["task-runner", "cli", "rust"],
    stars: 21500, language: "Rust",
    last_github_push: "2026-07-01", last_checked: now,
    status: "active", source: "manual", added_date: "2026-06-25",
  }, "# just\n\nA command runner, not a build system — saner Makefile replacement.\n\n## Personal Notes\n\n- `just --list` as project onboarding is an underrated pattern."),

  entry("web-app/sveltejs-kit", {
    github_url: "https://github.com/sveltejs/kit",
    full_name: "sveltejs/kit",
    category: "web-app",
    tags: ["framework", "ssr", "svelte", "javascript"],
    stars: 19600, language: "JavaScript",
    last_github_push: "2026-07-04", last_checked: now,
    status: "active", source: "manual", added_date: "2026-06-23",
  }, "# kit\n\nFull-stack Svelte framework — filesystem routing, SSR/SSG, adapters for every platform.\n\n## Personal Notes\n\n- Default choice for content-heavy sites; pairs with Svelte 5 runes cleanly since v2.\n- `adapter-static` + form actions covers most small-business sites with almost no JS shipped."),
];

let settings = { data_dir: "", stale_days: 180 };

const gitState = {
  is_repo: true,
  branch: "main",
  has_remote: true,
  ahead: 1,
  changes: [
    { status: "M", path: "entries/ai-agent/openai-swarm.md" },
    { status: "A", path: "entries/web-app/sveltejs-kit.md" },
  ],
};

const gitLog = [
  { hash: "9c94619", date: "2026-07-07", message: "curate: weekly refresh" },
  { hash: "3f771cb", date: "2026-07-05", message: "add sveltejs/kit" },
  { hash: "c1b01f2", date: "2026-07-01", message: "notes: qdrant snapshot tip" },
];

// Mini-ports of the Rust core semantics (store.rs / search.rs) — just enough
// for the mock to exercise the REAL id/dedup/search flows in a browser. The
// authoritative implementations live in src-tauri/src ⇔ mcp-server/lib.
function slugify(fullName) {
  return [...fullName.toLowerCase()]
    .map((c) => (/[a-z0-9\-_.]/.test(c) ? c : "-"))
    .join("")
    .replace(/^-+|-+$/g, "");
}

function parseFullName(url) {
  const m = String(url).match(/github\.com[/:]([^/]+)\/([^/?#]+)/);
  return m ? `${m[1]}/${m[2].replace(/\.git$/, "")}` : null;
}

const firstSummaryLine = (body) =>
  body.split("\n").map((l) => l.trim()).find((l) => l && !l.startsWith("#") && !l.startsWith("---")) ?? "";

function matches(e, q) {
  if (q.category && e.meta.category !== q.category) return false;
  if (q.status && e.meta.status !== q.status) return false;
  if (q.min_stars != null && e.meta.stars < q.min_stars) return false;
  if (q.tags?.length && !q.tags.every((t) => e.meta.tags.some((et) => et.toLowerCase() === t.toLowerCase()))) {
    return false;
  }
  if (q.query) {
    // Same haystack fields as search.rs (name, tags, language, FIRST SUMMARY
    // LINE — not the whole body); plain substring stands in for Skim fuzzy.
    const hay = `${e.meta.full_name} ${e.meta.tags.join(" ")} ${e.meta.language ?? ""} ${firstSummaryLine(e.body)}`.toLowerCase();
    if (!hay.includes(q.query.toLowerCase())) return false;
  }
  return true;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const handlers = {
  get_settings: () => settings,
  update_settings: ({ newSettings }) => (settings = { ...settings, ...newSettings }),
  get_data_dir: () => "/Users/you/LibrAIum/data (mock)",

  list_entries: () => ({ entries, warnings: [] }),
  search_entries: ({ query }) =>
    entries.filter((e) => matches(e, query ?? {})).sort((a, b) => b.meta.stars - a.meta.stars),
  get_entry: ({ id }) => {
    const e = entries.find((x) => x.id === id);
    if (!e) throw `entry not found: ${id}`;
    return e;
  },
  save_entry: ({ meta, body, previousId }) => {
    // Mirrors store.rs save_entry: the id is ALWAYS <category>/<slug> — a
    // category change MOVES the entry (new call number) — and writing onto a
    // path owned by another entry is refused as a duplicate.
    const id = `${meta.category}/${slugify(meta.full_name)}`;
    const occupant = entries.find((x) => x.id === id);
    if (occupant && occupant.id !== previousId) throw `duplicate entry: ${id} already exists`;
    const saved = { id, meta, body };
    const idx = previousId ? entries.findIndex((x) => x.id === previousId) : -1;
    if (idx >= 0) entries[idx] = saved;
    else entries.push(saved);
    return saved;
  },
  delete_entry: ({ id }) => void (entries = entries.filter((x) => x.id !== id)),
  check_duplicate: ({ githubUrl }) => {
    // Mirrors commands.rs: normalize to full_name, compare case-insensitively
    // (raw-URL comparison missed `.git`/case/SSH variants of the same repo).
    const full = parseFullName(githubUrl);
    if (!full) throw `not a github.com repository URL: ${githubUrl}`;
    return entries.find((e) => e.meta.full_name.toLowerCase() === full.toLowerCase()) ?? null;
  },
  add_repo_from_url: async ({ githubUrl, category, tags, notes }) => {
    await sleep(600);
    const full = parseFullName(githubUrl);
    if (!full) throw "not a valid GitHub repository URL";
    // Mirrors the real add path: duplicates are refused (a double-add used to
    // create twin ids and crash Library's keyed {#each} in dev), and the
    // canonical URL derives from full_name, not the typed URL.
    const dup = entries.find((e) => e.meta.full_name.toLowerCase() === full.toLowerCase());
    if (dup) throw `already registered as ${dup.id}`;
    const e = entry(`${category}/${slugify(full)}`, {
      github_url: `https://github.com/${full}`, full_name: full, category, tags,
      stars: 4321, language: "TypeScript",
      last_github_push: now, last_checked: now,
      status: "active", source: "manual", added_date: now,
    }, `# ${full.split("/")[1]}\n\nFetched description would land here.\n\n## Reception\n\n${notes ?? "-"}`);
    entries.push(e);
    return e;
  },

  refresh_entry: async ({ id }) => {
    await sleep(500);
    return handlers.get_entry({ id });
  },
  refresh_all: async () => {
    await sleep(900);
    return { refreshed: entries.length, became_stale: 0, errors: [] };
  },
  suggest_alternatives: ({ id }) => {
    const cur = entries.find((x) => x.id === id);
    if (!cur) return [];
    // Mirrors search.rs suggest_alternatives: same category, active, ≥1 shared
    // tag (case-insensitive), ranked by overlap then stars, capped at 3.
    return entries
      .filter((e) => e.id !== id && e.meta.status === "active" && e.meta.category === cur.meta.category)
      .map((e) => {
        const overlap = e.meta.tags.filter((t) =>
          cur.meta.tags.some((tt) => tt.toLowerCase() === t.toLowerCase())
        ).length;
        return { e, score: overlap * 1000 + Math.min(e.meta.stars, 999) };
      })
      .filter(({ score }) => score >= 1000)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ e }) => e);
  },

  get_categories: () => categories,
  save_categories: ({ cats }) => cats,

  export_awesome: () =>
    "# Awesome LibrAIum\n\n## AI Agents\n\n- [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) ⭐ 12,400 — graph-based agent orchestration\n",

  git_status: () => gitState,
  git_init_data: () => gitState,
  git_commit: ({ message }) => (gitState.changes = [], "a1b2c3d"),
  git_push: async () => { await sleep(700); gitState.ahead = 0; },
  git_log: ({ n }) => gitLog.slice(0, n),

  has_github_token: () => false,
  set_github_token: () => null,
  clear_github_token: () => null,

  "plugin:opener|open_url": ({ url }) => void window.open(url, "_blank"),
};

window.__TAURI_INTERNALS__ = {
  invoke: async (cmd, args = {}) => {
    const h = handlers[cmd];
    if (!h) throw new Error(`[mock] unhandled command: ${cmd}`);
    return h(args);
  },
  transformCallback: () => 0,
  metadata: { currentWindow: { label: "main" }, currentWebview: { label: "main" } },
};

console.info("[libraium] Tauri IPC mock installed — browser preview mode");
