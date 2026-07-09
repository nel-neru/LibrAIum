<script>
  import { api } from "../api.js";
  import { app, showToast, fail } from "../state.svelte.js";
  import Icon from "./Icon.svelte";

  // Local editable copy. The id lock must be per ROW PERSISTENCE, not by
  // value: matching row.id against the persisted-id set disabled a NEW row's
  // input the instant its typed value collided with any existing id, trapping
  // the row uneditable. `locked` rides on the row and is promoted on save.
  let rows = $state(
    structuredClone($state.snapshot(app.categories)).map((r) => ({ ...r, locked: true }))
  );
  let dirty = $state(false);

  // The category marks a picker can assign (line icons in Icon.svelte). The old
  // free-text emoji field is gone — DESIGN.md §9/§11: line icons only, no emoji
  // in chrome. `folder` is the neutral fallback for a category with no mark.
  const ICONS = [
    "cpu", "globe", "phone", "monitor", "gamepad", "server",
    "chart", "shield", "blocks", "mic", "film", "nib",
    "pencil", "tag", "bolt", "cap", "trending-up", "package", "folder",
  ];

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
  function setIcon(row, ic) {
    row.icon = ic;
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

  function renumber() {
    rows.forEach((r, idx) => (r.order = idx + 1));
  }

  function addRow() {
    rows.push({
      id: "",
      name: "",
      color: "#24837B",
      icon: "folder",
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
    renumber();
    touch();
  }

  // Keyboard reordering (accessible counterpart to drag-and-drop): the grip
  // handle takes ArrowUp/ArrowDown so the table is operable without a pointer.
  function move(i, delta) {
    const j = i + delta;
    if (j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    renumber();
    touch();
  }

  // Drag-and-drop reordering. dragFrom/dragOver drive the row highlight; on drop
  // the dragged row is spliced into the target slot and every order renumbered.
  let dragFrom = $state(null);
  let dragOver = $state(null);

  function onDragStart(i, e) {
    dragFrom = i;
    e.dataTransfer.effectAllowed = "move";
    // Firefox requires data to be set for a drag to start.
    e.dataTransfer.setData("text/plain", String(i));
  }
  function onDragOver(i, e) {
    if (dragFrom === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOver = i;
  }
  function onDrop(i) {
    if (dragFrom !== null && dragFrom !== i) {
      const [moved] = rows.splice(dragFrom, 1);
      rows.splice(i, 0, moved);
      renumber();
      touch();
    }
    dragFrom = null;
    dragOver = null;
  }
  function onDragEnd() {
    dragFrom = null;
    dragOver = null;
  }
  function onGripKey(i, e) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      move(i, -1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      move(i, 1);
    }
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
    <span class="muted mono" style="font-size: 11px;">data/master/categories.yaml — ids become entry directories · drag ⠿ to reorder</span>
  </div>
  <button onclick={addRow}>+ Add category</button>
  <button class="primary" onclick={save} disabled={!dirty}>Save changes</button>
</header>

<div class="table-scroll">
<table class="grid">
  <thead>
    <tr>
      <th style="width: 34px;"><span class="sr-only">Reorder</span></th>
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
    {#each rows as row, i (row)}
      <tr
        class:drag-over={dragOver === i && dragFrom !== i}
        class:dragging={dragFrom === i}
        ondragover={(e) => onDragOver(i, e)}
        ondrop={() => onDrop(i)}
        ondragend={onDragEnd}
      >
        <td>
          <button
            class="grip"
            draggable="true"
            title="Drag to reorder — or focus and use ↑ / ↓"
            aria-label={`Reorder ${row.name || row.id || "category"} (position ${i + 1} of ${rows.length})`}
            ondragstart={(e) => onDragStart(i, e)}
            onkeydown={(e) => onGripKey(i, e)}
          >
            <Icon name="grip" />
          </button>
        </td>
        <td>
          <div class="swatches icons" role="group" aria-label="Category icon">
            {#each ICONS as ic}
              <button
                type="button"
                class="swatch iconsw"
                class:sel={row.icon === ic}
                title={ic}
                aria-label={ic}
                aria-pressed={row.icon === ic}
                style={row.icon === ic ? `color: ${row.color}` : ""}
                onclick={() => setIcon(row, ic)}
              >
                <Icon name={ic} size={15} />
              </button>
            {/each}
          </div>
        </td>
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
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    width: 132px;
  }
  .swatches.icons {
    width: 180px;
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
  /* Icon picker: square cells that host a 15px mark instead of a color fill. */
  .iconsw {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--paper);
    color: var(--tx-2);
    border-radius: var(--radius-control);
  }
  @media (hover: hover) {
    .iconsw:hover { border-color: var(--ui-3); color: var(--tx); }
  }
  .iconsw.sel {
    border-color: var(--ui-3);
    /* color set inline to the category color; ring marks the selection */
    box-shadow: 0 0 0 2px var(--paper), 0 0 0 3px var(--tx);
  }

  /* Drag handle — grip dots, grab cursor, focusable for keyboard reordering. */
  .grip {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: transparent;
    border: none;
    color: var(--tx-3);
    cursor: grab;
  }
  .grip:active { cursor: grabbing; }
  @media (hover: hover) {
    .grip:hover { color: var(--tx-2); }
  }

  tr.dragging { opacity: 0.4; }
  tr.drag-over td { box-shadow: inset 0 2px 0 var(--accent); }
</style>
