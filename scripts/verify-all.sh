#!/usr/bin/env bash
# verify-all.sh — run every LibrAIum verification stage in sequence.
#
# Stages:
#   [1/6] data validation      node scripts/validate-data.mjs --data-dir data
#   [2/6] Rust unit tests      (cd src-tauri && cargo test --quiet)
#   [3/6] frontend build+tests npm run build && npm test  (vite + node --test)
#   [4/6] MCP tests            (cd mcp-server && npm test)  unit + stdio smoke
#   [5/7] conformance          node scripts/conformance.mjs
#   [6/7] catalog drift        node scripts/build-catalog.mjs --check
#   [7/7] app binary build     (cd src-tauri && cargo build --bin libraium)
#
# If dist/ is missing (fresh clone / CI), the frontend build runs BEFORE
# cargo test, because Tauri's generate_context! embeds dist/ at compile time.
# Stage 6 exists because nothing else builds the REAL app binary — a broken
# bare `cargo run` (e.g. the default-run regression) passed stages 1-5.
#
# Non-interactive and CI-safe: no prompts, exits non-zero on first failure.

set -euo pipefail

# Rust is installed via Homebrew on dev machines; harmless no-op elsewhere.
export PATH="/opt/homebrew/bin:$PATH"

cd "$(dirname "$0")/.."

# Fail fast with a clear message instead of a mid-stage "Cannot find package
# 'yaml'" crash (stage 1 imports mcp-server/lib/store.js).
for dir in . mcp-server; do
  if [ ! -d "$dir/node_modules" ]; then
    echo "✗ $dir/node_modules not found — run: (cd $dir && npm install)" >&2
    exit 1
  fi
done

STAGE_TOTAL=7

stage() {
  local num="$1" name="$2"
  shift 2
  printf '\n==> [%s/%s] %s\n' "$num" "$STAGE_TOTAL" "$name"
  local start end
  start=$(date +%s)
  "$@"
  end=$(date +%s)
  printf '<== [%s/%s] %s passed (%ss)\n' "$num" "$STAGE_TOTAL" "$name" "$((end - start))"
}

# --data-dir data: verify THIS repo's data even when LIBRAIUM_DATA_DIR points
# at the user's live library (the MCP setup in README tells devs to export it).
validate_data()  { node scripts/validate-data.mjs --data-dir data; }
cargo_tests()    { (cd src-tauri && cargo test --quiet --locked); }
frontend_build() { npm run build && npm test; }
mcp_smoke()      { (cd mcp-server && npm test); }
conformance()    { node scripts/conformance.mjs; }
catalog_drift()  { node scripts/build-catalog.mjs --check; }
app_build()      { (cd src-tauri && cargo build --quiet --locked --bin libraium); }

overall_start=$(date +%s)

stage 1 "data validation (validate-data.mjs)" validate_data

if [ ! -d dist ]; then
  echo "dist/ not found — running the frontend build before cargo test (generate_context! embeds dist/)"
  stage 2 "frontend build + unit tests (vite, node --test)" frontend_build
  stage 3 "Rust unit tests (cargo test)" cargo_tests
else
  stage 2 "Rust unit tests (cargo test)" cargo_tests
  stage 3 "frontend build + unit tests (vite, node --test)" frontend_build
fi

stage 4 "MCP server tests (npm test)" mcp_smoke
stage 5 "Rust<->Node conformance (conformance.mjs)" conformance
stage 6 "catalog drift (build-catalog.mjs --check)" catalog_drift
stage 7 "app binary build (cargo build --bin libraium)" app_build

overall_end=$(date +%s)
printf '\n\033[1;32m✓ All %s verification stages passed in %ss.\033[0m\n' "$STAGE_TOTAL" "$((overall_end - overall_start))"
