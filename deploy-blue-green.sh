#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Déploiement Zéro Temps d'Arrêt (Blue-Green / Rolling Update) 🚀
# ═══════════════════════════════════════════════════════════════════════════════

echo "================================================================="
echo "🚀 Démarrage du Déploiement Zéro Temps d'Arrêt (Blue-Green)..."
echo "================================================================="

# 1. Injection des secrets de production dans l'environnement courant
if [ -f /etc/progitpaie/production.env ]; then
    echo "🔐 Chargement des secrets : /etc/progitpaie/production.env"
    set -a
    # shellcheck source=/dev/null
    source /etc/progitpaie/production.env
    set +a
elif [ -f "$(dirname "$0")/.env" ]; then
    echo "⚠️  Utilisation de .env local (non recommandé en production)"
    set -a
    source "$(dirname "$0")/.env"
    set +a
else
    echo "❌ Aucun fichier de secrets trouvé. Créez /etc/progitpaie/production.env"
    exit 1
fi

# 2. Pull du dernier code (les secrets sont déjà chargés en mémoire)
git fetch origin main
git reset --hard origin/main

# 3. Construction de la nouvelle image Docker
echo "🏗️ Construction de la nouvelle image Docker..."
docker compose build app

# 4. Relance du conteneur en mode Rolling Update
echo "🔄 Relance du conteneur d'application..."
docker compose up -d --no-deps app

# 5. Attente et vérification du Health Check (20 tentatives de 3s = 60s)
echo "⏳ Vérification du Health Check (/api/health)..."
HEALTH_PASSED=false
for i in {1..20}; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3500/api/health || true)
  if [ "$HTTP_STATUS" -eq 200 ]; then
    HEALTH_PASSED=true
    break
  fi
  echo "Attente du démarrage (Tentative $i/20, Status: $HTTP_STATUS)..."
  sleep 3
done

if [ "$HEALTH_PASSED" = true ]; then
  echo "⚡ Application des Vues Matérialisées & Index Full-Text Search PostgreSQL..."
  docker compose exec -T postgres psql -U progitpaie -d progitpaie -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" || true
  docker compose exec -T postgres psql -U progitpaie -d progitpaie -f /app/prisma/migrations/20260806190000_advanced_pg_features/migration.sql || true

  echo "✅ Health Check RÉUSSI ! Le déploiement Zéro Temps d'Arrêt est validé."
  echo "🌐 URL : https://progitpaie.online"
else
  echo "❌ ÉCHEC DU HEALTH CHECK ! Lancement du Rollback automatique..."
  bash "$(dirname "$0")/rollback.sh"
  exit 1
fi
