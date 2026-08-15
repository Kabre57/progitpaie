# PROGITPAIE — Plan de correction post-P0 v1.6.1

**Version :** 1.0.0  
**Date :** 13 août 2026  
**Base de référence :** `RAPPORT-VALIDATION-CORRECTIONS-P0-V1.6.1.md`  
**Objectif :** terminer les remédiations de sécurité, de conformité fiscale, de qualité et de déploiement sans dégrader les validations déjà reproduites.

## 1. État de départ validé

Les corrections de code P0 suivantes sont déjà présentes et validées dans l’archive contrôlée : `deploy-local.sh` ne contient plus de mot de passe PostgreSQL codé en dur ni de `db push --accept-data-loss`, `prisma/scripts/deploy.ts` utilise `pnpm exec prisma migrate deploy`, et E2E-SEC-08 utilise désormais la méthode HTTP `GET` correcte avec une gestion défensive des erreurs de clé API.

La ligne de base à préserver est la suivante :

| Contrôle | État validé |
|---|---:|
| Génération Prisma | Réussie |
| TypeScript strict | 0 erreur |
| Tests Jest | 70 suites, 312 tests réussis |
| Scénario Playwright ciblé | 8 scénarios sur 8 réussis |
| Build Next.js | Réussi |
| Gestionnaire de paquets | pnpm 11.21.0 uniquement |

Les écarts ouverts sont néanmoins importants : `.env` reste inclus dans le ZIP, 18 vulnérabilités hautes sont présentes dans l’audit de production, 162 avertissements ESLint `any` sont recensés, 34 routes importent directement Prisma ou `@/lib/db`, le Dockerfile dépend d’artefacts locaux, et deux moteurs fiscaux coexistent.

> **Règle de pilotage :** aucun lot ne peut réduire la sécurité ou la reproductibilité pour améliorer artificiellement un indicateur. Les corrections sont validées par comportement, tests négatifs, revue de tenant et scripts exécutables avec `pnpm` exclusivement.

## 2. Séquencement obligatoire

| Ordre | Lot | Niveau | Raison de l’ordre |
|---:|---|---|---|
| 0 | Sécuriser les secrets et les archives | Porte de production | La divulgation d’un `.env` est un risque opérationnel indépendant du code. |
| 1 | Mettre à jour les dépendances vulnérables | P0 sécurité | L’audit officiel signale 18 vulnérabilités hautes. |
| 2 | Durcir la preuve E2E d’authentification et d’isolation | P0 sécurité | Les 8 E2E actuels refusent des requêtes, mais ne prouvent pas encore les flux authentifiés A/B. |
| 3 | Rendre Docker et les migrations reproductibles | P0 déploiement | L’image actuelle dépend de `node_modules` et d’artefacts locaux. |
| 4 | Éliminer les `any` critiques et rendre le lint bloquant | P1 qualité/sécurité | Les erreurs typées masquées dans les routes et services sensibles peuvent devenir des failles. |
| 5 | Migrer les routes Prisma directes par lots | P1 architecture | La Clean Architecture et le multi-tenant ne sont pas encore appliqués uniformément. |
| 6 | Unifier le moteur fiscal avec validation métier | P0 conformité métier | Les bulletins réels et simulations ne doivent pas suivre des régimes différents. |
| 7 | Industrialiser CI, recette, gouvernance et archivage | P2 durabilité | Évite la réapparition des écarts dans les versions suivantes. |

Les lots 1, 2 et 3 peuvent être préparés en parallèle, mais leur validation de déploiement doit rester séquentielle. Le lot 6 ne doit pas être exécuté en parallèle avec une finalisation de paie réelle : les règles fiscales sont versionnées et exigent une validation locale formelle.

## 3. Lot 0 — Secrets, archives et hygiène de diffusion

### Résultat attendu

Les secrets potentiellement exposés sont renouvelés, les archives distribuables ne contiennent aucun `.env`, aucun rapport ne reprend de valeur secrète, et les scripts ne contiennent ni mot de passe ni chaîne de connexion réelle.

| Action | Implémentation attendue | Critère de sortie |
|---|---|---|
| Renouveler les secrets | Renouveler `JWT_SECRET`, `ENCRYPTION_KEY`, mots de passe PostgreSQL/Redis et clés API qui auraient été présents dans un ZIP transmis. Invalider les sessions et clés API dépendantes si nécessaire. | Les anciennes valeurs ne donnent plus accès aux environnements. |
| Exclure `.env` des archives | Créer `scripts/package-safe.sh` utilisant `zip` avec exclusions explicites : `.env`, `.env.*` hors exemples, `node_modules`, `.next`, `.build`, `uploads`, rapports Playwright, traces et fichiers temporaires. | Une inspection `unzip -Z1` ne retourne aucun fichier `.env` réel. |
| Préserver les modèles | Conserver seulement `.env.example` et `.env.production.example` sans secret réel. Valider leur structure avec Zod. | Un nouvel environnement peut être configuré sans copier une valeur sensible. |
| Ajouter un contrôle CI | Rechercher les noms et motifs de secrets dans le diff et dans l’archive finale, sans imprimer les valeurs. | Le pipeline échoue si un `.env` réel ou une valeur de secret est détecté. |

