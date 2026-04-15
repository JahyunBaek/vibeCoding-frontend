#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

KO="$PROJECT_DIR/src/locales/ko.json"
EN="$PROJECT_DIR/src/locales/en.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo "=============================="
echo "  i18n Key Sync Check"
echo "=============================="
echo ""

extract_keys() {
  local file="$1"
  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    function flatten(obj, prefix) {
      return Object.entries(obj).flatMap(([k, v]) => {
        const key = prefix ? prefix + '.' + k : k;
        return typeof v === 'object' && v !== null ? flatten(v, key) : [key];
      });
    }
    flatten(data, '').sort().forEach(k => console.log(k));
  " "$file"
}

KO_KEYS=$(extract_keys "$KO")
EN_KEYS=$(extract_keys "$EN")

MISSING_IN_EN=$(comm -23 <(echo "$KO_KEYS") <(echo "$EN_KEYS") || true)
MISSING_IN_KO=$(comm -13 <(echo "$KO_KEYS") <(echo "$EN_KEYS") || true)

ERRORS=0

if [ -n "$MISSING_IN_EN" ]; then
  echo -e "${RED}ko.json에만 있는 키 (en.json에 누락):${NC}"
  echo "$MISSING_IN_EN" | sed 's/^/  - /'
  ERRORS=$((ERRORS + $(echo "$MISSING_IN_EN" | wc -l)))
  echo ""
fi

if [ -n "$MISSING_IN_KO" ]; then
  echo -e "${RED}en.json에만 있는 키 (ko.json에 누락):${NC}"
  echo "$MISSING_IN_KO" | sed 's/^/  - /'
  ERRORS=$((ERRORS + $(echo "$MISSING_IN_KO" | wc -l)))
  echo ""
fi

KO_COUNT=$(echo "$KO_KEYS" | wc -l | tr -d ' ')
EN_COUNT=$(echo "$EN_KEYS" | wc -l | tr -d ' ')

echo "  ko.json: ${KO_COUNT} keys"
echo "  en.json: ${EN_COUNT} keys"
echo ""

if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}  $ERRORS keys out of sync${NC}"
  echo ""
  exit 1
else
  echo -e "${GREEN}  All keys are in sync${NC}"
  echo ""
fi
