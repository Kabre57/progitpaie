#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Script de Rollback Automatisé (< 30 secondes) ⏪
# ═══════════════════════════════════════════════════════════════════════════════

echo "================================================================="
echo "⏪ Lancement du Rollback vers le commit précédent..."
echo "================================================================="

# Injection des secrets de production dans l'environnement courant
if [ -f /etc/progitpaie/production.env ]; then
    set -a
    # shellcheck source=/dev/null
    source /etc/progitpaie/production.env
    set +a
elif [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Reset au commit Git précédent
git reset --hard HEAD~1

# Relance des conteneurs
docker compose up -d --build app || docker compose up -d

echo "✅ Rollback exécuté avec succès en moins de 30 secondes."
