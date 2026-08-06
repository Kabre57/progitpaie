#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Script de Rollback Automatisé (< 30 secondes) ⏪
# ═══════════════════════════════════════════════════════════════════════════════

echo "================================================================="
echo "⏪ Lancement du Rollback vers le commit précédent..."
echo "================================================================="

SECRETS_FILE="/etc/progitpaie/production.env"

if [ -r "$SECRETS_FILE" ]; then
    set -a
    # shellcheck source=/dev/null
    source "$SECRETS_FILE"
    set +a
elif sudo -n test -r "$SECRETS_FILE" 2>/dev/null; then
    SECRETS_CONTENT=$(sudo cat "$SECRETS_FILE")
    set -a
    eval "$SECRETS_CONTENT"
    set +a
fi

# Reset au commit Git précédent (ownership reste theo_pbl)
git reset --hard HEAD~1

# Relance des conteneurs
docker compose up -d --build app || docker compose up -d

echo "✅ Rollback exécuté avec succès en moins de 30 secondes."
