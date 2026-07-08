<script>
  import { app, selectEntry, categoryOf, runSearch } from "../state.svelte.js";

  let { entry } = $props();

  let cat = $derived(categoryOf(entry.meta.category));
  let summary = $derived(
    entry.body
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#")) ?? ""
  );

  function filterTag(tag, ev) {
    ev.stopPropagation();
    app.filters.tag = tag;
    runSearch();
  }
</script>

<div
  class="card entry"
  style="border-top: 3px solid {cat?.color ?? 'var(--border)'};"
  onclick={() => selectEntry(entry.id)}
  onkeydown={(e) => e.key === "Enter" && selectEntry(entry.id)}
  role="button"
  tabindex="0"
>
  <div class="row">
    <strong class="grow name">{entry.meta.full_name}</strong>
    <span class="badge {entry.meta.status}">{entry.meta.status}</span>
  </div>
  <p class="muted summary">{summary}</p>
  <div class="row" style="flex-wrap: wrap; gap: 6px;">
    {#each entry.meta.tags.slice(0, 5) as tag}
      <button class="chip" onclick={(ev) => filterTag(tag, ev)}>{tag}</button>
    {/each}
  </div>
  <div class="row muted mono" style="margin-top: 10px; font-size: 12px;">
    <span>⭐ {entry.meta.stars.toLocaleString()}</span>
    <span>{entry.meta.language ?? "—"}</span>
    <span class="grow"></span>
    <span>{cat?.icon ?? ""} {cat?.name ?? entry.meta.category}</span>
  </div>
</div>

<style>
  .entry { cursor: pointer; transition: transform 0.12s, border-color 0.12s; }
  .entry:hover { transform: translateY(-2px); border-color: var(--accent-strong); }
  .name { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .summary {
    margin: 8px 0 10px;
    font-size: 12.5px;
    min-height: 32px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
