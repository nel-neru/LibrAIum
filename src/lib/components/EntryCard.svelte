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

  function filterTag(tag) {
    app.filters.tag = tag;
    runSearch();
  }
</script>

<!-- A card-catalog index card. The whole card opens the entry via the title
     button's ::after overlay (a single real <button>, no interactive nesting);
     the tag chips ride above that overlay (z-index) as their own buttons. -->
<div class="card entry">
  <div class="row head">
    <span class="call-number grow">{entry.id}</span>
    <span class="badge {entry.meta.status}">{entry.meta.status}</span>
  </div>
  <div class="rule" style="background: {cat?.color ?? 'var(--ui-3)'};"></div>

  <button class="open" onclick={() => selectEntry(entry.id)} aria-label="Open {entry.meta.full_name}">
    <span class="name">{entry.meta.full_name}</span>
  </button>
  <p class="muted summary">{summary}</p>

  <div class="row tags" style="flex-wrap: wrap; gap: 5px;">
    {#each entry.meta.tags.slice(0, 5) as tag}
      <button class="chip" onclick={() => filterTag(tag)}>{tag}</button>
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
    position: relative;
    transition: border-color var(--t-fast);
  }
  /* hover/focus affordance lives on the card even though the button is the
     focusable target (the ::after overlay makes the whole card the hit area) */
  .entry:hover { border-color: var(--ui-3); }
  .entry:focus-within { border-color: var(--ui-3); }
  .head { margin-bottom: 8px; gap: 8px; }

  /* the card's primary action: a real button whose ::after covers the whole
     card, so a click anywhere (except the raised tag chips) opens the entry */
  .open {
    display: block;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .open::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: var(--radius-card);
  }
  /* chips sit above the overlay so they stay independently clickable/focusable */
  .tags { position: relative; z-index: 1; }
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
