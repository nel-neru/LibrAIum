import { mount } from "svelte";
import App from "./App.svelte";
import "./styles.css";

// Plain-browser preview (vite without Tauri): install the IPC mock first.
// Dead-code-eliminated from production builds.
if (import.meta.env.DEV && !("__TAURI_INTERNALS__" in window)) {
  await import("./lib/dev/mock.js");
}

export default mount(App, { target: document.getElementById("app") });
