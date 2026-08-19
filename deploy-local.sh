#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Script de Déploiement (Local & Production) 🚀
# ═══════════════════════════════════════════════════════════════════════════════

echo "================================================================="
echo "🚀 Démarrage du Déploiement de PROGITPAIE..."
echo "================================================================="

# 1. Vérification du fichier .env
if [ ! -f .env ]; then
    echo "❌ Le fichier .env est requis. Copiez .env.example puis renseignez vos variables."
    exit 1
fi

# Charger les variables .env dans l'environnement du script
# (set -a exporte automatiquement toutes les variables définies)
set -a
# shellcheck source=.env
. ./.env
set +a

# 2. Vérifier si on est en production ou local
# Utiliser DEPLOY_MODE=production uniquement sur un serveur relié à un dépôt Git.
DEPLOY_MODE="${DEPLOY_MODE:-local}"
if [ "$DEPLOY_MODE" = "production" ]; then
    echo "📦 Mode Production - Récupération du code source..."
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        progitpaie_env_backup="$(mktemp /tmp/progitpaie-env.XXXXXX)"
        cp .env "$progitpaie_env_backup"
        git pull --ff-only origin main || echo "ℹ️ Attention : git pull a échoué ; le code local est conservé."
        cp "$progitpaie_env_backup" .env
        rm -f "$progitpaie_env_backup"
    else
        echo "ℹ️ Aucun dépôt Git détecté : étape git pull ignorée pour cette archive ZIP."
    fi
else
    echo "💻 Mode Local - Pas de pull automatique"
    echo "📂 Dossier actuel : $(pwd)"
fi

# 3. Préparation et Build Local de l'application Next.js Standalone
echo "🔨 Préparation des artefacts (Prisma, Next.js Standalone, Rotation TS)..."
pnpm prisma:generate
pnpm build
pnpm exec tsc --project tsconfig.rotation.json

# 4. Build des conteneurs Docker
echo "🏗️ Construction des conteneurs Docker..."
docker compose build

# 5. Redémarrage des conteneurs
echo "🔄 Démarrage des conteneurs PROGITPAIE..."
docker compose down
docker compose up -d

# 6. Application des migrations Prisma depuis l'hôte (port mappé 127.0.0.1:5433)
# Le conteneur runner (Next.js standalone) ne contient pas le CLI Prisma.
# On utilise le Prisma CLI local avec le port mappé Docker sur l'hôte.
echo "⏳ Attente que PostgreSQL soit prêt..."
for i in $(seq 1 15); do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-progitpaie}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
DATABASE_URL="postgresql://${POSTGRES_USER:-progitpaie}:${DB_PASSWORD}@127.0.0.1:5433/${POSTGRES_DB:-progitpaie}?schema=public" \
  pnpm exec prisma migrate deploy --schema=prisma/schema \
  || { echo "⚠️  migrate deploy a échoué. Vérifiez prisma/migrations/."; exit 1; }

echo "================================================================="
echo "✅ Déploiement de PROGITPAIE terminé avec succès !"
if [ -f /etc/debian_version ] && [ "$(hostname)" != "votre-host-local" ]; then
    echo "🌐 URL : https://progitpaie.online"
else
    echo "🌐 URL : http://localhost:3000"
fi
echo "================================================================="
