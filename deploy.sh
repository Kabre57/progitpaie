#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Script de Déploiement Automatisé Production VPS 🚀
# ═══════════════════════════════════════════════════════════════════════════════

echo "================================================================="
echo "🚀 Démarrage du Déploiement de PROGITPAIE..."
echo "================================================================="

# 1. Sélection du fichier de secrets de production (priorité à /etc/progitpaie/)
ENV_OPTION=""
if [ -f /etc/progitpaie/production.env ]; then
    ENV_OPTION="--env-file /etc/progitpaie/production.env"
    echo "🔐 Secrets de production détectés : /etc/progitpaie/production.env"
elif [ -f .env ]; then
    ENV_OPTION="--env-file .env"
    echo "⚠️  Utilisation de .env local (non recommandé en production)"
else
    echo "❌ Aucun fichier de secrets trouvé. Créez /etc/progitpaie/production.env ou .env"
    exit 1
fi

# 2. Recharger le dernier code source sans jamais écraser les secrets locaux
echo "📦 Récupération du code source..."
git pull origin main || echo "ℹ️ Attention: git pull a échoué ou aucun dépôt distant configuré."

# 3. Build des conteneurs Docker
echo "🏗️ Construction des conteneurs Docker..."
docker compose $ENV_OPTION build --no-cache

# 4. Redémarrage des conteneurs
echo "🔄 Démarrage des conteneurs PROGITPAIE..."
docker compose $ENV_OPTION down
docker compose $ENV_OPTION up -d

# 5. Application des Vues Matérialisées & Index Full-Text Search PostgreSQL
echo "⚡ Application des Vues Matérialisées & Index Full-Text Search..."
docker compose $ENV_OPTION exec -T postgres psql -U progitpaie -d progitpaie -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" || true
docker compose $ENV_OPTION exec -T postgres psql -U progitpaie -d progitpaie -f /app/prisma/migrations/20260806190000_advanced_pg_features/migration.sql || true

echo "================================================================="
echo "✅ Déploiement de PROGITPAIE terminé avec succès !"
echo "🌐 URL : https://progitpaie.online"
echo "================================================================="
