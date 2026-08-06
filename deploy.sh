#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Script de Déploiement Automatisé Production VPS 🚀
# ═══════════════════════════════════════════════════════════════════════════════

echo "================================================================="
echo "🚀 Démarrage du Déploiement de PROGITPAIE..."
echo "================================================================="

# 1. Injection des secrets de production dans l'environnement courant
if [ -f /etc/progitpaie/production.env ]; then
    echo "🔐 Chargement des secrets : /etc/progitpaie/production.env"
    set -a
    # shellcheck source=/dev/null
    source /etc/progitpaie/production.env
    set +a
elif [ -f .env ]; then
    echo "⚠️  Utilisation de .env local (non recommandé en production)"
    set -a
    source .env
    set +a
else
    echo "❌ Aucun fichier de secrets trouvé. Créez /etc/progitpaie/production.env"
    exit 1
fi

# 2. Recharger le dernier code source
echo "📦 Récupération du code source..."
git pull origin main || echo "ℹ️ Attention: git pull a échoué."

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
