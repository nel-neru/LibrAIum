<script>
  import { onMount } from "svelte";
  import { app, bootstrap } from "./lib/state.svelte.js";
  import Sidebar from "./lib/components/Sidebar.svelte";
  import Dashboard from "./lib/components/Dashboard.svelte";
  import Library from "./lib/components/Library.svelte";
  import Categories from "./lib/components/Categories.svelte";
  import Settings from "./lib/components/Settings.svelte";
  import EntryDetail from "./lib/components/EntryDetail.svelte";
  import AddRepo from "./lib/components/AddRepo.svelte";

  onMount(bootstrap);
</script>

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
  <div class="toast">{app.toast}</div>
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
