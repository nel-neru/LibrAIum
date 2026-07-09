<script>
  import { app, openLibraryWith } from "../state.svelte.js";
  import Icon from "./Icon.svelte";

  const NAV = [
    ["dashboard", "Reading Room", "reading-room"],
    ["library", "Library", "library"],
    ["categories", "Categories", "catalog"],
    ["settings", "Settings", "settings"],
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
    <span class="eyebrow">Ex libris</span>
    <h1>LibrAIum</h1>
    <span class="tagline muted">your personal library, grown with AI</span>
  </div>

  <nav>
    {#each NAV as [view, label, icon]}
      <button
        class="nav-item"
        class:current={app.view === view}
        aria-current={app.view === view ? "page" : undefined}
        onclick={() => (app.view = view)}
      >
        <Icon name={icon} />{label}
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
          <span class="grow">{cat.name}</span>
          <span class="muted num">{counts.byCat[cat.id]}</span>
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

  {#if app.git.is_repo && app.git.changes > 0}
    <button
      class="git-dirty"
      onclick={() => (app.view = "settings")}
      title="Review and commit in Settings → Git"
    >
      <span class="git-dot"></span>
      <span class="grow">{app.git.changes} uncommitted change{app.git.changes === 1 ? "" : "s"}</span>
      {#if app.git.ahead > 0}<span class="muted num">↑{app.git.ahead}</span>{/if}
    </button>
  {/if}
  <button class="primary" onclick={() => (app.showAdd = true)}>+ Add repository</button>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
    background: var(--bg);
    border-right: 1px solid var(--ui);
    /* top padding clears the macOS traffic lights (overlay titlebar) */
    padding: 48px 18px 20px;
    overflow-y: auto;
  }

  /* ex-libris bookplate block */
  .brand {
    padding: 0 8px 14px;
    border-bottom: 1px solid var(--ui-2);
    position: relative;
  }
  .brand::after {
    /* the second line of a classic double rule */
    content: "";
    position: absolute;
    left: 8px;
    right: 8px;
    bottom: -4px;
    border-bottom: 1px solid var(--ui);
  }
  .eyebrow {
    display: block;
    font: 500 10px/1 var(--mono);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--accent);
    margin-bottom: 6px;
  }
  .brand h1 { font-size: 22px; font-weight: 500; letter-spacing: 0.01em; }
  .tagline { font-size: 11px; display: block; margin-top: 3px; }

  nav { display: flex; flex-direction: column; gap: 2px; }
  .nav-item {
    display: flex;
    gap: 10px;
    align-items: center;
    background: transparent;
    border: none;
    padding: 6px 10px;
    border-radius: var(--radius-control);
    text-align: left;
    font-weight: 400;
    color: var(--tx-2);
  }
  .nav-item:hover { background: var(--ui); color: var(--tx); }
  .nav-item.current { background: var(--ui); color: var(--tx); font-weight: 500; }
  .nav-item.current :global(svg) { color: var(--accent); }

  .section-title {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--tx-2);
    margin: 0 8px 8px;
  }
  .cat-item {
    display: flex;
    gap: 9px;
    align-items: center;
    width: 100%;
    background: transparent;
    border: none;
    padding: 4px 8px;
    border-radius: var(--radius-control);
    text-align: left;
    font-size: 12.5px;
    font-weight: 400;
    color: var(--tx);
  }
  .cat-item:hover { background: var(--ui); }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .grow { flex: 1; }

  /* Ambient "uncommitted changes" reminder — calm, not alarming: a hairline
     row with a stale-toned dot that deep-links to the Git panel. */
  .git-dirty {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    background: transparent;
    border: 1px solid var(--ui-2);
    padding: 6px 10px;
    border-radius: var(--radius-control);
    text-align: left;
    font-size: 12px;
    font-weight: 400;
    color: var(--tx-2);
  }
  .git-dirty:hover { background: var(--ui); color: var(--tx); }
  .git-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--st-stale-tx);
  }
</style>
