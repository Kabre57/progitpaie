#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Script de Déploiement Automatisé Production VPS 🚀
# ═══════════════════════════════════════════════════════════════════════════════

echo "================================================================="
echo "🚀 Démarrage du Déploiement de PROGITPAIE..."
echo "================================================================="

SECRETS_FILE="/etc/progitpaie/production.env"

# 1. Injection des secrets dans l'environnement courant
if [ -r "$SECRETS_FILE" ]; then
    echo "🔐 Chargement des secrets : $SECRETS_FILE"
    set -a
    # shellcheck source=/dev/null
    source "$SECRETS_FILE"
    set +a
elif sudo -n test -r "$SECRETS_FILE" 2>/dev/null; then
    echo "🔐 Chargement des secrets via sudo : $SECRETS_FILE"
    SECRETS_CONTENT=$(sudo cat "$SECRETS_FILE")
    set -a
    eval "$SECRETS_CONTENT"
    set +a
else
    echo "❌ Impossible de lire $SECRETS_FILE"
    echo "   → Vérifiez que theo_pbl est membre du groupe progitpaie-deploy"
    exit 1
fi

# 2. Recharger le dernier code source
echo "📦 Récupération du code source..."
git pull origin main || echo "ℹ️ git pull a échoué — code local utilisé."

# 3. Build des conteneurs Docker
echo "🏗️ Construction des conteneurs Docker..."
docker compose build --no-cache

# 4. Redémarrage des conteneurs
echo "🔄 Démarrage des conteneurs PROGITPAIE..."
docker compose down
docker compose up -d

# 5. Application des Vues Matérialisées & Index Full-Text Search
echo "⚡ Application des Vues Matérialisées & Index Full-Text Search..."
docker compose exec -T postgres psql -U "${POSTGRES_USER:-progitpaie}" -d "${POSTGRES_DB:-progitpaie}" \
  -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" || true
cat prisma/migrations/20260806190000_advanced_pg_features/migration.sql | \
  docker compose exec -T postgres psql -U "${POSTGRES_USER:-progitpaie}" -d "${POSTGRES_DB:-progitpaie}" || true

echo "================================================================="
echo "✅ Déploiement de PROGITPAIE terminé avec succès !"
echo "🌐 URL : https://progitpaie.online"
echo "================================================================="
