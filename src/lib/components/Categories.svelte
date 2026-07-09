<script>
  import { api } from "../api.js";
  import { app, showToast, fail } from "../state.svelte.js";

  // Local editable copy. The id lock must be per ROW PERSISTENCE, not by
  // value: matching row.id against the persisted-id set disabled a NEW row's
  // input the instant its typed value collided with any existing id, trapping
  // the row uneditable. `locked` rides on the row and is promoted on save.
  let rows = $state(
    structuredClone($state.snapshot(app.categories)).map((r) => ({ ...r, locked: true }))
  );
  let dirty = $state(false);

  // Category colors must come from Flexoki accent scales (DESIGN.md §2/§11) so
  // data-driven color never reintroduces neon. A constrained swatch replaces
  // the native OS picker (which exposed the full sRGB gamut and ignored the
  // token system). These are the confirmed Flexoki accent values, hue-ordered.
  const PALETTE = [
    "#AF3029", "#DA702C", "#BC5215", "#AD8301",
    "#879A39", "#768D21", "#66800B", "#536907",
    "#3AA99F", "#24837B", "#1C6C66", "#4385BE",
    "#205EA6", "#8B7EC8", "#735EB5", "#5E409D",
    "#CE5D97", "#A02F6F",
  ];
  function setColor(row, c) {
    row.color = c;
    touch();
  }

  let counts = $derived.by(() => {
    const m = {};
    for (const e of app.entries) m[e.meta.category] = (m[e.meta.category] ?? 0) + 1;
    return m;
  });

  function touch() {
    dirty = true;
  }

  function addRow() {
    rows.push({
      id: "",
      name: "",
      color: "#24837B",
      icon: "📁",
      description: "",
      order: (rows.at(-1)?.order ?? 0) + 1,
      locked: false,
    });
    touch();
  }

  function removeRow(i) {
    const row = rows[i];
    if (counts[row.id]) {
      fail(`"${row.id}" still holds ${counts[row.id]} entries — move them first`);
      return;
    }
    rows.splice(i, 1);
    touch();
  }

  function move(i, delta) {
    const j = i + delta;
    if (j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    rows.forEach((r, idx) => (r.order = idx + 1));
    touch();
  }

  async function save() {
    for (const r of rows) {
      if (!r.id.trim() || !r.name.trim()) {
        fail("every category needs an id and a name");
        return;
      }
      if (!/^[a-z0-9-]+$/.test(r.id)) {
        fail(`category id "${r.id}" must be kebab-case (a-z, 0-9, -)`);
        return;
      }
    }
    try {
      // `locked` is UI state, not part of the Category payload.
      const payload = $state.snapshot(rows).map(({ locked, ...r }) => r);
      app.categories = await api.saveCategories(payload);
      // Every row is persisted now — its id names a real entry directory.
      rows.forEach((r) => (r.locked = true));
      dirty = false;
      showToast("Category master saved.");
    } catch (e) {
      fail(e);
    }
  }
</script>

<header class="row" style="margin-bottom: 24px;">
  <div class="grow">
    <h2 style="font-size: 26px; line-height: 32px;">Categories</h2>
    <span class="muted mono" style="font-size: 11px;">data/master/categories.yaml — ids become entry directories</span>
  </div>
  <button onclick={addRow}>+ Add category</button>
  <button class="primary" onclick={save} disabled={!dirty}>Save changes</button>
</header>

<div class="table-scroll">
<table class="grid">
  <thead>
    <tr>
      <th style="width: 60px;">Order</th>
      <th>Icon</th>
      <th>Id</th>
      <th>Name</th>
      <th>Color</th>
      <th>Description</th>
      <th style="width: 70px;">Entries</th>
      <th style="width: 90px;"></th>
    </tr>
  </thead>
  <tbody>
    {#each rows as row, i}
      <tr>
        <td>
          <button class="small" onclick={() => move(i, -1)} disabled={i === 0}>↑</button>
          <button class="small" onclick={() => move(i, 1)} disabled={i === rows.length - 1}>↓</button>
        </td>
        <td><input style="width: 52px;" bind:value={row.icon} oninput={touch} /></td>
        <td>
          <input
            style="width: 150px;"
            class="mono"
            bind:value={row.id}
            oninput={touch}
            disabled={row.locked}
            title={row.locked ? "id locked — entries live in this directory" : ""}
          />
        </td>
        <td><input style="width: 150px;" bind:value={row.name} oninput={touch} /></td>
        <td>
          <div class="swatches" role="group" aria-label="Category color">
            {#each PALETTE as c}
              <button
                type="button"
                class="swatch"
                class:sel={(row.color ?? "").toLowerCase() === c.toLowerCase()}
                style="background: {c};"
                title={c}
                aria-label={c}
                aria-pressed={(row.color ?? "").toLowerCase() === c.toLowerCase()}
                onclick={() => setColor(row, c)}
              ></button>
            {/each}
          </div>
        </td>
        <td><input style="width: 100%;" bind:value={row.description} oninput={touch} /></td>
        <td class="muted">{counts[row.id] ?? 0}</td>
        <td><button class="small danger" onclick={() => removeRow(i)}>remove</button></td>
      </tr>
    {/each}
  </tbody>
</table>
</div>

<style>
  /* Wide content scrolls inside its own bounds, never the whole page (the
     fixed-width columns exceed the ~620px content pane at the 960px min width). */
  .table-scroll {
    overflow-x: auto;
  }
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    width: 132px;
  }
  .swatch {
    width: 16px;
    height: 16px;
    padding: 0;
    border: 1px solid var(--ui-2);
    border-radius: var(--radius-chip);
    cursor: pointer;
  }
  .swatch.sel {
    box-shadow: 0 0 0 2px var(--paper), 0 0 0 3px var(--tx);
  }
</style>
