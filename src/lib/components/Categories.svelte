<script>
  import { api } from "../api.js";
  import { app, showToast, fail } from "../state.svelte.js";

  // local editable copy; ids of persisted rows are locked to keep entry dirs stable
  let rows = $state(structuredClone($state.snapshot(app.categories)));
  let existingIds = new Set(app.categories.map((c) => c.id));
  let dirty = $state(false);

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
      color: "#8b8cf0",
      icon: "📁",
      description: "",
      order: (rows.at(-1)?.order ?? 0) + 1,
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
      app.categories = await api.saveCategories($state.snapshot(rows));
      existingIds = new Set(app.categories.map((c) => c.id));
      dirty = false;
      showToast("Category master saved.");
    } catch (e) {
      fail(e);
    }
  }
</script>

<header class="row" style="margin-bottom: 18px;">
  <div class="grow">
    <h2 style="font-size: 24px;">Category master</h2>
    <span class="muted">data/master/categories.yaml — ids become entry directories</span>
  </div>
  <button onclick={addRow}>＋ Add category</button>
  <button class="primary" onclick={save} disabled={!dirty}>Save changes</button>
</header>

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
            disabled={existingIds.has(row.id) && row.id !== ""}
            title={existingIds.has(row.id) ? "id locked — entries live in this directory" : ""}
          />
        </td>
        <td><input style="width: 150px;" bind:value={row.name} oninput={touch} /></td>
        <td><input type="color" style="width: 46px; padding: 2px;" bind:value={row.color} oninput={touch} /></td>
        <td><input style="width: 100%;" bind:value={row.description} oninput={touch} /></td>
        <td class="muted">{counts[row.id] ?? 0}</td>
        <td><button class="small danger" onclick={() => removeRow(i)}>remove</button></td>
      </tr>
    {/each}
  </tbody>
</table>
