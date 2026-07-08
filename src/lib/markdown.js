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

// Scheme-less (relative/anchor) hrefs pass; an explicit scheme must be
// allowlisted. Control chars and whitespace are stripped first so variants
// like "java\tscript:" cannot smuggle a scheme past the check.
function isSafeHref(href) {
  const match = String(href)
    .replace(/[\x00-\x20\x7f]/g, "")
    .match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
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
