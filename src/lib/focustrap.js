// Svelte action for modal overlays (the drawer and the add-repo modal):
// keep Tab focus inside the overlay, and restore focus to whatever was focused
// before it opened when it unmounts. Pair it with role="dialog"
// aria-modal="true" and aria-labelledby on the node itself. Components still set
// their own initial focus; this action only traps and restores.
export function trapFocus(node) {
  const previouslyFocused = document.activeElement;
  const SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function focusables() {
    // offsetParent === null filters elements that are hidden (display:none).
    return [...node.querySelectorAll(SELECTOR)].filter((el) => el.offsetParent !== null);
  }

  function onKeydown(e) {
    if (e.key !== "Tab") return;
    const items = focusables();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  node.addEventListener("keydown", onKeydown);
  return {
    destroy() {
      node.removeEventListener("keydown", onKeydown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    },
  };
}
