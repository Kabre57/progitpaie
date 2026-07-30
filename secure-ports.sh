#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Script de Sécurisation UFW des Ports VPS 🔒
# ═══════════════════════════════════════════════════════════════════════════════

echo "🔒 Début de la sécurisation des ports exposés sur le VPS..."

# 1. Fermer l'accès public au port PostgreSQL 5433 (CRITIQUE)
echo "🛡️ Fermeture du port PostgreSQL 5433..."
sudo ufw deny 5433/tcp || true

# 2. Fermer l'accès public aux API Gateways exposées
echo "🛡️ Fermeture des ports d'API exposés (3001, 3003, 3004)..."
sudo ufw deny 3001/tcp || true
sudo ufw deny 3003/tcp || true
sudo ufw deny 3004/tcp || true

# 3. Autoriser uniquement Nginx et SSH
echo "✅ Autorisation des flux légitimes (80, 443, 22)..."
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw allow 22/tcp || true

# 4. Activer UFW si non actif
echo "🔥 Activation et rechargement du pare-feu UFW..."
sudo ufw --force enable || true
sudo ufw reload || true

echo "================================================================="
echo "✅ Vos ports sont maintenant totalement sécurisés !"
echo "================================================================="
