// Pins the Categories drag-and-drop reorder semantics: dropping a row onto
// another inserts it ABOVE that row (matching the top-line drop indicator),
// consistently whether dragging up or down. The naive splice was off by one
// when dragging downward — these cases lock the corrected behavior.
import test from "node:test";
import assert from "node:assert/strict";
import { reorder } from "../src/lib/reorder.js";

const ABCD = () => ["A", "B", "C", "D"];

test("drag downward lands the row ABOVE the drop target (the off-by-one case)", () => {
  // drop A (0) onto C (2) → A immediately before C, not after it
  assert.deepEqual(reorder(ABCD(), 0, 2), ["B", "A", "C", "D"]);
});

test("drag upward lands the row above the drop target", () => {
  // drop D (3) onto B (1) → D immediately before B
  assert.deepEqual(reorder(ABCD(), 3, 1), ["A", "D", "B", "C"]);
});

test("drop onto the last row", () => {
  assert.deepEqual(reorder(ABCD(), 0, 3), ["B", "C", "A", "D"]);
});

test("drop onto the first row", () => {
  assert.deepEqual(reorder(ABCD(), 2, 0), ["C", "A", "B", "D"]);
});

test("dropping onto the immediately-following row is a no-op (already above it)", () => {
  // insert-above semantics: B is already directly above C, so dropping B onto C
  // changes nothing — to move B below C you drop it onto the row after C.
  assert.deepEqual(reorder(ABCD(), 1, 2), ["A", "B", "C", "D"]);
});

test("dropping onto the immediately-preceding row moves up one", () => {
  // drop C (2) onto B (1) → C above B
  assert.deepEqual(reorder(ABCD(), 2, 1), ["A", "C", "B", "D"]);
});

test("dropping a row onto itself is a no-op", () => {
  assert.deepEqual(reorder(ABCD(), 2, 2), ABCD());
});

test("an out-of-range index is a no-op (defensive; unreachable from onDrop)", () => {
  assert.deepEqual(reorder(ABCD(), 0, 9), ABCD());
  assert.deepEqual(reorder(ABCD(), -1, 2), ABCD());
});

test("does not mutate the input array", () => {
  const src = ABCD();
  const out = reorder(src, 0, 3);
  assert.deepEqual(src, ["A", "B", "C", "D"]);
  assert.notEqual(out, src);
});
