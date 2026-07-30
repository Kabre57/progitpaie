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
    echo "⚠️ Le fichier .env n'existe pas. Copie depuis .env.production..."
    cp .env.production.example .env
fi

# 2. Recharger le dernier code source
echo "📦 Récupération du code source..."
git pull origin main || echo "ℹ️ Attention: git pull a échoué ou aucun dépôt distant configuré."

# 3. Build des conteneurs Docker
echo "🏗️ Construction des conteneurs Docker..."
docker compose build --no-cache

# 4. Redémarrage des conteneurs
echo "🔄 Démarrage des conteneurs PROGITPAIE..."
docker compose down
docker compose up -d

# 5. Application des migrations Prisma
echo "🗄️ Exécution des migrations Prisma PostgreSQL..."
sleep 5
docker compose exec -T app npx prisma migrate deploy || docker compose exec -T app npx prisma db push

echo "================================================================="
echo "✅ Déploiement de PROGITPAIE terminé avec succès !"
echo "🌐 URL : https://paie.progitpaie.com"
echo "================================================================="
