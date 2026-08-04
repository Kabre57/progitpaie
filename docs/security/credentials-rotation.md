# Procès-verbal de Rotation des Identifiants PostgreSQL

- **Environnement concerné** : Développement local & Staging local
- **Rôle PostgreSQL concerné** : `progitpaie`
- **Date de réalisation** : 2026-08-04
- **Opérateur** : Equipe Sécurité & Infrastructure
- **Date de révocation de l'ancien secret** : 2026-08-04
- **Services redéployés** : Service Paie / Application Next.js & Scripts de migration V2
- **Référence au gestionnaire de secrets** : Coffre-fort de secrets local / Variables d'environnement système

---

## 1. Description des actions réalisées
1. Suppression de l'intégralité des valeurs par défaut et fallbacks de mot de passe dans `docker-compose.yml`, `scripts/populate-reference-provisions-2026.py`, et `scripts/export-val26-pg.ts`.
2. Configuration de l'obligation d'injection de `DATABASE_URL` et `DB_PASSWORD` depuis les variables d'environnement système sans fallback hardcodé.
3. Vérification du verrouillage et de l'étanchéité des connexions.

---

## 2. Contrôles de validation
- [x] Test de statut des migrations Prisma (`npx prisma migrate status`) : **`Database schema is up to date!`**
- [x] Vérification de l'absence totale de secrets dans le code versionné et la configuration Compose.
- [x] Échec explicite et contrôlé des scripts d'extraction si `DATABASE_URL` n'est pas fournie.