Le renouvellement est une **action d’exploitation**, non une simple modification de code. Il doit être documenté dans un registre restreint indiquant la date, le responsable et les dépendances révoquées, sans stocker les valeurs.

## 4. Lot 1 — Dépendances de production vulnérables

### Résultat attendu

L’audit officiel de production ne contient plus de vulnérabilité haute non acceptée. L’audit actuellement reproductible est :

```bash
pnpm audit --prod --registry=https://registry.npmjs.org --json
```

| Sous-lot | Action | Vérifications obligatoires |
|---|---|---|
| 1.1 | Créer une branche de remédiation et capturer le rapport d’audit initial. | Conserver un résumé de sévérité et les versions installées, sans modifier le lockfile à la main. |
| 1.2 | Mettre à jour les dépendances directes vulnérables en respectant les seuils corrigés : Next >= 16.2.11, xlsx >= 0.20.2, nodemailer >= 9.0.1, sharp >= 0.35.0, et PostCSS >= 8.5.23 lorsqu’il est résolu dans l’arbre. | Utiliser `pnpm up`, puis vérifier `pnpm-lock.yaml`. Toute incompatibilité majeure est isolée dans un sous-lot dédié. |
| 1.3 | Analyser les changements de rupture : API Next, middleware/proxy, `xlsx` et envoi de courriels. | Ajouter ou adapter les tests de contrat de chaque intégration touchée. |
| 1.4 | Rejouer toutes les validations techniques. | `pnpm prisma:generate`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, E2E, build et audit officiel. |

Aucune mise à jour ne doit être considérée comme achevée sur la seule base de `pnpm install`. Le comportement de paie, de PDF, d’export Excel, d’authentification et de courriel doit être retesté après tout changement de dépendance majeure.

## 5. Lot 2 — E2E de sécurité et isolation multi-tenant réelles

### Résultat attendu

Les E2E ne testent plus seulement des requêtes anonymes. Elles prouvent que les autorisations sont appliquées côté serveur avec de vraies identités, de vraies entreprises et des ressources distinctes.

### 5.1 Durcir E2E-SEC-08

Le correctif de méthode et de middleware est validé, mais l’assertion suivante est temporairement trop large :

```ts
expect([401, 403, 404, 503]).toContain(res.status());
```

La CI doit démarrer le code courant et une base déterministe. Lorsque cette condition est remplie, remplacer l’assertion par deux cas explicites :

| Cas | Précondition | Statut attendu |
|---|---|---:|
| Clé absente | API gateway disponible | 401 |
| Clé invalide ou révoquée | Base disponible | 403 |
| Service d’authentification indisponible | Panne explicitement simulée | 503 |

Le statut `404` ne doit plus être accepté dans ce test lorsque la route existe.

### 5.2 Matrice de sécurité à ajouter

| Référence | Acteur réel | Action | Résultat attendu |
|---|---|---|---|
| SEC-AUTH-01 | Visiteur | Lire une paie | 401 |
| SEC-RBAC-01 | Collaborateur A | Générer/finaliser une paie | 403 |
| SEC-TENANT-01 | Admin A authentifié | Lire/modifier un salarié B | 403 ou 404 contrôlé sans fuite de données |
| SEC-TENANT-02 | Admin A authentifié | Exporter un bulletin B | 403 ou 404 contrôlé sans fichier ni métadonnée |
| SEC-SUPER-01 | Admin d’entreprise | Accéder à une route Super-admin | 403 |
| SEC-DEMO-01 | Tenant démo expiré | Action de paie | 403 avec code métier explicite |
| SEC-API-01 | Clé API invalide | Lire une API publique | 403 |
| SEC-UPLOAD-01 | Admin authentifié | Envoyer un MIME interdit | 415/422 sans écriture de fichier |

Chaque fixture crée au minimum deux `companyId`, deux utilisateurs administrateurs, deux salariés et deux bulletins. Les identifiants proviennent de la base de test ; aucun test ne simule un droit en envoyant `x-user-role` ou `x-company-id` comme preuve d’autorisation.

## 6. Lot 3 — Docker autonome et migrations reproductibles

### Résultat attendu

