# Procès-verbal de sécurisation des identifiants — Phase 1 (Réalisé)

- **Environnement concerné** : Développement local, codebase & dépôt Git réécrit
- **Rôle PostgreSQL concerné** : `progitpaie`
- **Date des contrôles et réécritures** : 2026-08-04T18:01Z
- **Opérateur** : Assistant Antigravity & Équipe Sécurité
- **Référence au gestionnaire de secrets** : Variables d'environnement système `/etc/progitpaie/production.env` (permissions 600)

---

## 1. Actions réalisées et certifiées

1. **Suppression des fallbacks dans le code et Compose** :
   - Neutralisation des fallbacks dans `docker-compose.yml`, `scripts/populate-reference-provisions-2026.py`, et `scripts/export-val26-pg.ts`.
   - Exigence stricte d'injection de `DATABASE_URL`, `DB_PASSWORD` et `JWT_SECRET`.
2. **Purge Git intégrale du fichier `.env`** :
   - Exécution de `git-filter-repo --path .env --invert-paths`.
   - Contrôle d'absence absolue de blobs `.env` dans l'historique local (`git rev-list` $\rightarrow$ 0 objet, `git log` $\rightarrow$ 0 commit).
3. **Mise en place du Chiffrement Multi-Clé (Sprint ENCRYPTION_KEY)** :
   - Refactorisation de `lib/crypto.ts` pour supporter la chaîne de clés `ENCRYPTION_KEY`, `ENCRYPTION_KEY_PREVIOUS` et `ENCRYPTION_KEYS`.
   - Déchiffrement à repli automatique (fallback sur la clé précédente si la clé primaire échoue).
   - Ajout des tests unitaires `lib/__tests__/crypto-multi-key.test.ts` (100% passés).
   - Création du script de migration transactionnelle `scripts/rotate-encryption-key.ts`.

---

## 2. Synthèse de l'audit de sécurité Git (2026-08-04T18:01Z)

| Contrôle | Résultat | Statut |
| :--- | :---: | :---: |
| `.env` dans l'index Git | Absent (code 1) | ✅ PASS |
| Objets/Blobs `.env` dans l'historique réécrit | **0 blob** | ✅ PERFECT |
| Commits référençant `.env` dans l'historique | **0 commit** | ✅ PERFECT |
| Multi-clé `ENCRYPTION_KEY` | Opérationnel et testé (218 tests OK) | ✅ PASS |
| Migration transactionnelle disponible | Script `scripts/rotate-encryption-key.ts` | ✅ PASS |

---

## 3. Guide d'exécution pour le déploiement distant (DevOps & Tech Leader)

### Step 1: Push de l'historique purgé (Tech Leader)
```bash
# Exécuter après notification de l'équipe :
git push --force origin main
```
*Tous les développeurs doivent alors ré-effectuer un clone propre :*
```bash
git clone https://github.com/Kabre57/progitpaie.git
```

### Step 2: Rotation distante (DevOps)
1. Sauvegarder PostgreSQL selon la procédure d'exploitation avant toute écriture.
2. Préparer hors des commandes et des logs une nouvelle `ENCRYPTION_KEY`, en conservant l'ancienne comme `ENCRYPTION_KEY_PREVIOUS`.
3. Mettre à jour `/etc/progitpaie/production.env` avec les valeurs de production, sans les afficher dans le terminal.
4. Reconstruire et démarrer la stack. Le service `migrate` applique les migrations Prisma avant d'autoriser le démarrage de `app` :
   `docker compose --env-file /etc/progitpaie/production.env up -d --build`
5. Vérifier que le service `migrate` est terminé avec le code 0 avant toute rotation :
   `docker compose --env-file /etc/progitpaie/production.env ps -a migrate`
6. Exécuter d'abord le contrôle sans écriture :
   `docker compose --env-file /etc/progitpaie/production.env exec -T app node /app/scripts/rotate-encryption-key.js --dry-run`
7. Si le contrôle est conforme, exécuter la rotation transactionnelle :
   `docker compose --env-file /etc/progitpaie/production.env exec -T app node /app/scripts/rotate-encryption-key.js`
8. Contrôler la santé applicative sans exposer la configuration :
   `curl --fail --silent http://127.0.0.1:3500/api/health`
9. Après la période d'observation, retirer `ENCRYPTION_KEY_PREVIOUS`, recréer l'application et relancer le contrôle à blanc.

---

## 4. Statut d'intégrité du projet

- **Compilation TypeScript** : `npx tsc --noEmit` $\rightarrow$ 0 erreur
- **Tests unitaires** : `npm test` $\rightarrow$ **219 / 219 tests PASS (30/30 suites)**
- **Audit de secret Git** : 0 blob `.env` présent

