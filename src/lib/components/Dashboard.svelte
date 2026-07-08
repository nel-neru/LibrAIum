<script>
  import { api } from "../api.js";
  import { app, openLibraryWith, selectEntry, showToast, fail, reloadEntries, categoryColor } from "../state.svelte.js";

  let stats = $derived.by(() => {
    const stale = app.entries.filter((e) => e.meta.status === "stale");
    const recent = [...app.entries]
      .filter((e) => e.meta.added_date)
      .sort((a, b) => (b.meta.added_date ?? "").localeCompare(a.meta.added_date ?? ""))
      .slice(0, 6);
    const catsUsed = new Set(app.entries.map((e) => e.meta.category)).size;
    const totalStars = app.entries.reduce((s, e) => s + e.meta.stars, 0);
    return { stale, recent, catsUsed, totalStars };
  });

  async function refreshAll() {
    // Both refresh actions hit GitHub and rewrite entry files — keep them
    // mutually exclusive with each other (but independent of push).
    if (app.busy.refreshAll || app.busy.refreshOne) return;
    app.busy.refreshAll = true;
    showToast("Refreshing GitHub metadata for all entries…");
    try {
      const report = await api.refreshAll();
      await reloadEntries();
      const errs = report.errors.length ? ` · ${report.errors.length} errors` : "";
      showToast(`Refreshed ${report.refreshed} entries · ${report.became_stale} became stale${errs}`);
      if (report.errors.length) console.warn("refresh errors:", report.errors);
    } catch (e) {
      fail(e);
    } finally {
      app.busy.refreshAll = false;
    }
  }
</script>

<header class="row page-head">
  <div class="grow">
    <h2 class="page-title">The Reading Room</h2>
    <span class="muted">curated best practices, kept fresh</span>
  </div>
  <button onclick={refreshAll} disabled={app.busy.refreshAll || app.busy.refreshOne}>
    {app.busy.refreshAll ? "Refreshing…" : "Refresh all metadata"}
  </button>
  <button class="primary" onclick={() => (app.showAdd = true)}>+ Add repository</button>
</header>

<div class="stats">
  <button class="card stat" onclick={() => openLibraryWith({})}>
    <div class="n num">{app.entries.length}</div>
    <div class="stat-label">repositories</div>
  </button>
  <button class="card stat" onclick={() => (app.view = "categories")}>
    <div class="n num">{stats.catsUsed}</div>
    <div class="stat-label">categories in use</div>
  </button>
  <button class="card stat" onclick={() => openLibraryWith({ status: "stale" })}>
    <div class="n num" class:overdue={stats.stale.length > 0}>{stats.stale.length}</div>
    <div class="stat-label">stale entries</div>
  </button>
  <div class="card stat">
    <div class="n num">{stats.totalStars.toLocaleString()}</div>
    <div class="stat-label">combined stars</div>
  </div>
</div>

<div class="cols">
  <section class="card">
    <h3 class="section-head">Needs attention</h3>
    {#if stats.stale.length === 0}
      <p class="muted">Nothing is stale. The shelves are dusted.</p>
    {:else}
      {#each stats.stale.slice(0, 8) as e}
        <button class="line" onclick={() => selectEntry(e.id)}>
          <span class="dot" style="background: {categoryColor(e.meta.category)}"></span>
          <span class="grow">{e.meta.full_name}</span>
          <span class="muted mono num">last push {e.meta.last_github_push ?? "?"}</span>
        </button>
      {/each}
    {/if}
  </section>

  <section class="card">
    <h3 class="section-head">Recently added</h3>
    {#if stats.recent.length === 0}
      <p class="muted">The library is empty — add your first repository.</p>
    {:else}
      {#each stats.recent as e}
        <button class="line" onclick={() => selectEntry(e.id)}>
          <span class="dot" style="background: {categoryColor(e.meta.category)}"></span>
          <span class="grow">{e.meta.full_name}</span>
          <span class="muted mono num">{e.meta.added_date}</span>
        </button>
      {/each}
    {/if}
  </section>
</div>

<style>
  .page-head { margin-bottom: 28px; }
  .page-title { font-size: 26px; line-height: 32px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat { text-align: left; padding: 16px 18px; }
  /* only the filter-jump stats are clickable — the combined-stars div is not */
  button.stat { cursor: pointer; }
  .stat .n { font-size: 28px; line-height: 1.2; font-family: var(--serif); font-weight: 500; }
  .stat .n.overdue { color: var(--st-stale-tx); }
  .stat-label {
    margin-top: 4px;
    font-size: 10.5px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--tx-2);
  }
  .section-head { font-size: 17px; margin-bottom: 12px; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .line {
    display: flex;
    gap: 9px;
    align-items: center;
    width: 100%;
    background: transparent;
    border: none;
    padding: 6px 8px;
    border-radius: var(--radius-control);
    text-align: left;
    font-weight: 400;
  }
  .line:hover { background: var(--bg); }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .grow { flex: 1; }
</style>
