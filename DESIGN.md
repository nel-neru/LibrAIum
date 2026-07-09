# DESIGN.md — LibrAIum visual system

The design contract for every pixel of LibrAIum's UI. When implementing or
changing any frontend surface, follow this file exactly; when a rule here
conflicts with a habit or a framework default, this file wins. Tokens live in
`src/styles.css` and must stay in sync with the values below.

## 1. Brand & personality

LibrAIum is a **private library**: paper, ink, a green-shaded reading lamp,
quiet shelves. It is a place the owner returns to daily for years — so the
design is *timeless scholar*, not *tech product*.

- Mood words: quiet, precise, bookish, warm, owned.
- The metaphor that drives structure: a **card catalog**. Every repository is
  an index card with a call number (its entry id), a due-date-style status
  stamp, and a category rule line.
- Everything is calm except one signature: the catalog-card typography
  (mono call numbers + stamps). Spend boldness nowhere else.

## 2. Color

The palette is [Flexoki](https://stephango.com/flexoki) — an ink-on-paper
scheme built in Oklab from real pigment behavior. Light mode ("Reading Room")
is the default; dark mode ("Closed Stacks") follows `prefers-color-scheme`.

### Roles (light / dark)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F2F0E5` base-50 | `#100F0F` black | app canvas + sidebar |
| `--paper` | `#FFFCF0` paper | `#1C1B1A` base-950 | raised surfaces: cards, drawer, modal, inputs |
| `--ui` | `#E6E4D9` | `#282726` | hairline borders (rest) |
| `--ui-2` | `#DAD8CE` | `#343331` | borders (hover) |
| `--ui-3` | `#CECDC3` | `#403E3C` | borders (active) |
| `--tx` | `#100F0F` | `#CECDC3` | primary text (never pure white in dark) |
| `--tx-2` | `#6F6E69` | `#878580` | secondary text (AA-safe) |
| `--tx-3` | `#B7B5AC` | `#575653` | **decorative only** — fails AA, never for information |
| `--accent` | `#24837B` cyan-600 | `#3AA99F` cyan-400 | THE one chromatic accent (reading-lamp green) |
| `--accent-hover` | `#1C6C66` | `#5ABDAC` | links/hover states of accent |
| `--ink` | `#100F0F` | `#CECDC3` | primary button fill |
| `--ink-contrast` | `#FFFCF0` | `#100F0F` | text on `--ink` |

### Semantic status (always wash + text, never filled saturated chips)

| Status | Light | Dark |
|---|---|---|
| active | bg `#EDEECF` green-50, text `#3D4C07` green-800 | bg `#252D09` green-900, text `#879A39` green-400 |
| stale | bg `#FAEEC6` yellow-50, text `#664D01` yellow-800 | bg `#3A2D04` yellow-900, text `#D0A215` yellow-400 |
| archived | bg `#E6E4D9` base-100, text `#575653` base-700 | bg `#282726` base-900, text `#878580` base-500 |
| danger | text `#AF3029` red-600 | text `#D14D41` red-400 |

Rationale: yellow-600 on paper is 3.39:1 (fails AA) — stale must use the
wash-plus-dark-text form. Archived is deliberately *neutral* (retired, inert),
so status hues never rely on warm-hue adjacency (Flexoki's red/orange/magenta
are nearly indistinguishable side by side).

### Category colors

Category colors come from `data/master/categories.yaml` and must be drawn from
Flexoki accent scales (400–700 variants) so data-driven color never reintroduces
neon. Default for a new category: `#24837B`; unknown-category fallback: `#878580`.

### Hard rules

- Exactly **one** chromatic accent in the chrome (the teal lamp). Status washes
  and category dots are data/semantics, not decoration.
- No gradients, no glow, no neon, no purple/cyan-blue duos, no pure `#FFF`/`#000`,
  no cold grays (every neutral carries Flexoki's warm cast).
- Accents: light mode uses 600-level, dark mode 400-level. Never reuse across modes.

## 3. Typography

All faces ship with macOS; nothing is fetched at runtime (local-first).

```css
--serif: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
--sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Seravek, Roboto, sans-serif;
--mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
```

- **Serif (Iowan Old Style)** — display + reading. Page titles, card titles,
  stat numbers, and the entry-body reading pane. Display weight is 400–500,
  never bold-heavy ("quiet luxury sets display light").
- **Sans (system)** — all interactive chrome: buttons, inputs, nav, meta.
- **Mono** — call numbers, stamps, dates, git output, code.

### Scale (px / line-height)

| Role | Spec |
|---|---|
| label / eyebrow | 11/16 sans **or** 10/16 mono, uppercase, `letter-spacing: 0.08em`, weight 500 |
| meta | 12/16 sans |
| UI base | 13/18 sans (dense rows 13/16) |
| reading body | 15.5/24 serif (`.md`), measure `max-width: 66ch` |
| section heading | 17/24 serif |
| card / entry title | 15–21 serif by context |
| page title | 26/32 serif, weight 500 |

- Numbers in columns (stars, dates): sans/mono with `font-variant-numeric: tabular-nums`.
- Never letterspace lowercase; never set text below 10px; never use
  `font-variant-caps: small-caps` (system faces synthesize spindly fakes).

## 4. Spacing & layout

4/8-pt scale: **4, 8, 12, 16, 24, 32, 48**. Generosity lives in the big steps —
main view padding 40×44, card padding 18×20, grid gap 16. Sidebar 250px with
28px rows; pad list items themselves (no margins between clickable rows — no
dead zones).

## 5. Elevation & depth

**Resting elements never cast shadows.** Separation at rest = 1px hairline
(`--ui`) + one surface step (`--bg` → `--paper`). This ladder discipline is
what reads as calm.

Shadows exist only for true overlays (drawer, modal, toast), layered and
warm-tinted (pure-black shadows turn paper gray):

```css
--shadow-overlay: 0 1px 2px hsl(28deg 18% 20% / 0.05), 0 2px 4px hsl(28deg 18% 20% / 0.05),
  0 4px 8px hsl(28deg 18% 20% / 0.05), 0 8px 16px hsl(28deg 18% 20% / 0.05),
  0 16px 32px hsl(28deg 18% 20% / 0.06);
```

(Dark mode may deepen alphas; keep the layered geometric progression and the
vertical-offset-only light source.)

**Paper grain**: one `body::before` laminate over the whole window — a
rasterized `feTurbulence` data-URI at `--grain-opacity` (0.04 light / 0.05
dark). It must stay felt-not-seen: never above 6%, never animated, never a
live SVG filter.

**Window chrome (macOS)**: the titlebar is a transparent overlay
(`titleBarStyle: "Overlay"`, `hiddenTitle`, warm `backgroundColor` in
`src-tauri/tauri.conf.json` to kill the first-paint flash). App.svelte renders
a fixed `data-tauri-drag-region` strip; the sidebar's 48px top padding clears
the traffic lights. No system-gray bar ever sits above the paper.

## 6. Shape

| Radius | Use |
|---|---|
| 3px | status stamps |
| 4px | chips, small tags |
| 6px | buttons, inputs, selects, list-row hover |
| 10px | cards |
| 14px | modal / drawer corners (where visible) |

Nested corners: inner = outer − padding. Never the same radius twice in a
nest. No pill (`999px`) shapes except nothing — the catalog aesthetic is
squared paper, softly rounded.

## 7. Motion

- Transitions ≤ 200ms. Standard: `140ms ease-out` for background/border/color.
- Hover = one surface/border step. **Never** change font-weight or size on hover.
- Pressed: `transform: scale(0.98)` on buttons.
- Drawer: slide-in `240ms cubic-bezier(0.32, 0.72, 0, 1)`. Modal: fade + scale
  `0.98 → 1` over 160ms. Toast: rise 200ms.
- Wrap all of it in `@media (prefers-reduced-motion: reduce) { ... }` — motion
  off, states still legible.

## 8. Focus & interaction

- `:focus-visible` ring: `box-shadow: 0 0 0 3px` accent at ~35% alpha plus
  accent border — box-shadow (respects radius), not `outline`.
- Hover states gated behind `@media (hover: hover)`.
- Every async action shows its in-progress label ("Refreshing…") — already a
  codebase convention; keep it.

## 9. Component vocabulary

- **Catalog card (EntryCard)** — the signature. Header line: call number
  (entry id, mono 10–11px, `--tx-2`) left, status stamp right; below it a 2px
  **category rule** in the category color (the index-card ruled line); then
  serif title, two-line summary, tag chips, meta footer with tabular numbers.
- **Status stamp** — uppercase mono 10px, letterspaced, 1px solid
  currentColor border, 3px radius, wash background per §2. Like a due-date
  stamp: labeled, never color-only.
- **Ex-libris brand block (sidebar)** — eyebrow "EX LIBRIS" above "LibrAIum" in
  serif 22/500, finished with a thin double rule. The bookplate eyebrow and the
  sidebar section eyebrows use **wider** tracking than §3's 0.08em base (≈0.18em
  on the ex-libris mark, ≈0.14em on section titles) — a deliberate letterpress
  flourish reserved to the sidebar's short uppercase marks, not a license to
  widen labels elsewhere.
- **Buttons** — default: paper bg + hairline; primary: `--ink` fill with
  `--ink-contrast` text (ink, not accent — accent fills are reserved for
  nothing); danger: red text + tinted border, filled red only on the final
  destructive confirm.
- **Inputs** — paper bg, hairline border, focus ring per §8.
- **Drawer (EntryDetail)** — a pulled catalog card: paper surface, overlay
  shadow, canvas dims behind a warm scrim `rgba(16, 15, 15, 0.4)`.
- **Icons** — line icons only (16px, 1.5px stroke, round caps, `currentColor`),
  used sparingly: nav + a handful of glyph-level marks (+ ✕ ↗ ★ as text
  glyphs). Use the existing `src/lib/components/Icon.svelte`; do not re-create
  it or inline new SVGs elsewhere. **No emoji in chrome.** Emoji chosen by the
  user as category icons are data and may appear in selects/pickers.

## 10. Voice

Copy is part of the material. Keep the existing library register — plain,
warm, specific: "The shelves are dusted.", "Shelved sveltejs/kit". Buttons say
what they do ("Add to library", not "Submit"). Errors state what happened and
what to do next; no apologies, no exclamation marks.

## 11. Don'ts (anti-AI-look constraints)

- No neon, no gradients (including text gradients), no glassmorphism, no glow.
- No indigo/violet/electric-blue accents; no cyan-purple pairings.
- No heavy single-layer drop shadows; no shadow + border on the same resting element.
- No pill badges, no floating rounded "app store" cards, no 16px+ radii on controls.
- No emoji as UI iconography.
- No font-weight changes on hover; no transitions over 200ms; no parallax, no
  scroll-triggered theatrics.
- No pure black/white surfaces, no cold grays.
- If a new surface can be flat + hairline instead of shadowed, it must be.
