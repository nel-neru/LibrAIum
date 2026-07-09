// Pins the markdown renderer's security contract: entry bodies are untrusted
// (GitHub descriptions, git-synced entries) and render through {@html} in a
// webview with Tauri IPC access — raw HTML must never pass through and link
// hrefs must never carry an executable scheme.
import test from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../src/lib/markdown.js";

test("block raw HTML is escaped to visible text", () => {
  const out = renderMarkdown("<script>window.__pwn = 1</script>");
  assert.ok(!out.includes("<script"), out);
  assert.ok(out.includes("&lt;script&gt;"), out);
});

test("inline raw HTML is escaped (event-handler payload)", () => {
  const out = renderMarkdown("hello <img src=x onerror=alert(1)> world");
  assert.ok(!out.includes("<img"), out);
  assert.ok(out.includes("&lt;img"), out);
});

test("javascript: links are stripped to their label", () => {
  const out = renderMarkdown("[click me](javascript:alert(1))");
  assert.ok(!/href/i.test(out), out);
  assert.ok(out.includes("click me"), out);
});

test("no href ever carries an executable scheme, regardless of casing", () => {
  for (const md of [
    "[x](JavaScript:alert(1))",
    "[x](VBSCRIPT:Execute(1))",
    "[x](data:text/html;base64,PHNjcmlwdD4=)",
    "<javascript:alert(1)>",
  ]) {
    const out = renderMarkdown(md);
    assert.ok(!/href="[^"]*(javascript|vbscript|data):/i.test(out), `${md} -> ${out}`);
  }
});

test("a scheme split by a control / C1 / Unicode-whitespace char is not mis-classified as relative", () => {
  // isSafeHref strips these before reading the scheme; without it the scheme
  // regex fails to reach the ':' and returns the (safe) relative verdict,
  // rendering `<a href="java<sep>script:alert(1)">`.
  for (const code of [0x09, 0x0a, 0x00, 0x85, 0xa0, 0x2028, 0x2029, 0xfeff]) {
    const out = renderMarkdown(`[x](java${String.fromCharCode(code)}script:alert(1))`);
    assert.ok(!/href="[^"]*script:/i.test(out), `U+${code.toString(16)} -> ${out}`);
  }
  // a legitimate https link is unaffected
  assert.ok(/href="https:\/\/example\.com"/.test(renderMarkdown("[x](https://example.com)")));
});

test("image alt cannot break out of the attribute (handler injection)", () => {
  const out = renderMarkdown('![a" onerror="alert(1)" x=](https://example.com/real.png)');
  // The literal word survives only as escaped text; a real breakout would be
  // an unescaped `" onerror="`. Assert the quotes stayed escaped.
  assert.ok(!out.includes('" onerror="'), out);
  assert.ok(out.includes('alt="a&quot; onerror=&quot;alert(1)&quot; x="'), out);
});

test("image with unsafe src scheme degrades to escaped alt text (no tag)", () => {
  for (const md of [
    "![x](javascript:alert(1))",
    '![y" onload="alert(1)](data:text/html;base64,PHN2Zz4=)',
  ]) {
    const out = renderMarkdown(md);
    assert.ok(!out.includes("<img"), `${md} -> ${out}`);
    assert.ok(!out.includes('" onload="'), `${md} -> ${out}`);
    assert.ok(!/(src|href)="(javascript|data):/i.test(out), `${md} -> ${out}`);
  }
});

test("legitimate http(s) image survives", () => {
  const out = renderMarkdown("![diagram](https://example.com/a.png)");
  assert.ok(out.includes('<img src="https://example.com/a.png" alt="diagram">'), out);
});

test("http(s), mailto, relative and anchor links survive", () => {
  const out = renderMarkdown(
    "[gh](https://github.com/a/b) [plain](http://example.com) [mail](mailto:x@y.z) [rel](./notes.md) [anchor](#personal-notes)"
  );
  assert.ok(out.includes('href="https://github.com/a/b"'), out);
  assert.ok(out.includes('href="http://example.com"'), out);
  assert.ok(out.includes('href="mailto:x@y.z"'), out);
  assert.ok(out.includes('href="./notes.md"'), out);
  assert.ok(out.includes('href="#personal-notes"'), out);
});

test("link titles are escaped, not executable", () => {
  const out = renderMarkdown('[x](https://a.b "\\"><script>alert(1)</script>")');
  assert.ok(!out.includes("<script"), out);
});

test("normal markdown still renders", () => {
  const out = renderMarkdown("# Title\n\n**bold** and a list:\n\n- one\n- two");
  assert.ok(out.includes("<h1"), out);
  assert.ok(out.includes("<strong>bold</strong>"), out);
  assert.ok(out.includes("<li>one</li>"), out);
});

test("null/empty body renders without throwing", () => {
  assert.equal(renderMarkdown(null), "");
  assert.equal(renderMarkdown(""), "");
});
