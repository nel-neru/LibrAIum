<script>
  import { api } from "../api.js";
  import { app, openLibraryWith, selectEntry, showToast, fail, reloadEntries, categoryColor } from "../state.svelte.js";

  // An entry "needs curation" when its ## Reception section is absent/placeholder
  // OR its recorded gather date is stale — Reception is the primary, time-
  // sensitive layer, so both dimensions are curation debt.
  const RECEPTION_STALE_DAYS = 180;
  function receptionMissing(body) {
    const m = /^##\s+reception[^\n]*\n?/im.exec(body ?? "");
    if (!m) return true;
    const section = (body ?? "").slice(m.index + m[0].length).split(/\n##\s/)[0].trim();
    return section === "" || /^-\s*$/.test(section);
  }
  function receptionStale(gathered) {
    if (!gathered || !/^\d{4}-\d{2}-\d{2}$/.test(gathered)) return false;
    return (Date.now() - Date.parse(`${gathered}T00:00:00Z`)) / 86_400_000 > RECEPTION_STALE_DAYS;
  }
  function needsCuration(e) {
    return receptionMissing(e.body) || receptionStale(e.meta.reception_gathered);
  }

  let stats = $derived.by(() => {
    const stale = app.entries.filter((e) => e.meta.status === "stale");
    const recent = [...app.entries]
      .filter((e) => e.meta.added_date)
      .sort((a, b) => (b.meta.added_date ?? "").localeCompare(a.meta.added_date ?? ""))
      .slice(0, 6);
    const catsUsed = new Set(app.entries.map((e) => e.meta.category)).size;
    const needsReception = app.entries.filter(needsCuration);
    // Shelf map: every category that holds entries, biggest first.
    const byCat = {};
    for (const e of app.entries) byCat[e.meta.category] = (byCat[e.meta.category] ?? 0) + 1;
    const shelves = app.categories
      .filter((c) => byCat[c.id])
      .map((c) => ({ id: c.id, name: c.name, color: c.color, n: byCat[c.id] }))
      .sort((a, b) => b.n - a.n);
    const maxShelf = shelves.reduce((m, s) => Math.max(m, s.n), 1);
    return { stale, recent, catsUsed, needsReception, shelves, maxShelf };
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

{#if app.entries.length === 0}
  <!-- First run: the dual-consumer value (human GUI + AI via MCP) only pays off
       once MCP is registered, which is otherwise buried at the bottom of
       Settings. Surface the whole setup path while the library is empty. -->
  <section class="card firstrun">
    <h3 class="section-head">Welcome — set up your library</h3>
    <ol class="firstrun-steps">
      <li><button class="link" onclick={() => (app.showAdd = true)}>Add your first repository</button> — the shelf starts here.</li>
      <li><button class="link" onclick={() => (app.view = "settings")}>Add a GitHub token</button> (Settings) — lifts the metadata-refresh rate limit.</li>
      <li><button class="link" onclick={() => (app.view = "settings")}>Initialize git</button> (Settings) — your library becomes a versioned, diffable repo.</li>
      <li><strong>Register the MCP server</strong> so Claude Code can consult this library in every project — the copy-paste command is in Settings, and <span class="mono">docs/library-first-setup.md</span> has the one-page setup.</li>
    </ol>
  </section>
{/if}

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
  <!-- read-only signal, visibly distinct from the clickable jump-tiles: no
       filter jump for "reception debt", so it must not masquerade as clickable -->
  <div class="card stat readonly" title="Entries whose Reception is missing or a placeholder — run /reception">
    <div class="n num" class:overdue={stats.needsReception.length > 0}>{stats.needsReception.length}</div>
    <div class="stat-label">need reception</div>
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

<div class="cols">
  <section class="card">
    <h3 class="section-head">Shelves</h3>
    {#if stats.shelves.length === 0}
      <p class="muted">No shelves in use yet.</p>
    {:else}
      {#each stats.shelves as s}
        <button class="shelf" onclick={() => openLibraryWith({ category: s.id })}>
          <span class="shelf-name grow">{s.name}</span>
          <span class="bar-track">
            <span class="bar" style="width: {(s.n / stats.maxShelf) * 100}%; background: {s.color};"></span>
          </span>
          <span class="muted num shelf-n">{s.n}</span>
        </button>
      {/each}
    {/if}
  </section>

  <section class="card">
    <h3 class="section-head">Needs curation</h3>
    {#if stats.needsReception.length === 0}
      <p class="muted">Every entry has Reception. The catalog is annotated.</p>
    {:else}
      {#each stats.needsReception.slice(0, 8) as e}
        <button class="line" onclick={() => selectEntry(e.id)}>
          <span class="dot" style="background: {categoryColor(e.meta.category)}"></span>
          <span class="grow">{e.meta.full_name}</span>
          <span class="muted mono num">{receptionMissing(e.body) ? "no reception" : `gathered ${e.meta.reception_gathered}`}</span>
        </button>
      {/each}
      {#if stats.needsReception.length > 8}
        <p class="muted" style="margin: 8px 0 0; font-size: 12px;">
          +{stats.needsReception.length - 8} more — run <span class="mono">/reception</span> to gather signal.
        </p>
      {/if}
    {/if}
  </section>
</div>

<style>
  .page-head { margin-bottom: 28px; }
  .page-title { font-size: 26px; line-height: 32px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat { text-align: left; padding: 16px 18px; }
  button.stat { cursor: pointer; }
  /* the read-only signal tile is recessed and inert — never a border-hover, so
     it reads as information, not a jump target (the other three are buttons) */
  .stat.readonly { background: var(--bg); cursor: default; }
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
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
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

  /* shelf map: a name, a proportional rule in the category color, a count */
  .shelf {
    display: flex;
    gap: 10px;
    align-items: center;
    width: 100%;
    background: transparent;
    border: none;
    padding: 5px 8px;
    border-radius: var(--radius-control);
    text-align: left;
    font-weight: 400;
  }
  .shelf:hover { background: var(--bg); }
  .shelf-name { font-size: 12.5px; }
  .bar-track { flex: 1.4; height: 6px; background: var(--ui); border-radius: 3px; overflow: hidden; }
  .bar { display: block; height: 100%; border-radius: 3px; min-width: 3px; }
  .shelf-n { width: 22px; text-align: right; }

  .firstrun { margin-bottom: 24px; }
  .firstrun-steps {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
    line-height: 1.5;
  }
  .firstrun-steps li { color: var(--tx-2); }
  .link {
    background: transparent;
    border: none;
    padding: 0;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
  }
  .link:hover { color: var(--accent-hover); text-decoration: underline; }
</style>
