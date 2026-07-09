<script>
  import { onMount } from "svelte";
  import { api } from "../api.js";
  import { app, showToast, fail, bootstrap } from "../state.svelte.js";

  let dataDirInput = $state("");
  let staleDaysInput = $state(180);
  let tokenInput = $state("");
  let hasToken = $state(false);
  let git = $state(null);
  let gitLog = $state([]);
  let commitMsg = $state("");
  let exported = $state("");

  onMount(async () => {
    dataDirInput = app.settings.data_dir;
    staleDaysInput = app.settings.stale_days;
    hasToken = await api.hasGithubToken().catch(() => false);
    await loadGit();
  });

  async function loadGit() {
    try {
      git = await api.gitStatus();
      gitLog = git.is_repo ? await api.gitLog(8) : [];
      // Keep the ambient sidebar "uncommitted changes" badge in sync with this
      // panel — so a commit/push here clears the badge everywhere immediately.
      app.git = {
        is_repo: git.is_repo,
        branch: git.branch,
        changes: git.changes.length,
        has_remote: git.has_remote,
        ahead: git.ahead,
      };
    } catch (e) {
      fail(e);
    }
  }

  // In-flight flags for every async action (same pattern as push below):
  // double-clicks must not re-fire backend commands like a second
  // updateSettings+bootstrap cycle or a duplicate commit.
  let applying = $state(false);
  let storingToken = $state(false);
  let committing = $state(false);
  let initializing = $state(false);
  let exporting = $state(false);

  async function saveSettings() {
    if (applying) return;
    applying = true;
    try {
      app.settings = await api.updateSettings({
        data_dir: dataDirInput.trim(),
        stale_days: Number(staleDaysInput) || 180,
      });
      showToast("Settings saved.");
      await bootstrap();
      await loadGit();
    } catch (e) {
      fail(e);
    } finally {
      applying = false;
    }
  }

  async function saveToken() {
    if (storingToken) return;
    storingToken = true;
    try {
      await api.setGithubToken(tokenInput);
      tokenInput = "";
      hasToken = true;
      showToast("GitHub token stored in the OS keychain.");
    } catch (e) {
      fail(e);
    } finally {
      storingToken = false;
    }
  }

  async function clearToken() {
    try {
      await api.clearGithubToken();
      hasToken = false;
      showToast("GitHub token removed from the keychain.");
    } catch (e) {
      fail(e);
    }
  }

  async function commit() {
    if (committing) return;
    committing = true;
    try {
      const hash = await api.gitCommit(commitMsg);
      showToast(`Committed ${hash}`);
      commitMsg = "";
      await loadGit();
    } catch (e) {
      fail(e);
    } finally {
      committing = false;
    }
  }

  async function push() {
    if (app.busy.push) return;
    app.busy.push = true;
    try {
      await api.gitPush();
      showToast("Pushed to remote.");
      await loadGit();
    } catch (e) {
      fail(e);
    } finally {
      app.busy.push = false;
    }
  }

  async function initRepo() {
    if (initializing) return;
    initializing = true;
    try {
      git = await api.gitInitData();
      showToast("Initialized git repository in the data directory.");
      await loadGit();
    } catch (e) {
      fail(e);
    } finally {
      initializing = false;
    }
  }

  async function doExport() {
    if (exporting) return;
    exporting = true;
    try {
      exported = await api.exportAwesome();
    } catch (e) {
      fail(e);
    } finally {
      exporting = false;
    }
  }

  // clipboard.writeText rejects when the window is unfocused or permission is
  // denied — without the catch the user got neither the copy nor any signal.
  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exported);
      showToast("Copied to clipboard.");
    } catch (e) {
      fail(e);
    }
  }

  let mcpCommand = $derived(
    `claude mcp add libraium -e LIBRAIUM_DATA_DIR="${app.dataDir}" -- node <path-to-LibrAIum>/mcp-server/index.js`
  );

  async function copyMcp() {
    try {
      await navigator.clipboard.writeText(mcpCommand);
      showToast("MCP command copied.");
    } catch (e) {
      fail(e);
    }
  }
</script>

<h2 style="font-size: 26px; line-height: 32px; margin-bottom: 24px;">Settings</h2>

