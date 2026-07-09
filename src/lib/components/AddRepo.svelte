<script>
  import { api } from "../api.js";
  import { app, showToast, fail, reloadEntries } from "../state.svelte.js";

  let url = $state("");
  let category = $state(app.categories[0]?.id ?? "");
  let tags = $state("");
  let notes = $state("");
  let duplicate = $state(null);
  let adding = $state(false);
  let urlInput = $state(null);

  // Focus the first field when the modal opens (it is mounted on demand).
  $effect(() => {
    urlInput?.focus();
  });

  function close() {
    app.showAdd = false;
  }

  function onKeydown(e) {
    if (e.key === "Escape" && !adding) close();
  }

  async function checkDup() {
    duplicate = null;
    if (!url.includes("github.com")) return;
    try {
      duplicate = await api.checkDuplicate(url);
    } catch {
      // URL not parseable yet — let submit surface the real error
    }
  }

  async function submit() {
    if (adding) return;
    adding = true;
    try {
      const entry = await api.addRepoFromUrl(
        url.trim(),
        category,
        tags.split(",").map((t) => t.trim()).filter(Boolean),
        notes.trim() ? notes : null
      );
      showToast(`Shelved ${entry.meta.full_name} — ★ ${entry.meta.stars.toLocaleString()}`);
      close();
      await reloadEntries();
      app.selectedId = entry.id;
    } catch (e) {
      fail(e);
    } finally {
      adding = false;
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="modal-backdrop" onclick={(e) => e.target === e.currentTarget && close()} role="presentation">
  <form class="modal" onsubmit={(e) => { e.preventDefault(); submit(); }}>
    <div class="row" style="margin-bottom: 18px;">
      <h2 class="grow" style="font-size: 19px;">Add a repository</h2>
      <button type="button" class="small" onclick={close} aria-label="Close">✕</button>
    </div>

    <label for="add-url">GitHub URL</label>
    <input
      id="add-url"
      style="width: 100%; margin-bottom: 4px;"
      placeholder="https://github.com/owner/repo"
      bind:this={urlInput}
      bind:value={url}
      onblur={checkDup}
    />
    {#if duplicate}
      <p style="color: var(--st-stale-tx); font-size: 12px; margin: 4px 0 0;">
        Already in the library as <strong class="mono">{duplicate.id}</strong>
      </p>
    {/if}

    <div class="row" style="gap: 10px; margin: 14px 0;">
      <div class="grow">
        <label for="add-category">Category</label>
        <select id="add-category" style="width: 100%;" bind:value={category}>
          {#each app.categories as c}<option value={c.id}>{c.icon} {c.name}</option>{/each}
        </select>
      </div>
      <div class="grow">
        <label for="add-tags">Tags (comma-separated)</label>
        <input id="add-tags" style="width: 100%;" placeholder="vector-db, rag" bind:value={tags} />
      </div>
    </div>

    <label for="add-notes">Reception (optional, Markdown)</label>
    <textarea
      id="add-notes"
      rows="4"
      style="width: 100%;"
      placeholder="- what the community reports (issues, adopters, limits)&#10;- migration signal, maturity"
      bind:value={notes}
    ></textarea>

    <p class="muted" style="font-size: 12px;">
      Stars, language and freshness are fetched automatically from the GitHub API.
    </p>

    <div class="row" style="gap: 8px; margin-top: 8px;">
      <button type="submit" class="primary" disabled={adding || !url.trim() || !!duplicate}>
        {adding ? "Fetching from GitHub…" : "Add to library"}
      </button>
      <button type="button" onclick={close}>Cancel</button>
    </div>
  </form>
</div>
