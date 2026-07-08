<script>
  import { api } from "../api.js";
  import { app, showToast, fail, reloadEntries } from "../state.svelte.js";

  let url = $state("");
  let category = $state(app.categories[0]?.id ?? "");
  let tags = $state("");
  let notes = $state("");
  let duplicate = $state(null);
  let adding = $state(false);

  function close() {
    app.showAdd = false;
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
      showToast(`Shelved ${entry.meta.full_name} — ⭐ ${entry.meta.stars.toLocaleString()}`);
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

<div class="modal-backdrop" onclick={(e) => e.target === e.currentTarget && close()} role="presentation">
  <div class="modal">
    <div class="row" style="margin-bottom: 16px;">
      <h2 class="grow" style="font-size: 19px;">Add a repository</h2>
      <button class="small" onclick={close}>✕</button>
    </div>

    <label>GitHub URL</label>
    <input
      style="width: 100%; margin-bottom: 4px;"
      placeholder="https://github.com/owner/repo"
      bind:value={url}
      onblur={checkDup}
    />
    {#if duplicate}
      <p style="color: var(--gold); font-size: 12px; margin: 4px 0 0;">
        ⚠ Already in the library as <strong>{duplicate.id}</strong>
      </p>
    {/if}

    <div class="row" style="gap: 10px; margin: 14px 0;">
      <div class="grow">
        <label>Category</label>
        <select style="width: 100%;" bind:value={category}>
          {#each app.categories as c}<option value={c.id}>{c.icon} {c.name}</option>{/each}
        </select>
      </div>
      <div class="grow">
        <label>Tags (comma-separated)</label>
        <input style="width: 100%;" placeholder="vector-db, rag" bind:value={tags} />
      </div>
    </div>

    <label>Personal notes (optional, Markdown)</label>
    <textarea
      rows="4"
      style="width: 100%;"
      placeholder="- why this repo is on my shelf&#10;- gotchas, pairings, ideas"
      bind:value={notes}
    ></textarea>

    <p class="muted" style="font-size: 12px;">
      Stars, language and freshness are fetched automatically from the GitHub API.
    </p>

    <div class="row" style="gap: 8px; margin-top: 8px;">
      <button class="primary" onclick={submit} disabled={adding || !url.trim() || !!duplicate}>
        {adding ? "Fetching from GitHub…" : "Add to library"}
      </button>
      <button onclick={close}>Cancel</button>
    </div>
  </div>
</div>
