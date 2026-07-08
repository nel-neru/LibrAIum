#!/usr/bin/env bash
# verify-all.sh — run every LibrAIum verification stage in sequence.
#
# Stages:
#   [1/5] data validation      node scripts/validate-data.mjs
#   [2/5] Rust unit tests      (cd src-tauri && cargo test --quiet)
#   [3/5] frontend build       npm run build
#   [4/5] MCP smoke test       (cd mcp-server && npm test)
#   [5/5] conformance          node scripts/conformance.mjs
#
# If dist/ is missing (fresh clone / CI), the frontend build runs BEFORE
# cargo test, because Tauri's generate_context! embeds dist/ at compile time.
#
# Non-interactive and CI-safe: no prompts, exits non-zero on first failure.

set -euo pipefail

# Rust is installed via Homebrew on dev machines; harmless no-op elsewhere.
export PATH="/opt/homebrew/bin:$PATH"

cd "$(dirname "$0")/.."

STAGE_TOTAL=5

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
frontend_build() { npm run build; }
mcp_smoke()      { (cd mcp-server && npm test); }
conformance()    { node scripts/conformance.mjs; }

overall_start=$(date +%s)

stage 1 "data validation (validate-data.mjs)" validate_data

if [ ! -d dist ]; then
  echo "dist/ not found — running the frontend build before cargo test (generate_context! embeds dist/)"
  stage 2 "frontend build (vite)" frontend_build
  stage 3 "Rust unit tests (cargo test)" cargo_tests
else
  stage 2 "Rust unit tests (cargo test)" cargo_tests
  stage 3 "frontend build (vite)" frontend_build
fi

stage 4 "MCP server smoke test (npm test)" mcp_smoke
stage 5 "Rust<->Node conformance (conformance.mjs)" conformance

overall_end=$(date +%s)
printf '\n\033[1;32m✓ All %s verification stages passed in %ss.\033[0m\n' "$STAGE_TOTAL" "$((overall_end - overall_start))"
