// Pins that CATALOG.md entry links are always forward-slash, repo-relative
// paths — even when the entry's absolute path carries Windows '\' separators.
// This runs identically on every OS (it feeds literal backslashes rather than
// path.sep), so CI — where the backslash bug is otherwise invisible because
// Linux paths already use '/' — can catch a regression of it.
import test from "node:test";
import assert from "node:assert/strict";
import { catalogLinkPath } from "../scripts/build-catalog.mjs";

test("a Windows entry path under root becomes a forward-slash repo-relative link", () => {
  assert.equal(
    catalogLinkPath("C:\\r\\LibrAIum\\data\\entries\\ai-agent\\foo.md", "C:\\r\\LibrAIum", "ai-agent", "ai-agent/foo"),
    "data/entries/ai-agent/foo.md"
  );
});

test("a POSIX entry path under root is unchanged", () => {
  assert.equal(
    catalogLinkPath("/home/u/LibrAIum/data/entries/web-app/bar.md", "/home/u/LibrAIum", "web-app", "web-app/bar"),
    "data/entries/web-app/bar.md"
  );
});

test("the fallback branch (path not under root) yields a forward-slash link too", () => {
  assert.equal(
    catalogLinkPath("/elsewhere/entries/baz.md", "/home/u/LibrAIum", "game-dev", "game-dev/baz-qux"),
    "data/entries/game-dev/baz-qux.md"
  );
});

test("no backslash survives in the emitted link path", () => {
  const out = catalogLinkPath("D:\\x\\data\\entries\\security\\a-b.md", "D:\\x", "security", "security/a-b");
  assert.ok(!out.includes("\\"), out);
});
