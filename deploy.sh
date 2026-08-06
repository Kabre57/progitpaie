#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Script de Déploiement Automatisé Production VPS 🚀
# ═══════════════════════════════════════════════════════════════════════════════

echo "================================================================="
echo "🚀 Démarrage du Déploiement de PROGITPAIE..."
echo "================================================================="

# 1. Vérification du fichier .env
if [ ! -f .env ]; then
    echo "❌ Le fichier .env est requis. Copiez .env.production.example puis renseignez des secrets uniques."
    exit 1
fi

# 2. Recharger le dernier code source sans jamais écraser les secrets locaux
echo "📦 Récupération du code source..."
progitpaie_env_backup="$(mktemp /tmp/progitpaie-env.XXXXXX)"
cp .env "$progitpaie_env_backup"
git pull origin main || echo "ℹ️ Attention: git pull a échoué ou aucun dépôt distant configuré."
cp "$progitpaie_env_backup" .env
rm -f "$progitpaie_env_backup"

# 3. Build des conteneurs Docker
echo "🏗️ Construction des conteneurs Docker..."
docker compose build --no-cache

# 4. Redémarrage des conteneurs
echo "🔄 Démarrage des conteneurs PROGITPAIE..."
docker compose down
docker compose up -d

# 5. Application des Vues Matérialisées & Index Full-Text Search PostgreSQL
echo "⚡ Application des Vues Matérialisées & Index Full-Text Search..."
docker compose exec -T postgres psql -U progitpaie -d progitpaie -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" || true
docker compose exec -T postgres psql -U progitpaie -d progitpaie -f /app/prisma/migrations/20260806190000_advanced_pg_features/migration.sql || true

echo "================================================================="
echo "✅ Déploiement de PROGITPAIE terminé avec succès !"
echo "🌐 URL : https://progitpaie.online"
echo "================================================================="
