#!/bin/bash
# Downloads all tech SVGs into images/

set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
MAPPING="$DIR/slug_mapping.json"
mkdir -p "$DIR"

simpleicons_dl() {
  local slug=$1
  local out=$2
  local url="https://cdn.simpleicons.org/$slug"
  local code=$(curl -s -o "$out" -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [ "$code" != "200" ]; then
    rm -f "$out"
    return 1
  fi
  return 0
}

devicon_dl() {
  local slug=$1
  local out=$2
  local code=$(curl -s -o "$out" -w "%{http_code}" --max-time 10 \
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg" 2>/dev/null || echo "000")
  local code2=$(curl -s -o "$out" -w "%{http_code}" --max-time 10 \
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-plain.svg" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    return 0
  elif [ "$code2" = "200" ]; then
    return 0
  fi
  return 1
}

placeholder_gen() {
  local slug=$1
  local out=$2
  local display_name=$(echo "$slug" | sed 's/-/ /g; s/dotjs/.js/g; s/^.*$/\u&/')
  cat > "$out" <<SVGEOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <rect width="48" height="48" rx="8" fill="#e2e8f0"/>
  <text x="24" y="28" font-family="system-ui,sans-serif" font-size="9" font-weight="600" fill="#64748b" text-anchor="middle" dominant-baseline="middle">${slug}</text>
</svg>
SVGEOF
}

COUNT_TOTAL=0
COUNT_OK=0
COUNT_PLACEHOLDER=0

entries=$(python3 -c "
import json
with open('$MAPPING') as f:
    data = json.load(f)
for e in data['entries']:
    print(f\"{e['name']}|{e['slug']}|{e['source']}\")
")

echo "Downloading SVGs..."
echo ""

while IFS='|' read -r name slug source; do
  filename="${slug}.svg"
  filepath="$DIR/$filename"
  COUNT_TOTAL=$((COUNT_TOTAL + 1))

  case "$source" in
    simpleicons)
      if simpleicons_dl "$slug" "$filepath"; then
        echo "  OK  simpleicons  $slug"
        COUNT_OK=$((COUNT_OK + 1))
      else
        echo "  FALLBACK→placeholder  $slug"
        placeholder_gen "$slug" "$filepath"
        COUNT_PLACEHOLDER=$((COUNT_PLACEHOLDER + 1))
      fi
      ;;
    devicon)
      if devicon_dl "$slug" "$filepath"; then
        echo "  OK  devicon     $slug"
        COUNT_OK=$((COUNT_OK + 1))
      else
        echo "  FALLBACK→placeholder  $slug"
        placeholder_gen "$slug" "$filepath"
        COUNT_PLACEHOLDER=$((COUNT_PLACEHOLDER + 1))
      fi
      ;;
    placeholder)
      echo "  PLACEHOLDER  $slug"
      placeholder_gen "$slug" "$filepath"
      COUNT_PLACEHOLDER=$((COUNT_PLACEHOLDER + 1))
      ;;
  esac
done <<< "$entries"

echo ""
echo "Done! $COUNT_TOTAL total — $COUNT_OK downloaded, $COUNT_PLACEHOLDER placeholders"
