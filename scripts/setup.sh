#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo "=============================="
echo "  Frontend Setup"
echo "=============================="
echo ""

echo "  [1/3] Installing dependencies..."
npm install --legacy-peer-deps

echo ""
echo "  [2/3] Type check..."
npx tsc --noEmit

echo ""
echo "  [3/3] Build verification..."
npx vite build --logLevel error

echo ""
echo -e "${GREEN}  Setup complete!${NC}"
echo ""
echo "  Run:  npm run dev"
echo ""