<div class="stack">
  <section class="card">
    <h3 class="section-head">Data</h3>
    <label for="settings-data-dir">Data directory</label>
    <input id="settings-data-dir" style="width: 100%;" class="mono" placeholder={app.dataDir} bind:value={dataDirInput} />
    <p class="muted" style="font-size: 12px; margin: 6px 0 0;">
      A local git repository. Leave blank for the default: <span class="mono">./data</span> in dev,
      <span class="mono">~/LibrAIum/data</span> otherwise.
    </p>
    <div class="row" style="margin-top: 10px; gap: 10px;">
      <div>
        <label for="settings-stale-days">Stale after (days)</label>
        <input id="settings-stale-days" type="number" min="7" style="width: 120px;" bind:value={staleDaysInput} />
      </div>
      <div class="grow"></div>
      <button class="primary" onclick={saveSettings} disabled={applying}>
        {applying ? "Applying…" : "Apply"}
      </button>
    </div>
    <p class="muted mono" style="font-size: 11px; margin-bottom: 0;">resolved: {app.dataDir}</p>
  </section>

  <section class="card">
    <h3 class="section-head">GitHub token</h3>
    <p class="muted" style="margin-top: 0;">
      Optional. Raises the API rate limit from 60 to 5,000 requests/hour for metadata refresh.
      Stored in the OS keychain, never in a file.
    </p>
    {#if hasToken}
      <div class="row">
        <span class="badge active">token configured</span>
        <button class="small danger" onclick={clearToken}>Remove</button>
      </div>
    {:else}
      <div class="row">
        <input type="password" class="grow" placeholder="ghp_… or github_pat_…" bind:value={tokenInput} />
        <button onclick={saveToken} disabled={!tokenInput.trim() || storingToken}>
          {storingToken ? "Storing…" : "Store"}
        </button>
      </div>
    {/if}
  </section>

  <section class="card">
    <h3 class="section-head">Git</h3>
    {#if !git}
      <p class="muted">Loading…</p>
    {:else if !git.is_repo}
      <div class="row">
        <p class="muted grow">The data directory is not a git repository yet.</p>
        <button class="primary" onclick={initRepo} disabled={initializing}>
          {initializing ? "Initializing…" : "git init"}
        </button>
      </div>
    {:else}
      <p class="muted" style="margin-top: 0;">
        branch <span class="mono">{git.branch}</span>
        {#if git.has_remote} · remote configured{#if git.ahead > 0} · {git.ahead} ahead{/if}{:else} · no remote{/if}
      </p>
      {#if git.changes.length === 0}
        <p class="muted">Working tree clean — the ledger is up to date.</p>
      {:else}
        <div class="changes mono">
          {#each git.changes as c}
            <div><span class="chg">{c.status}</span> {c.path}</div>
          {/each}
        </div>
        <div class="row" style="margin-top: 10px;">
          <input class="grow" placeholder="commit message" bind:value={commitMsg} />
          <button class="primary" onclick={commit} disabled={!commitMsg.trim() || committing}>
            {committing ? "Committing…" : "Commit all"}
          </button>
        </div>
      {/if}
      {#if git.has_remote}
        <button style="margin-top: 10px;" onclick={push} disabled={app.busy.push}>
          {app.busy.push ? "Pushing…" : "Push to remote"}
        </button>
      {/if}
      {#if gitLog.length > 0}
        <h4 class="muted" style="margin: 14px 0 6px; font-weight: 500;">Recent commits</h4>
        <div class="mono" style="font-size: 12px;">
          {#each gitLog as l}
            <div><span class="muted">{l.hash} {l.date}</span> {l.message}</div>
          {/each}
        </div>
      {/if}
    {/if}
    <div class="row" style="margin-top: 12px;">
      <button class="small" onclick={loadGit}>Refresh status</button>
    </div>
  </section>

  <section class="card">
    <h3 class="section-head">Claude Code (MCP)</h3>
    <p class="muted" style="margin-top: 0;">
      Register LibrAIum as an MCP server, then ask Claude things like
      <em>“suggest the best repos from my library for a RAG agent.”</em>
    </p>
    <div class="row">
      <code class="mono grow" style="overflow-x: auto; white-space: nowrap; padding: 8px 10px; background: var(--bg); border: 1px solid var(--ui); border-radius: 6px;">{mcpCommand}</code>
      <button class="small" onclick={copyMcp}>Copy</button>
    </div>
  </section>

  <section class="card">
    <h3 class="section-head">Export</h3>
    <div class="row" style="margin-bottom: 10px;">
      <p class="muted grow" style="margin: 0;">Render the whole library as an awesome-list Markdown document.</p>
      <button onclick={doExport} disabled={exporting}>
        {exporting ? "Generating…" : "Generate"}
      </button>
      {#if exported}<button class="small" onclick={copyExport}>Copy</button>{/if}
    </div>
    {#if exported}
      <textarea rows="12" style="width: 100%;" readonly value={exported}></textarea>
    {/if}
  </section>
</div>

<style>
  .stack { display: flex; flex-direction: column; gap: 16px; max-width: 860px; }
  .section-head { font-size: 17px; margin-bottom: 12px; }
  .changes { font-size: 12px; max-height: 180px; overflow-y: auto; font-variant-numeric: tabular-nums; }
  .chg { color: var(--st-stale-tx); display: inline-block; width: 24px; }
</style>
