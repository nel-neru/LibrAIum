<script>
  import { app, openLibraryWith } from "../state.svelte.js";

  const NAV = [
    ["dashboard", "Dashboard", "🏛️"],
    ["library", "Library", "📚"],
    ["categories", "Categories", "🗂️"],
    ["settings", "Settings", "⚙️"],
  ];

  let counts = $derived.by(() => {
    const byCat = {};
    const byStatus = { active: 0, stale: 0, archived: 0 };
    const byTag = {};
    for (const e of app.entries) {
      byCat[e.meta.category] = (byCat[e.meta.category] ?? 0) + 1;
      byStatus[e.meta.status] = (byStatus[e.meta.status] ?? 0) + 1;
      for (const t of e.meta.tags) byTag[t] = (byTag[t] ?? 0) + 1;
    }
    const topTags = Object.entries(byTag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 18);
    return { byCat, byStatus, topTags };
  });
</script>

<aside class="sidebar">
  <div class="brand">
    <h1>LibrAIum</h1>
    <span class="muted tagline">your personal library, grown with AI</span>
  </div>

  <nav>
    {#each NAV as [view, label, icon]}
      <button class="nav-item" class:current={app.view === view} onclick={() => (app.view = view)}>
        <span>{icon}</span>{label}
      </button>
    {/each}
  </nav>

  <div class="section">
    <div class="section-title">Status</div>
    <div class="row" style="flex-wrap: wrap; gap: 6px;">
      {#each ["active", "stale", "archived"] as s}
        <button class="chip" onclick={() => openLibraryWith({ status: s })}>
          {s} · {counts.byStatus[s] ?? 0}
        </button>
      {/each}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Categories</div>
    {#each app.categories as cat}
      {#if counts.byCat[cat.id]}
        <button class="cat-item" onclick={() => openLibraryWith({ category: cat.id })}>
          <span class="dot" style="background: {cat.color}"></span>
          <span class="grow">{cat.icon} {cat.name}</span>
          <span class="muted">{counts.byCat[cat.id]}</span>
        </button>
      {/if}
    {/each}
  </div>

  <div class="section grow">
    <div class="section-title">Tags</div>
    <div class="row" style="flex-wrap: wrap; gap: 6px;">
      {#each counts.topTags as [tag, n]}
        <button class="chip" onclick={() => openLibraryWith({ tag })}>{tag} · {n}</button>
      {/each}
    </div>
  </div>

  <button class="primary" onclick={() => (app.showAdd = true)}>＋ Add repository</button>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 18px;
    background: var(--bg-raised);
    border-right: 1px solid var(--border);
    padding: 22px 16px;
    overflow-y: auto;
  }
  .brand h1 {
    font-size: 26px;
    background: linear-gradient(120deg, var(--cream), var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .tagline { font-size: 11px; display: block; margin-top: 2px; }
  nav { display: flex; flex-direction: column; gap: 4px; }
  .nav-item {
    display: flex;
    gap: 10px;
    align-items: center;
    background: transparent;
    border: none;
    padding: 8px 10px;
    border-radius: 8px;
    text-align: left;
  }
  .nav-item.current { background: var(--bg-panel); color: var(--accent); }
  .section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    margin-bottom: 8px;
  }
  .cat-item {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    background: transparent;
    border: none;
    padding: 5px 8px;
    border-radius: 7px;
    text-align: left;
    font-size: 13px;
  }
  .dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
  .grow { flex: 1; }
</style>
