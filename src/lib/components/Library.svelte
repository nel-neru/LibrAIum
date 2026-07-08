<script>
  import { app, runSearch } from "../state.svelte.js";
  import EntryCard from "./EntryCard.svelte";

  let debounceTimer;
  function onFilterChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, 160);
  }

  function clearFilters() {
    Object.assign(app.filters, { query: "", category: "", tag: "", status: "", minStars: "" });
    runSearch();
  }

  let hasFilters = $derived(
    app.filters.query || app.filters.category || app.filters.tag || app.filters.status || app.filters.minStars !== ""
  );
</script>

<header class="page-head">
  <h2 class="page-title">Library</h2>
  <div class="row" style="flex-wrap: wrap;">
    <input
      class="grow"
      style="min-width: 220px;"
      placeholder="Search name, tags, language, summary…"
      bind:value={app.filters.query}
      oninput={onFilterChange}
    />
    <select bind:value={app.filters.category} onchange={onFilterChange}>
      <option value="">All categories</option>
      {#each app.categories as c}
        <option value={c.id}>{c.icon} {c.name}</option>
      {/each}
    </select>
    <select bind:value={app.filters.status} onchange={onFilterChange}>
      <option value="">Any status</option>
      <option value="active">active</option>
      <option value="stale">stale</option>
      <option value="archived">archived</option>
    </select>
    <input
      type="number"
      min="0"
      placeholder="min ★"
      style="width: 90px;"
      bind:value={app.filters.minStars}
      oninput={onFilterChange}
    />
    {#if app.filters.tag}
      <button class="chip" onclick={() => { app.filters.tag = ""; runSearch(); }}>
        tag: {app.filters.tag} ✕
      </button>
    {/if}
    {#if hasFilters}
      <button class="small" onclick={clearFilters}>Clear</button>
    {/if}
  </div>
</header>

<p class="count num">{app.results.length} of {app.entries.length} repositories</p>

{#if app.results.length === 0}
  <div class="card" style="text-align: center; padding: 56px 48px;">
    <p class="muted" style="margin-top: 0;">No matching volumes on the shelves.</p>
    <button class="primary" onclick={() => (app.showAdd = true)}>+ Add repository</button>
  </div>
{:else}
  <div class="grid-cards">
    {#each app.results as entry (entry.id)}
      <EntryCard {entry} />
    {/each}
  </div>
{/if}

<style>
  .page-head { margin-bottom: 16px; }
  .page-title { font-size: 26px; line-height: 32px; margin-bottom: 16px; }
  .count {
    margin: 0 0 14px;
    font-size: 10.5px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--tx-2);
  }
  .grid-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }
</style>
