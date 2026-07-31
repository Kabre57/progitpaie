#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Script de Rollback Automatisé (< 30 secondes) ⏪
# ═══════════════════════════════════════════════════════════════════════════════

echo "================================================================="
echo "⏪ Lancement du Rollback vers le commit précédent..."
echo "================================================================="

APP_DIR="/home/theo_pbl/apps/progitpaie"
cd "$APP_DIR" || exit 1

# Reset au commit Git précédent
git reset --hard HEAD~1

# Relance des conteneurs
docker compose up -d --build progitpaie-app

echo "✅ Rollback exécuté avec succès en moins de 30 secondes."
