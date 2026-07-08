<script>
  import { marked } from "marked";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { api } from "../api.js";
  import { app, showToast, fail, reloadEntries, categoryOf } from "../state.svelte.js";

  let entry = $state(null);
  let editing = $state(false);
  let alternatives = $state([]);
  let confirmDelete = $state(false);

  // edit buffer
  let editCategory = $state("");
  let editTags = $state("");
  let editStatus = $state("active");
  let editBody = $state("");

  // Guards against overlapping loads: rapid selection changes (alternatives
  // links, dashboard rows) fire concurrent getEntry calls, and without this
  // the LAST response to arrive would win — the drawer could show entry A
  // while selectedId is B, sending a later Edit/Delete to the wrong repo.
  let loadSeq = 0;

  $effect(() => {
    if (app.selectedId) load(app.selectedId);
  });

  async function load(id) {
    const seq = ++loadSeq;
    try {
      const fetched = await api.getEntry(id);
      if (seq !== loadSeq || app.selectedId !== id) return; // stale response
      entry = fetched;
      editing = false;
      confirmDelete = false;
      alternatives = [];
    } catch (e) {
      if (seq !== loadSeq || app.selectedId !== id) return; // stale failure
      fail(e);
      close();
    }
  }

  function close() {
    app.selectedId = null;
  }

  function startEdit() {
    editCategory = entry.meta.category;
    editTags = entry.meta.tags.join(", ");
    editStatus = entry.meta.status;
    editBody = entry.body;
    editing = true;
  }

  async function save() {
    const meta = {
      ...entry.meta,
      category: editCategory,
      tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
      status: editStatus,
    };
    try {
      const saved = await api.saveEntry(meta, editBody, entry.id);
      showToast("Saved.");
      app.selectedId = saved.id;
      entry = saved;
      editing = false;
      await reloadEntries();
    } catch (e) {
      fail(e);
    }
  }

  async function refresh() {
    app.busy = "refresh-one";
    try {
      entry = await api.refreshEntry(entry.id);
      app.selectedId = entry.id;
      showToast(`Metadata refreshed — ${entry.meta.status}`);
      await reloadEntries();
    } catch (e) {
      fail(e);
    } finally {
      app.busy = "";
    }
  }

  async function remove() {
    try {
      await api.deleteEntry(entry.id);
      showToast(`Removed ${entry.meta.full_name} from the library.`);
      close();
      await reloadEntries();
    } catch (e) {
      fail(e);
    }
  }

  async function loadAlternatives() {
    try {
      alternatives = await api.suggestAlternatives(entry.id);
      if (alternatives.length === 0) showToast("No fresher alternatives found with shared tags.");
    } catch (e) {
      fail(e);
    }
  }

  let cat = $derived(entry ? categoryOf(entry.meta.category) : null);
</script>

{#if entry}
  <div class="drawer-backdrop" onclick={close} role="presentation"></div>
  <aside class="drawer">
    <div class="row" style="margin-bottom: 4px;">
      <h2 class="grow" style="font-size: 20px; word-break: break-all;">{entry.meta.full_name}</h2>
      <button class="small" onclick={close}>✕</button>
    </div>

    <div class="row" style="flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
      <span class="badge {entry.meta.status}">{entry.meta.status}</span>
      <span class="chip" style="cursor: default;">{cat?.icon} {cat?.name ?? entry.meta.category}</span>
      <a href={entry.meta.github_url} onclick={(e) => { e.preventDefault(); openUrl(entry.meta.github_url); }}>
        open on GitHub ↗
      </a>
    </div>

    {#if !editing}
      <div class="meta-grid card" style="margin-bottom: 16px;">
        <div><label>Stars</label>⭐ {entry.meta.stars.toLocaleString()}</div>
        <div><label>Language</label>{entry.meta.language ?? "—"}</div>
        <div><label>Last push</label>{entry.meta.last_github_push ?? "—"}</div>
        <div><label>Last checked</label>{entry.meta.last_checked ?? "never"}</div>
        <div><label>Added</label>{entry.meta.added_date ?? "—"}</div>
        <div><label>Source</label>{entry.meta.source}</div>
      </div>

      <div class="row" style="flex-wrap: wrap; gap: 6px; margin-bottom: 18px;">
        {#each entry.meta.tags as tag}<span class="chip" style="cursor: default;">{tag}</span>{/each}
      </div>

      <div class="row" style="gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
        <button class="primary" onclick={startEdit}>✎ Edit</button>
        <button onclick={refresh} disabled={app.busy === "refresh-one"}>
          {app.busy === "refresh-one" ? "Refreshing…" : "⟳ Refresh metadata"}
        </button>
        <button onclick={loadAlternatives}>✨ Suggest alternatives</button>
        {#if confirmDelete}
          <button class="danger" onclick={remove}>Really delete?</button>
          <button class="small" onclick={() => (confirmDelete = false)}>Cancel</button>
        {:else}
          <button class="danger" onclick={() => (confirmDelete = true)}>🗑 Delete</button>
        {/if}
      </div>

      {#if alternatives.length > 0}
        <div class="card" style="margin-bottom: 18px; border-color: var(--gold);">
          <h3 style="font-size: 14px; margin-bottom: 10px;">✨ Fresher alternatives</h3>
          {#each alternatives as alt}
            <button class="alt-line" onclick={() => (app.selectedId = alt.id)}>
              <span class="grow">{alt.meta.full_name}</span>
              <span class="muted mono">⭐ {alt.meta.stars.toLocaleString()} · {alt.meta.last_github_push ?? "?"}</span>
            </button>
          {/each}
        </div>
      {/if}

      <article class="md">{@html marked.parse(entry.body)}</article>
    {:else}
      <div class="row" style="gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
        <div>
          <label>Category</label>
          <select bind:value={editCategory}>
            {#each app.categories as c}<option value={c.id}>{c.icon} {c.name}</option>{/each}
          </select>
        </div>
        <div>
          <label>Status</label>
          <select bind:value={editStatus}>
            <option value="active">active</option>
            <option value="stale">stale</option>
            <option value="archived">archived</option>
          </select>
        </div>
        <div class="grow">
          <label>Tags (comma-separated)</label>
          <input style="width: 100%;" bind:value={editTags} />
        </div>
      </div>
      <label>Body — summary &amp; Personal Notes (Markdown)</label>
      <textarea rows="18" style="width: 100%;" bind:value={editBody}></textarea>
      <div class="row" style="gap: 8px; margin-top: 12px;">
        <button class="primary" onclick={save}>Save</button>
        <button onclick={() => (editing = false)}>Cancel</button>
      </div>
    {/if}
  </aside>
{/if}

<style>
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    font-size: 13px;
  }
  .alt-line {
    display: flex;
    gap: 8px;
    width: 100%;
    background: transparent;
    border: none;
    padding: 6px 4px;
    border-radius: 6px;
    text-align: left;
  }
  .alt-line:hover { background: var(--bg-panel); }
</style>
