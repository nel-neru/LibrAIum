<script>
  // Line icons per DESIGN.md §9 — 16px, 1.5px stroke, round caps, currentColor.
  // Two groups: chrome nav glyphs, and the per-category marks that replace the
  // old emoji category icons (rendered tinted with the category color). An
  // unknown name falls back to the neutral "folder" glyph so a custom category
  // always has a mark.
  let { name, size = 16 } = $props();

  const PATHS = {
    // — chrome nav —
    // reading room — a classical facade
    "reading-room":
      "M3 21h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 3 3 8h18L12 3Z",
    // library — leaning book spines
    library: "M4 4v16M8 6v14M12 5v15m4-13 4 13",
    // catalog — a card drawer
    catalog:
      "M3 4h18v4H3zM5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 13h4",
    // settings — sliders
    settings:
      "M21 5h-7M10 5H3m18 7h-9M8 12H3m18 7h-5m-4 0H3M14 3v4M8 10v4m8 3v4",

    // — category marks —
    cpu: "M5 5h14v14H5zM9 9h6v6H9zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3",
    globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18",
    phone: "M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zM10 18h4",
    monitor: "M3 5h18v11H3zM8 20h8M12 16v4",
    gamepad: "M8 8h8a4 4 0 010 8h-1l-2-2h-2l-2 2H8a4 4 0 010-8zM8.5 11v3M7 12.5h3M15.5 12h.01M17 13.5h.01",
    server: "M4 5h16v5H4zM4 14h16v5H4zM7 7.5h.01M7 16.5h.01",
    chart: "M4 4v16h16M8 20v-4M12 20v-9M16 20v-6",
    shield: "M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z",
    blocks: "M3 7h7v7H3zM14 10h7v7h-7zM10 10.5h4",
    mic: "M12 3a3 3 0 013 3v4a3 3 0 01-6 0V6a3 3 0 013-3zM7 10a5 5 0 0010 0M12 15v4M9 21h6",
    film: "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM10 9l5 3-5 3z",
    nib: "M12 3l4 8-4 10-4-10zM8 11h8M12 13v6",
    pencil: "M4 20l1-4L16 5l3 3L8 19l-4 1zM14 7l3 3",
    tag: "M4 4h7l9 9-7 7-9-9V4zM7.5 7.5h.01",
    bolt: "M13 3 5 13h6l-2 8 8-10h-6z",
    cap: "M12 4l10 4-10 4-10-4zM6 10v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 8v5",
    "trending-up": "M3 17l6-6 4 4 8-8M16 7h5M21 7v5",
    package: "M12 3l8 4v8l-8 4-8-4V7zM4 7l8 4M20 7l-8 4M12 11v10",
    // fallback for any unmapped (e.g. user-created) category
    folder: "M3 6h6l2 2h10v11H3z",

    // — controls —
    // grip — a 6-dot drag handle (dots via zero-length round-capped segments)
    grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d={PATHS[name] ?? PATHS.folder} />
</svg>
