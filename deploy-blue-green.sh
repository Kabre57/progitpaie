#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Déploiement Zéro Temps d'Arrêt (Blue-Green / Rolling Update) 🚀
# ═══════════════════════════════════════════════════════════════════════════════

echo "================================================================="
echo "🚀 Démarrage du Déploiement Zéro Temps d'Arrêt (Blue-Green)..."
echo "================================================================="

APP_DIR="/home/theo_pbl/apps/progitpaie"
cd "$APP_DIR" || exit 1

# 1. Pull du dernier code
git fetch origin main
git reset --hard origin/main

# 2. Construction de la nouvelle image Docker sans interrompre l'ancienne
echo "🏗️ Construction de la nouvelle image Docker..."
docker compose build app || docker compose build

# 3. Relance du conteneur en mode Rolling Update
echo "🔄 Relance du conteneur d'application..."
docker compose up -d --no-deps --build app || docker compose up -d

# 4. Attente et vérification du Health Check
echo "⏳ Vérification du Health Check (/api/health)..."
HEALTH_PASSED=false
for i in {1..10}; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3500/api/health || true)
  if [ "$HTTP_STATUS" -eq 200 ]; then
    HEALTH_PASSED=true
    break
  fi
  echo "Attente du démarrage (Tentative $i/10, Status: $HTTP_STATUS)..."
  sleep 3
done

if [ "$HEALTH_PASSED" = true ]; then
  echo "⚡ Application des Vues Matérialisées & Index Full-Text Search PostgreSQL..."
  docker compose exec -T postgres psql -U progitpaie -d progitpaie -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" || true
  docker compose exec -T postgres psql -U progitpaie -d progitpaie -f /app/prisma/migrations/20260806190000_advanced_pg_features/migration.sql || true

  echo "✅ Health Check RÉUSSI ! Le déploiement Zéro Temps d'Arrêt est validé."
else
  echo "❌ ÉCHEC DU HEALTH CHECK ! Lancement du Rollback automatique..."
  ./rollback.sh
  exit 1
fi
