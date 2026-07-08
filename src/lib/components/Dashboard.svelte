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
    if (app.busy) return;
    app.busy = "refresh";
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
      app.busy = "";
    }
  }
</script>

<header class="row" style="margin-bottom: 22px;">
  <div class="grow">
    <h2 style="font-size: 24px;">The Reading Room</h2>
    <span class="muted">curated best practices, kept fresh</span>
  </div>
  <button onclick={refreshAll} disabled={app.busy === "refresh"}>
    {app.busy === "refresh" ? "Refreshing…" : "⟳ Refresh all metadata"}
  </button>
  <button class="primary" onclick={() => (app.showAdd = true)}>＋ Add repository</button>
</header>

<div class="stats">
  <button class="card stat" onclick={() => openLibraryWith({})}>
    <div class="n">{app.entries.length}</div>
    <div class="muted">repositories</div>
  </button>
  <button class="card stat" onclick={() => (app.view = "categories")}>
    <div class="n">{stats.catsUsed}</div>
    <div class="muted">categories in use</div>
  </button>
  <button class="card stat" onclick={() => openLibraryWith({ status: "stale" })}>
    <div class="n" style="color: var(--gold);">{stats.stale.length}</div>
    <div class="muted">stale entries</div>
  </button>
  <div class="card stat">
    <div class="n">{stats.totalStars.toLocaleString()}</div>
    <div class="muted">combined stars</div>
  </div>
</div>

<div class="cols">
  <section class="card">
    <h3 style="margin-bottom: 12px;">⚠ Needs attention</h3>
    {#if stats.stale.length === 0}
      <p class="muted">Nothing is stale. The shelves are dusted.</p>
    {:else}
      {#each stats.stale.slice(0, 8) as e}
        <button class="line" onclick={() => selectEntry(e.id)}>
          <span class="dot" style="background: {categoryColor(e.meta.category)}"></span>
          <span class="grow">{e.meta.full_name}</span>
          <span class="muted mono">last push {e.meta.last_github_push ?? "?"}</span>
        </button>
      {/each}
    {/if}
  </section>

  <section class="card">
    <h3 style="margin-bottom: 12px;">🕮 Recently added</h3>
    {#if stats.recent.length === 0}
      <p class="muted">The library is empty — add your first repository.</p>
    {:else}
      {#each stats.recent as e}
        <button class="line" onclick={() => selectEntry(e.id)}>
          <span class="dot" style="background: {categoryColor(e.meta.category)}"></span>
          <span class="grow">{e.meta.full_name}</span>
          <span class="muted mono">{e.meta.added_date}</span>
        </button>
      {/each}
    {/if}
  </section>
</div>

<style>
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .stat { text-align: left; cursor: pointer; }
  .stat .n { font-size: 30px; font-family: var(--serif); }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .line {
    display: flex;
    gap: 9px;
    align-items: center;
    width: 100%;
    background: transparent;
    border: none;
    padding: 7px 6px;
    border-radius: 7px;
    text-align: left;
  }
  .line:hover { background: var(--bg-panel); }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .grow { flex: 1; }
</style>
