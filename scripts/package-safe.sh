#!/usr/bin/env bash
# Produit une archive ZIP distribuable sans secrets ni artefacts locaux.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$PROJECT_ROOT/package.json" | head -n 1)"
OUTPUT_DIR="${1:-$PROJECT_ROOT/../dist}"
ARCHIVE="$OUTPUT_DIR/progitpaie-v${VERSION}-safe.zip"

if [[ -z "$VERSION" ]]; then
  echo "Impossible de déterminer la version depuis package.json." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
rm -f "$ARCHIVE"

cd "$PROJECT_ROOT"
zip -qr "$ARCHIVE" . \
  -x '.env*' \
  -x 'node_modules/*' \
  -x '.next/*' \
  -x '.build/*' \
  -x 'coverage/*' \
  -x 'playwright-report/*' \
  -x 'test-results/*' \
  -x 'uploads/*' \
  -x '.git/*' \
  -x '*.log' \
  -x '*.zip' \
  -x '*.tar' \
  -x '*.gz' \
  -x 'baseline-source.sha256'

for template in .env.example .env.production.example; do
  if [[ -f "$template" ]]; then
    zip -q "$ARCHIVE" "$template"
  fi
done

unsafe_env_files="$(unzip -Z1 "$ARCHIVE" | awk -F/ '{ file = $NF; if (file == ".env" || (file ~ /^\.env\./ && file !~ /\.example$/)) print }')"
if [[ -n "$unsafe_env_files" ]]; then
  echo "Archive refusée : un fichier .env réel a été détecté." >&2
  rm -f "$ARCHIVE"
  exit 1
fi

echo "Archive sûre créée : $ARCHIVE"
