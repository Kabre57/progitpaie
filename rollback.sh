#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Script de Rollback Automatisé (< 30 secondes) ⏪
# ═══════════════════════════════════════════════════════════════════════════════

echo "================================================================="
echo "⏪ Lancement du Rollback vers le commit précédent..."
echo "================================================================="

# Sélection du fichier de secrets (priorité à /etc/progitpaie/)
ENV_OPTION=""
if [ -f /etc/progitpaie/production.env ]; then
    ENV_OPTION="--env-file /etc/progitpaie/production.env"
elif [ -f .env ]; then
    ENV_OPTION="--env-file .env"
fi

# Reset au commit Git précédent
git reset --hard HEAD~1

# Relance des conteneurs
docker compose $ENV_OPTION up -d --build app || docker compose $ENV_OPTION up -d

echo "✅ Rollback exécuté avec succès en moins de 30 secondes."
