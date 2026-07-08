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

<!-- a card-catalog index card: call number, category rule, title, notes -->
<div
  class="card entry"
  onclick={() => selectEntry(entry.id)}
  onkeydown={(e) => e.key === "Enter" && selectEntry(entry.id)}
  role="button"
  tabindex="0"
>
  <div class="row head">
    <span class="call-number grow">{entry.id}</span>
    <span class="badge {entry.meta.status}">{entry.meta.status}</span>
  </div>
  <div class="rule" style="background: {cat?.color ?? 'var(--ui-3)'};"></div>

  <strong class="name">{entry.meta.full_name}</strong>
  <p class="muted summary">{summary}</p>

  <div class="row" style="flex-wrap: wrap; gap: 5px;">
    {#each entry.meta.tags.slice(0, 5) as tag}
      <button class="chip" onclick={(ev) => filterTag(tag, ev)}>{tag}</button>
    {/each}
  </div>

  <div class="row meta num">
    <span>★ {entry.meta.stars.toLocaleString()}</span>
    <span>{entry.meta.language ?? "—"}</span>
    <span class="grow"></span>
    <span>{cat?.name ?? entry.meta.category}</span>
  </div>
</div>

<style>
  .entry {
    cursor: pointer;
    transition: border-color var(--t-fast);
  }
  .entry:hover { border-color: var(--ui-3); }
  .head { margin-bottom: 8px; gap: 8px; }
  .call-number {
    font: 10.5px/1.4 var(--mono);
    color: var(--tx-2);
    letter-spacing: 0.02em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rule { height: 2px; border-radius: 1px; margin-bottom: 12px; }
  .name {
    display: block;
    font-family: var(--serif);
    font-size: 16px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .summary {
    margin: 6px 0 10px;
    font-size: 12px;
    line-height: 1.5;
    min-height: 36px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .meta {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--ui);
    font: 11px/1.4 var(--mono);
    color: var(--tx-2);
  }
</style>
