import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Tauri expects a fixed dev port; fail fast if it is taken.
export default defineConfig({
  plugins: [svelte()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "es2022",
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
