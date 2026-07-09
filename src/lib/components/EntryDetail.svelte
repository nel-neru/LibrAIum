<script>
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { renderMarkdown } from "../markdown.js";
  import { trapFocus } from "../focustrap.js";
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

  // Same pattern as AddRepo's `adding`: a double-click would fire saveEntry
  // twice with the same (now stale) previousId — after the first call moves
  // the file, the second operates on a path that no longer exists.
  let saving = $state(false);

  async function save() {
    if (saving) return;
    saving = true;
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
    } finally {
      saving = false;
    }
  }

  async function refresh() {
    if (app.busy.refreshOne || app.busy.refreshAll) return;
    app.busy.refreshOne = true;
    try {
      entry = await api.refreshEntry(entry.id);
      app.selectedId = entry.id;
      showToast(`Metadata refreshed — ${entry.meta.status}`);
      await reloadEntries();
    } catch (e) {
      fail(e);
    } finally {
      app.busy.refreshOne = false;
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

  let loadingAlts = $state(false);

  async function loadAlternatives() {
    if (loadingAlts) return;
    loadingAlts = true;
    try {
      alternatives = await api.suggestAlternatives(entry.id);
      if (alternatives.length === 0) showToast("No fresher alternatives found with shared tags.");
    } catch (e) {
      fail(e);
    } finally {
      loadingAlts = false;
    }
  }

  let cat = $derived(entry ? categoryOf(entry.meta.category) : null);

  // Reconstruct the GitHub URL from full_name rather than trusting the stored
  // github_url: a git-synced/hand-authored entry is untrusted and its
  // github_url is loaded verbatim with no scheme/host check, so binding it into
  // href / handing it to openUrl() could open an arbitrary URL (phishing) or a
  // local file:// resource. full_name fully determines the URL and pins the
  // host to github.com — the same reconstruction the add path uses.
  let githubUrl = $derived(entry ? `https://github.com/${entry.meta.full_name}` : "");

  // Focus the drawer when it opens so keyboard users aren't stranded behind
  // the scrim (same convention as AddRepo focusing its first field).
  let drawerEl = $state(null);
  $effect(() => {
    if (entry) drawerEl?.focus();
  });

  function onKeydown(e) {
    if (e.key !== "Escape" || !entry) return;
    if (app.showAdd) return; // the AddRepo modal is on top — let it handle Escape
    if (editing) {
      if (!saving) editing = false; // cancel the edit, keep the drawer
    } else {
      close();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if entry}
  <div class="drawer-backdrop" onclick={close} role="presentation"></div>
  <div
    class="drawer"
    bind:this={drawerEl}
    use:trapFocus
    role="dialog"
    aria-modal="true"
    aria-labelledby="drawer-title"
    tabindex="-1"
  >
    <div class="row" style="align-items: flex-start;">
      <div class="grow">
        <div class="call-number">{entry.id}</div>
        <h2 id="drawer-title" class="title">{entry.meta.full_name}</h2>
      </div>
      <button class="small" onclick={close} aria-label="Close">✕</button>
    </div>
    <div class="rule" style="background: {cat?.color ?? 'var(--ui-3)'};"></div>

    <div class="row" style="flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
      <span class="badge {entry.meta.status}">{entry.meta.status}</span>
      <span class="chip cat-chip">
        <span class="dot" style="background: {cat?.color ?? 'var(--ui-3)'};"></span>
        {cat?.name ?? entry.meta.category}
      </span>
      <a href={githubUrl} onclick={(e) => { e.preventDefault(); openUrl(githubUrl); }}>
        Open on GitHub ↗
      </a>
    </div>

    {#if !editing}
      <!-- display-only captions, not form labels — <label> without a control
           is an a11y violation, .field-label shares its styling -->
      <div class="meta-grid card">
        <div><span class="field-label">Stars</span><span class="num">★ {entry.meta.stars.toLocaleString()}</span></div>
        <div><span class="field-label">Language</span>{entry.meta.language ?? "—"}</div>
        <div><span class="field-label">Last push</span><span class="num">{entry.meta.last_github_push ?? "—"}</span></div>
        <div><span class="field-label">Last checked</span><span class="num">{entry.meta.last_checked ?? "never"}</span></div>
        <div><span class="field-label">Added</span><span class="num">{entry.meta.added_date ?? "—"}</span></div>
        <div><span class="field-label">Source</span>{entry.meta.source}</div>
      </div>

      <div class="row" style="flex-wrap: wrap; gap: 6px; margin-bottom: 20px;">
        {#each entry.meta.tags as tag}<span class="chip" style="cursor: default;">{tag}</span>{/each}
      </div>

      <div class="row" style="gap: 8px; margin-bottom: 24px; flex-wrap: wrap;">
        <button class="primary" onclick={startEdit}>Edit</button>
        <button onclick={refresh} disabled={app.busy.refreshOne || app.busy.refreshAll}>
          {app.busy.refreshOne ? "Refreshing…" : "Refresh metadata"}
        </button>
        <button onclick={loadAlternatives} disabled={loadingAlts}>
          {loadingAlts ? "Finding…" : "Suggest alternatives"}
        </button>
        <span class="grow"></span>
        {#if confirmDelete}
          <button class="danger" onclick={remove}>Really delete?</button>
          <button class="small" onclick={() => (confirmDelete = false)}>Cancel</button>
        {:else}
          <button class="danger" onclick={() => (confirmDelete = true)}>Delete</button>
        {/if}
      </div>

      {#if alternatives.length > 0}
        <div class="card alts">
          <h3 class="alts-head">Fresher alternatives</h3>
          {#each alternatives as alt}
            <button class="alt-line" onclick={() => (app.selectedId = alt.id)}>
              <span class="grow">{alt.meta.full_name}</span>
              <span class="muted mono num">★ {alt.meta.stars.toLocaleString()} · {alt.meta.last_github_push ?? "?"}</span>
            </button>
          {/each}
        </div>
      {/if}

      <!-- Bodies are untrusted (GitHub descriptions, git-synced entries);
           renderMarkdown escapes raw HTML and unsafe link schemes. -->
      <article class="md">{@html renderMarkdown(entry.body)}</article>
    {:else}
      <div class="row" style="gap: 10px; margin-bottom: 14px; flex-wrap: wrap;">
        <div>
          <label for="edit-category">Category</label>
          <select id="edit-category" bind:value={editCategory}>
            {#each app.categories as c}<option value={c.id}>{c.name}</option>{/each}
          </select>
        </div>
        <div>
          <label for="edit-status">Status</label>
          <select id="edit-status" bind:value={editStatus}>
            <option value="active">active</option>
            <option value="stale">stale</option>
            <option value="archived">archived</option>
          </select>
        </div>
        <div class="grow">
          <label for="edit-tags">Tags (comma-separated)</label>
          <input id="edit-tags" style="width: 100%;" bind:value={editTags} />
        </div>
      </div>
      <label for="edit-body">Body — summary &amp; Reception (Markdown)</label>
      <textarea id="edit-body" rows="18" style="width: 100%;" bind:value={editBody}></textarea>
      <div class="row" style="gap: 8px; margin-top: 14px;">
        <button class="primary" onclick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        <button onclick={() => (editing = false)} disabled={saving}>Cancel</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .call-number {
    font: 11px/1.4 var(--mono);
    color: var(--tx-2);
    letter-spacing: 0.02em;
    margin-bottom: 2px;
  }
  .title { font-size: 21px; line-height: 28px; word-break: break-all; }
  .rule { height: 2px; border-radius: 1px; margin: 12px 0 16px; }

  .cat-chip { cursor: default; display: inline-flex; align-items: center; gap: 6px; }
  .dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px 12px;
    margin-bottom: 18px;
    padding: 16px 18px;
  }
  .meta-grid .field-label { margin-bottom: 2px; }

  .alts { margin-bottom: 22px; }
  .alts-head { font-size: 15px; margin-bottom: 8px; }
  .alt-line {
    display: flex;
    gap: 8px;
    width: 100%;
    background: transparent;
    border: none;
    padding: 6px 8px;
    border-radius: var(--radius-control);
    text-align: left;
    font-weight: 400;
  }
  .alt-line:hover { background: var(--bg); }
</style>
