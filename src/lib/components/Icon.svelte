<script>
  // Line icons per DESIGN.md §9 — 16px, 1.5px stroke, round caps, currentColor.
  // Chrome iconography only; category emoji remain user data.
  let { name, size = 16 } = $props();

  const PATHS = {
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
  <path d={PATHS[name]} />
</svg>
