// Pure array-reorder for the Categories drag-and-drop list. Extracted so the
// drop-index math is unit-testable without a DOM/DnD harness — the same reason
// src/lib/markdown.js is a pure module (pinned by tests/reorder.test.mjs).
//
// Semantics match the drop indicator: the Categories table paints a 2px accent
// line along the TOP of the hovered row (`tr.drag-over td { box-shadow: inset 0
// 2px 0 … }`), i.e. "insert ABOVE this row". Dropping the row at `from` onto the
// row currently at `to` therefore lands it immediately before `to`.
//
// The naive `splice(from, 1); splice(to, 0, moved)` is off by one when dragging
// DOWNWARD: removing `from` first shifts every later index down by one, so the
// dragged row lands one slot below where the indicator promised. Compensating
// when `from < to` makes the drop consistent in both directions.
export function reorder(list, from, to) {
  const next = [...list];
  const outOfRange = (i) => i < 0 || i >= next.length;
  if (from === to || outOfRange(from) || outOfRange(to)) return next;
  const [moved] = next.splice(from, 1);
  const target = from < to ? to - 1 : to;
  next.splice(target, 0, moved);
  return next;
}
