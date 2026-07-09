<script>
  import { onMount } from "svelte";
  import { app, bootstrap, dismissToast } from "./lib/state.svelte.js";
  import Sidebar from "./lib/components/Sidebar.svelte";
  import Dashboard from "./lib/components/Dashboard.svelte";
  import Library from "./lib/components/Library.svelte";
  import Categories from "./lib/components/Categories.svelte";
  import Settings from "./lib/components/Settings.svelte";
  import EntryDetail from "./lib/components/EntryDetail.svelte";
  import AddRepo from "./lib/components/AddRepo.svelte";

  onMount(bootstrap);

  // Accelerators for the two highest-frequency actions (daily curation):
  // Cmd/Ctrl+N opens Add repository; "/" jumps focus to the Library search.
  function onGlobalKey(e) {
    const t = e.target;
    const typing =
      t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
      e.preventDefault();
      app.showAdd = true;
    } else if (e.key === "/" && !typing && !app.showAdd && !app.selectedId) {
      e.preventDefault();
      app.view = "library";
      requestAnimationFrame(() => document.getElementById("library-search")?.focus());
    }
  }
</script>

<svelte:window onkeydown={onGlobalKey} />

<!-- macOS overlay titlebar: a quiet drag strip over the top edge -->
<div class="titlebar" data-tauri-drag-region></div>

<div class="layout">
  <Sidebar />
  <main class="main">
    {#if app.loading}
      <p class="muted">Opening the library…</p>
    {:else if app.view === "dashboard"}
      <Dashboard />
    {:else if app.view === "library"}
      <Library />
    {:else if app.view === "categories"}
      <Categories />
    {:else if app.view === "settings"}
      <Settings />
    {/if}
  </main>
</div>

{#if app.selectedId}
  <EntryDetail />
{/if}

{#if app.showAdd}
  <AddRepo />
{/if}

{#if app.toast}
  <div
    class="toast"
    class:error={app.toastKind === "error"}
    role={app.toastKind === "error" ? "alert" : "status"}
    aria-live={app.toastKind === "error" ? "assertive" : "polite"}
    title="Dismiss"
    onclick={dismissToast}
  >{app.toast}</div>
{/if}

<style>
  .titlebar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 40px;
    z-index: 30;
  }
</style>