## 5. Journal d'exécution VPS — 2026-08-05

- Les prérequis distants ont été contrôlés : SSH, `/etc/progitpaie/production.env`, conteneurs PostgreSQL/Redis/application et endpoint `/api/health` étaient disponibles.
- La copie du script dans `/app/scripts` a réussi, mais son exécution a échoué avec `MODULE_NOT_FOUND` pour `../lib/db`.
- Cause : l'image standalone ne contenait ni l'artefact compilé du script ni les modules source attendus par le script TypeScript isolé ; `npx tsx` n'était donc pas une procédure de production fiable.
- Correctif ajouté dans le code : compilation du script pendant le build Docker, exécution native par `node`, injection explicite des variables de chiffrement dans Compose, et mise à jour atomique sans logs de nom ou d'e-mail.
- Après déploiement de ce correctif, l'image a démarré mais la rotation a atteint une base sans table `public.users`. Aucun enregistrement n'a été modifié.
- Cause : les migrations Prisma n'étaient pas exécutées par Compose avant le démarrage de l'application. Un service `migrate` bloquant applique désormais `prisma migrate deploy` avant `app`.
- Nouveau déploiement VPS confirmé : `progitpaie-migrate-1` s'est terminé avant le démarrage de `progitpaie-app`, ce qui valide la condition `service_completed_successfully` et l'application des migrations.
- La preuve fournie ne contient pas encore de `--dry-run` ni d'exécution de la rotation : aucune rotation de `ENCRYPTION_KEY` n'est déclarée comme réalisée.
- Contrôle à blanc VPS confirmé : `Starting ENCRYPTION_KEY rotation (dry run)`, puis `Found 0 users; 0 records and 0 fields require rotation.` Aucun changement n'a été écrit.
- Ce résultat doit être interprété comme une base actuellement vide, pas comme une preuve de ré-encryption. Si des employés sont censés exister, l'opération doit s'arrêter pour vérifier la cible `DATABASE_URL` et l'état de la base avant toute nouvelle action.
- Nouveau contrôle à blanc VPS : `Found 1 users; 0 records and 0 fields require rotation.` Aucun changement n'a été écrit ; ce résultat signifie seulement qu'aucun champ non vide ne nécessite actuellement de rotation selon la clé primaire configurée.
- Ce résultat ne prouve pas que les champs sensibles sont présents et correctement chiffrés. Si l'utilisateur doit posséder des données sensibles, leur présence et leur état doivent être validés via un contrôle métier sans afficher les valeurs.
- Validation métier communiquée par l'opérateur : l'utilisateur concerné ne possède pas de données sensibles à migrer. Le résultat à zéro champ est donc attendu.
- Exécution finale VPS confirmée : `Found 1 users; 0 records and 0 fields require rotation. Rotation completed.` La rotation `ENCRYPTION_KEY` est donc clôturée sans ré-encryption effective ni modification de donnée.
- Health check VPS confirmé à `2026-08-05T01:37:42.696Z` : `status=healthy`, base `up`, latence base `23ms`, sans secret exposé.
- **Statut distant : ROTATION ENCRYPTION_KEY CLÔTURÉE (NO-OP).** Cette clôture ne valide pas les autres secrets ni les conditions du gatekeeper Phase E ; le plan continue avec le déploiement V2, les E2E production, l'observation réelle de 168 heures, le rollback staging et la validation pre-removal 13/13.

## 6. Fixtures de test et suite du plan Phase E

- `prisma/seed.ts` et `scripts/seed-111-employees.ts` ont été examinés mais ne doivent pas être exécutés sur le VPS de production pour fabriquer des données de rotation ou des preuves.
- Le seed de 111 salariés génère des données personnelles, bancaires et CNPS fictives ainsi qu'un secret de test commun ; il est réservé à une base isolée de développement ou de staging explicitement identifiée.
- Si les E2E V2 nécessitent des salariés, les exécuter sur cette base isolée et qualifier les preuves comme `staging`, sans les mélanger aux preuves production.
- Le plan production continue avec l'artefact V2 réel, les contrôles E2E autorisés, l'observation de 168 heures, le rollback staging et le gatekeeper pre-removal `13/13`.
- Observation production démarrée le `2026-08-05T01:58:11Z` sur le commit distant courant ; les métadonnées et le corpus de logs sont conservés sous `observation-20260805T015811Z/` avec permissions restreintes.
- Cette observation est en cours et ne constitue pas encore une preuve de 168 heures, de zéro appel legacy ou de réussite du gatekeeper.