Un développeur ou un serveur CI peut construire l’image depuis une archive fraîche, sans `node_modules`, `.next` ou `.build` préexistants, puis appliquer des migrations versionnées qui arrêtent le déploiement en cas d’échec.

| Action | Décision technique | Critère de sortie |
|---|---|---|
| Refactorer le Dockerfile | Mettre en place un builder qui installe pnpm de façon explicite et vérifiable, copie `package.json` + `pnpm-lock.yaml`, exécute `pnpm install --frozen-lockfile`, génère Prisma, compile Next et compile la rotation. | `docker compose build --no-cache` réussit depuis un répertoire sans artefacts. |
| Réduire l’image runner | Copier uniquement le standalone Next, `.next/static`, les fichiers Prisma nécessaires et les artefacts de rotation depuis le builder. | L’image ne contient pas les sources et dépendances de développement inutiles. |
| Isoler la migration | Faire exécuter `pnpm exec prisma migrate deploy --schema=prisma/schema` par un service de migration avant le démarrage de l’application. | Une migration invalide bloque l’application, sans `db push` ni `--accept-data-loss`. |
| Tester le rollback | Définir la procédure : sauvegarde, déploiement, healthcheck, rollback application ; les migrations destructives exigent une procédure de restauration testée. | Un exercice de rollback est documenté et rejoué sur staging. |
| Préserver Node et pnpm | Conserver Node 24.15.0 et pnpm 11.21.0, conformément aux règles du projet. | Les versions sont vérifiées dans le build et documentées. |

Le script `deploy-local.sh` reste un orchestrateur local. Il ne doit pas devenir la seule preuve du déploiement : le Compose versionné et la construction propre de l’image doivent être testés dans CI/staging.

## 7. Lot 4 — Éradication contrôlée des `any`

### Résultat attendu

Les `any` sont retirés d’abord des zones de sécurité et de calcul, puis de l’ensemble du projet. ESLint devient progressivement bloquant pour éviter toute régression.

| Vague | Périmètre | Corrections typiques | Critère de sortie |
|---|---|---|---|
| 4.1 | Sécurité, auth, API gateway, middleware, tenant context | `catch (error: unknown)`, Zod aux frontières, types de claims JWT et clés API. | Zéro `any` explicite dans ces dossiers ; lint configuré en `error` sur le périmètre. |
| 4.2 | Paie, déclarations, Money, PDF, exports | Contrats de bulletin, types jsPDF/AutoTable, DTO de déclaration et unions métier. | Zéro `any` dans calculs, génération de documents et exports. |
| 4.3 | Application et infrastructure | Types Prisma mappés aux DTO/domain, transactions typées, `JsonValue` validé. | Zéro `any` dans use cases et repositories. |
| 4.4 | Routes et composants | Schémas Zod, paramètres de route, réponses HTTP et hooks typés. | Zéro `any` applicatif ; suppressions de casts inutiles. |

La règle `@typescript-eslint/no-explicit-any` doit évoluer en deux étapes : `error` pour les dossiers critiques au début du lot, puis `error` global dès que la dette est résorbée. Une exception temporaire ne peut être tolérée qu’avec un commentaire justifié, une tâche liée et une date d’expiration.

## 8. Lot 5 — Clean Architecture et 34 routes Prisma directes

### Résultat attendu

Les routes deviennent des adaptateurs HTTP minces : elles authentifient, résolvent le tenant, valident par Zod, composent les dépendances et appellent un use case. Prisma reste confiné aux repositories Infrastructure.

| Ordre de migration | Familles de routes | Motif |
|---:|---|---|
| 5.1 | API publiques, clés API, exports, documents et uploads | Surface d’exposition et risque de fuite élevés. |
| 5.2 | Paie, déclarations, virements, comptabilité | Sensibilité financière et réglementaire. |
| 5.3 | Paramètres, entreprises, super-administration, audit | Risque de privilège et de franchissement de tenant. |
| 5.4 | RH, congés, présences, contrats, heures supplémentaires | Cohérence fonctionnelle et workflows. |

Pour chaque route, appliquer le même protocole : inventorier les entrées/sorties, créer ou réutiliser un DTO validé, définir le port applicatif, créer ou adapter le repository Prisma tenant-aware, remplacer la logique inline, ajouter les tests autorisé/refusé/autre tenant/entrée invalide, puis documenter la migration dans une matrice.

La matrice de suivi doit contenir : route, méthode HTTP, permission/rôle, origine du `companyId`, schema Zod, use case, port, repository, tests positifs/négatifs et état de migration. Une route ne peut être marquée « migrée » si elle conserve un import direct de `@/lib/db`, `@/lib/prisma` ou `PrismaClient` pour sa logique métier.

## 9. Lot 6 — Unification fiscale sous contrôle réglementaire

