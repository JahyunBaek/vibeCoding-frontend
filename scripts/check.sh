#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

PASS=0
FAIL=0

run_step() {
  local name="$1"
  shift
  printf "%-30s" "  $name..."
  if output=$("$@" 2>&1); then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
  else
    echo -e "${RED}FAIL${NC}"
    echo "$output" | tail -10
    ((FAIL++))
  fi
}

echo ""
echo "=============================="
echo "  Frontend Quality Check"
echo "=============================="
echo ""

run_step "TypeScript"        npx tsc --noEmit
run_step "ESLint"            npx eslint src/ --max-warnings 50
run_step "Prettier"          npx prettier --check src/
run_step "Build"             npx vite build --logLevel error

echo ""
echo "------------------------------"
echo -e "  Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
echo "------------------------------"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
