// Renders untrusted entry-body Markdown to HTML for {@html} injection.
//
// Bodies are not trusted input: the add flow embeds GitHub repo descriptions
// verbatim, and a git-synced library can contain entries authored elsewhere.
// Page scripts reach Tauri's IPC layer, so raw HTML passthrough would
// escalate to arbitrary command invocation. Raw HTML tokens are therefore
// escaped to visible text, and link hrefs are limited to http(s)/mailto/
// relative targets. This escaping is the PRIMARY defense — the CSP in
// tauri.conf.json is a second layer, not a reason to relax it.
import { Marked } from "marked";

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

// Strip the characters a scheme could be split with before the scheme is read,
// so variants like "java\tscript:" or "java script:" cannot smuggle a
// scheme past isSafeHref. Covers ASCII controls/space (0x00-0x20) and DEL/C1
// (0x7f-0x9f, incl. NEL 0x85), plus the non-ASCII separators the browser's URL
// parser does NOT strip: NBSP 0xA0, line/paragraph separators 0x2028/0x2029,
// and BOM/ZWNBSP 0xFEFF. Done by code point (not a regex literal) so no
// invisible character ever lives in this source file.
function stripSchemeSeparators(value) {
  let out = "";
  for (const ch of String(value)) {
    const c = ch.codePointAt(0);
    const strip =
      c <= 0x20 ||
      (c >= 0x7f && c <= 0x9f) ||
      c === 0xa0 ||
      c === 0x2028 ||
      c === 0x2029 ||
      c === 0xfeff;
    if (!strip) out += ch;
  }
  return out;
}

// Scheme-less (relative/anchor) hrefs pass; an explicit scheme must be
// allowlisted after the separators above are stripped.
function isSafeHref(href) {
  const match = stripSchemeSeparators(href).match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  return match === null || ["http", "https", "mailto"].includes(match[1].toLowerCase());
}

const markdown = new Marked({
  renderer: {
    html(token) {
      return escapeHtml(token.text);
    },
    link(token) {
      const label = this.parser.parseInline(token.tokens);
      if (!isSafeHref(token.href)) return label;
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      return `<a href="${escapeHtml(token.href)}"${title}>${label}</a>`;
    },
    // marked's default image renderer leaves alt text unescaped, so
    // `![x" onerror="…](…)` injects live attributes; escape every field and
    // scheme-check src the same way links are. Unsafe src ⇒ alt text only.
    image(token) {
      const alt = escapeHtml(token.text);
      if (!isSafeHref(token.href)) return alt;
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      return `<img src="${escapeHtml(token.href)}" alt="${alt}"${title}>`;
    },
  },
});

export function renderMarkdown(body) {
  return markdown.parse(body ?? "");
}
