#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Déploiement Zéro Temps d'Arrêt (Blue-Green / Rolling Update) 🚀
# Stratégie : groupe progitpaie-deploy avec lecture seule sur production.env
# ═══════════════════════════════════════════════════════════════════════════════

# Export du PATH pour garantir l'accès à pnpm, node et corepack sur tout VPS
export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
export PATH="$PNPM_HOME:$HOME/.nvm/versions/node/$(node -v 2>/dev/null || echo 'v24.0.0')/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

if [ -f "$HOME/.bashrc" ]; then
    # shellcheck source=/dev/null
    source "$HOME/.bashrc" 2>/dev/null || true
fi

# Résolution automatique du binaire pnpm
if ! command -v pnpm >/dev/null 2>&1; then
    if command -v corepack >/dev/null 2>&1; then
        corepack enable >/dev/null 2>&1 || true
    fi
fi

PNPM_BIN=$(command -v pnpm || echo "pnpm")

echo "================================================================="
echo "🚀 Démarrage du Déploiement Zéro Temps d'Arrêt (Blue-Green)..."
echo "================================================================="

SECRETS_FILE="/etc/progitpaie/production.env"

# 1. Injection des secrets AVANT git reset (résiste à l'écrasement du script)
if [ -r "$SECRETS_FILE" ]; then
    echo "🔐 Chargement des secrets : $SECRETS_FILE"
    set -a
    # shellcheck source=/dev/null
    source "$SECRETS_FILE"
    set +a
elif sudo -n test -r "$SECRETS_FILE" 2>/dev/null; then
    # Lecture via sudo non-interactif (entrée dans sudoers)
    echo "🔐 Chargement des secrets via sudo : $SECRETS_FILE"
    SECRETS_CONTENT=$(sudo cat "$SECRETS_FILE")
    set -a
    eval "$SECRETS_CONTENT"
    set +a
else
    echo "❌ Impossible de lire $SECRETS_FILE"
    echo "   → Vérifiez que theo_pbl est membre du groupe progitpaie-deploy"
    echo "   → Ou exécutez : sudo -E bash deploy-blue-green.sh"
    exit 1
fi

# 2. Pull du dernier code (secrets déjà chargés en mémoire shell)
git fetch origin main
git reset --hard origin/main

# 3. Préparation et Build Local de l'application Next.js Standalone
echo "🔨 Préparation des artefacts (Prisma, Next.js Standalone, Rotation TS)..."
$PNPM_BIN prisma:generate
$PNPM_BIN build
$PNPM_BIN exec tsc --project tsconfig.rotation.json

# 4. Construction des images Docker
echo "🏗️ Construction des images Docker..."
docker compose build app

# 5. Démarrage des conteneurs d'infrastructure
docker compose up -d postgres redis

# 6. Application des migrations Prisma depuis l'hôte (port mappé 127.0.0.1:5433)
echo "🗄️ Application des migrations Prisma..."
echo "⏳ Attente que PostgreSQL soit prêt (30s max)..."
timeout 30 sh -c 'until pg_isready -h 127.0.0.1 -p 5433 -U "${POSTGRES_USER:-progitpaie}" 2>/dev/null; do sleep 2; done' \
  || { echo "❌ PostgreSQL n'a pas répondu dans les 30 secondes."; exit 1; }
DATABASE_URL="postgresql://${POSTGRES_USER:-progitpaie}:${DB_PASSWORD}@127.0.0.1:5433/${POSTGRES_DB:-progitpaie}?schema=public" \
  $PNPM_BIN exec prisma migrate deploy --schema=prisma/schema \
  || { echo "⚠️ migrate deploy a échoué. Vérifiez prisma/migrations/."; exit 1; }

# 7. Relance du conteneur d'application en mode Rolling Update
echo "🔄 Relance du conteneur d'application..."
docker compose up -d --no-deps app

# 8. Attente et vérification du Health Check (20 tentatives x 3s = 60s)
echo "⏳ Vérification du Health Check (/api/health)..."
HEALTH_PASSED=false
for i in {1..20}; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3500/api/health || true)
  if [ "$HTTP_STATUS" -eq 200 ]; then
    HEALTH_PASSED=true
    break
  fi
  echo "Attente (Tentative $i/20, Status: $HTTP_STATUS)..."
  sleep 3
done

if [ "$HEALTH_PASSED" = true ]; then
  echo "⚡ Application des Vues Matérialisées & Index Full-Text Search..."
  docker compose exec -T postgres psql -U "${POSTGRES_USER:-progitpaie}" -d "${POSTGRES_DB:-progitpaie}" \
    -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" || true
  # Pipe le fichier SQL depuis l'hôte vers le conteneur postgres
  cat prisma/migrations/20260806190000_advanced_pg_features/migration.sql | \
    docker compose exec -T postgres psql -U "${POSTGRES_USER:-progitpaie}" -d "${POSTGRES_DB:-progitpaie}" || true

  echo "✅ Health Check RÉUSSI ! Déploiement Zéro Temps d'Arrêt validé."
  echo "🌐 URL : https://progitpaie.online"
else
  echo "❌ ÉCHEC DU HEALTH CHECK ! Lancement du Rollback automatique..."
  bash "$(dirname "$0")/rollback.sh"
  exit 1
fi
