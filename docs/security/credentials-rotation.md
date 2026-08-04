# Procès-verbal de sécurisation des identifiants — Phase 1

- **Environnement concerné** : Développement local & dépôt Git distant (`origin/main`)
- **Rôle PostgreSQL concerné** : `progitpaie`
- **Date des contrôles** : 2026-08-04T17:35Z
- **Opérateur** : Equipe Sécurité & Infrastructure
- **Référence au gestionnaire de secrets** : Variables d'environnement système ou coffre `/etc/progitpaie/production.env` (permissions 600)

---

## 1. Actions locales réalisées et vérifiées

1. Suppression des valeurs par défaut et fallbacks de mot de passe dans `docker-compose.yml`, `scripts/populate-reference-provisions-2026.py`, et `scripts/export-val26-pg.ts`.
2. Configuration de l'obligation d'injection de `DATABASE_URL`, `DB_PASSWORD` et `JWT_SECRET` depuis les variables d'environnement système sans fallback hardcodé.
3. Retrait du fichier `.env` de l'index Git ; le fichier local reste ignoré via `.gitignore`.
4. Vérification que le commit `59321ef` n'est pas ancêtre de `origin/main`.

## 2. Constats de l'audit Git — 2026-08-04T17:36Z

| Contrôle | Résultat | Commande |
| :--- | :---: | :--- |
| `.env` dans l'index Git | ❌ Absent (conforme) | `git ls-files --error-unmatch .env` → code 1 |
| `59321ef` dans `origin/main` | ❌ Absent (conforme) | `git merge-base --is-ancestor 59321ef origin/main` → code 1 |
| Branches distantes contenant `59321ef` | Aucune | `git branch -r --contains 59321ef` → vide |
| Blobs `.env` dans l'historique | **4 blobs détectés** | `git rev-list --objects --all \| awk '$2 == ".env"'` |
| Commits poussés contenant `.env` | **3 commits dans `origin/main`** | `0f15956`, `2a9669f`, `52c1441` |

## 3. Constats sur ENCRYPTION_KEY — 2026-08-04T17:39Z

- **Algorithme** : AES-256-GCM avec `crypto.scryptSync` (fichier `lib/crypto.ts`)
- **Support multi-clé** : Non existant
- **Champs chiffrés actifs** : `bankAccount`, `idCardNumber`, `cnpsNumber`
- **Statut rotation** : `BLOCKED — migration requise`
- **Raison** : Changer `ENCRYPTION_KEY` sans mécanisme transitoire rend les données chiffrées existantes indéchiffrables

## 4. Actions opérationnelles encore obligatoires

- [ ] Exécuter la rotation PostgreSQL sur l'environnement distant (procédure documentée dans le rapport Phase 1)
- [ ] Purger `.env` de l'historique Git distant avec `git filter-repo --path .env --invert-paths` après sauvegarde miroir et gel des pushs
- [ ] Coordonner le re-clone de tous les développeurs après le force-push
- [ ] Renouveler `JWT_SECRET` et invalider les sessions existantes
- [ ] Développer le mécanisme de migration multi-clé dans `lib/crypto.ts` avant toute rotation de `ENCRYPTION_KEY`
- [ ] Vérifier que les logs applicatifs ne contiennent aucun marqueur de secret après chaque rotation
- [ ] Consigner les preuves du gestionnaire de secrets et des redéploiements

## 5. Statut formel

Ce document constitue une preuve de contrôle local uniquement. Il ne constitue pas une preuve de rotation distante tant que les cases de la section 4 ne sont pas validées par les opérateurs habilités.

Aucun secret, ancien ou nouveau, n'est inscrit dans ce document ni dans aucun fichier suivi par Git.
