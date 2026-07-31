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

# 2. Vérifier si on est en production ou local
if [ -f /etc/debian_version ] && [ "$(hostname)" != "votre-host-local" ]; then
    # En production (VPS)
    echo "📦 Mode Production - Récupération du code source..."
    progitpaie_env_backup="$(mktemp /tmp/progitpaie-env.XXXXXX)"
    cp .env "$progitpaie_env_backup"
    git pull origin main || echo "ℹ️ Attention: git pull a échoué."
    cp "$progitpaie_env_backup" .env
    rm -f "$progitpaie_env_backup"
else
    # En local
    echo "💻 Mode Local - Pas de pull automatique"
    echo "📂 Dossier actuel: $(pwd)"
fi

# 3. Build des conteneurs Docker
echo "🏗️ Construction des conteneurs Docker..."
docker compose build --no-cache

# 4. Redémarrage des conteneurs
echo "🔄 Démarrage des conteneurs PROGITPAIE..."
docker compose down
docker compose up -d

echo "================================================================="
echo "✅ Déploiement de PROGITPAIE terminé avec succès !"
if [ -f /etc/debian_version ] && [ "$(hostname)" != "votre-host-local" ]; then
    echo "🌐 URL : https://progitpaie.online"
else
    echo "🌐 URL : http://localhost:3000"
fi
echo "================================================================="