### Résultat attendu

Les simulations et la génération de bulletins suivent le même régime fiscal versionné, sans réécrire l’historique des bulletins finalisés.

La Direction générale du Trésor ivoirien indique que l’ordonnance n° 2023-719, applicable au 1er janvier 2024, fusionne les prélèvements salariaux IS, CN et IGR en un prélèvement unique, avec progressivité par tranches et réduction pour charges de famille. [1]

| Action | Décision obligatoire | Critère de sortie |
|---|---|---|
| Geler les comportements historiques | Ne jamais recalculer ou modifier un bulletin déjà finalisé sans procédure d’annulation/versionnement. | Les bulletins historiques restent auditables avec leurs règles d’origine. |
| Créer un jeu de règles versionné | Introduire une version explicite, par exemple `CI-ITS-2024`, avec source, date d’effet, taux, plafond, réduction, approbateur et statut. | Chaque bulletin enregistre la version de règles utilisée dans son snapshot. |
| Comparer les moteurs | Établir une matrice de salaires, parts familiales, primes, absences, plafonds et arrondis ; comparer `calculatePayrollTaxes()` et `calculatePayslip()`/`calculateITS2024()`. | Écarts chiffrés, expliqués et approuvés pour chaque cas. |
| Adapter le service réel | Migrer `PayrollGenerationService` vers le moteur validé ou créer un adaptateur unique, sans conserver deux sources de vérité. | Simulations, bulletins, PDF, exports, déclarations et calcul inverse produisent des résultats cohérents. |
| Valider localement | Faire valider règles, taux, plafonds, déclarations et échéances par un expert paie/fiscalité ivoirien. | Attestation de validation et date de prochaine revue réglementaire. |

> Cette migration est un changement de conformité, non un simple refactor. Elle ne doit pas être activée par défaut tant que les jeux de tests, les sources, les snapshots et la validation métier ne sont pas complets.

## 10. Lot 7 — CI, recette et gouvernance de qualité

### Résultat attendu

Chaque correction est vérifiée automatiquement et les éléments manuels sont traçables.

| Porte de qualité | Commande / contrôle | Seuil de réussite |
|---|---|---|
| Dépendances | `pnpm install --frozen-lockfile` | Lockfile cohérent ; aucun gestionnaire concurrent. |
| Génération | `pnpm prisma:generate` | Client Prisma généré. |
| Typage | `pnpm exec tsc --noEmit` | 0 erreur. |
| Qualité | `pnpm lint` | 0 erreur ; puis 0 avertissement après résorption de dette. |
| Unitaire/intégration | `pnpm test` | 70/70 préservés et nouveaux tests ajoutés. |
| E2E | `pnpm exec playwright test tests/e2e/security-multitenant.spec.ts` | Tous les cas authentifiés et inter-tenant réussissent. |
| Build | `pnpm build` | Compilation standalone réussie. |
| Dépendances | `pnpm audit --prod --registry=https://registry.npmjs.org --json` | Aucune vulnérabilité haute non acceptée. |
| Docker | Build propre et Compose isolé | Image autonome, migrations versionnées, healthcheck sain. |

Le registre de décision doit documenter chaque exception temporaire : vulnérabilité non corrigeable, `any` justifié, règle fiscale non encore activée ou migration reportée. Chaque entrée comporte un responsable, une justification, une date d’expiration et un test ou contrôle compensatoire.

## 11. Définition de terminé

La version post-correction peut être considérée prête pour une recette de production seulement si les conditions suivantes sont réunies :

1. les secrets inclus dans les anciennes archives sont renouvelés et les nouvelles archives excluent `.env` ;
2. l’audit officiel ne contient plus de vulnérabilité haute non acceptée ;
3. E2E-SEC-08 n’accepte plus `404` sur le code courant, et les tests A/B authentifiés prouvent l’isolation multi-tenant ;
4. l’image Docker se construit sans artefact local et les migrations versionnées bloquent en cas d’erreur ;
5. les `any` sont absents des zones critiques et ESLint les bloque ;
6. chaque route à risque est migrée ou explicitement inscrite dans la matrice de migration avec contrôle compensatoire ;
7. un seul moteur fiscal versionné alimente les nouvelles paies, avec validation ivoirienne documentée ;
8. toutes les portes qualité sont vertes avec pnpm uniquement.

## Référence

[1]: https://tresor.gouv.ci/tres/traitements-salaires-pensions-et-rentes-viageres-voici-ce-qui-attend-travailleurs-et-retraites-a-partir-du-1er-janvier-2024/ "Direction générale du Trésor et de la Comptabilité publique — Réforme des impôts sur les traitements et salaires, 31 octobre 2023"
