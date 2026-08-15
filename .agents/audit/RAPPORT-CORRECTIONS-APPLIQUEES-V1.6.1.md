# PROGITPAIE — Rapport de corrections appliquées v1.6.1

**Date :** 13 août 2026  
**Répertoire de travail :** `/home/ubuntu/work_progitpaie_fix/progitpaie`  
**Gestionnaire obligatoire :** pnpm 11.21.0  
**Runtime conservé :** Node.js 24.15.0  
**Périmètre :** sécurité E2E/API, typage critique, route publique de paie, dépendances, Excel, Docker et archivage sûr. Les règles fiscales n’ont pas été modifiées.

## 1. Résultat global

Les corrections prioritaires applicables sans validation réglementaire ont été implémentées et validées. La base de tests progresse de **70 suites / 312 tests** à **71 suites / 317 tests**, grâce aux cinq nouveaux tests du middleware d’API publique. Le typage strict, les tests Jest, le build Next.js et le scénario E2E de sécurité ciblé sont réussis.

| Contrôle | Résultat final |
|---|---:|
| `pnpm install --frozen-lockfile --ignore-scripts` | Réussi |
| `pnpm prisma:generate` | Réussi |
| `pnpm exec tsc --noEmit` | Réussi — 0 erreur |
| `pnpm lint` | Réussi — 147 avertissements `any` et 466 avertissements totaux restant hors périmètre critique |
| `pnpm test` | Réussi — 71 suites / 317 tests |
| Playwright `security-multitenant.spec.ts` | Réussi — 8/8 |
| `pnpm build` | Réussi |
| `pnpm audit --prod --registry=https://registry.npmjs.org --json` | Réussi — 0 critique, 0 haute, 0 modérée, 0 faible |

## 2. Corrections de sécurité appliquées

### 2.1 Preuve E2E de clé API invalide

Le scénario **E2E-SEC-08** a été renforcé. Il n’accepte plus `404` ni `503` pour une clé invalide ; il attend désormais explicitement **403** et une réponse JSON `{ success: false }`. L’exécution réelle contre l’application démarrée a réussi.

Un nouveau fichier de tests unitaires, `lib/infrastructure/api-gateway/__tests__/api-middleware.test.ts`, couvre cinq comportements : absence de clé (`401`), clé invalide (`403`), indisponibilité du service (`503`), injection de contexte tenant uniquement après validation, et court-circuit par rate limit (`429`).

### 2.2 Typage des permissions de clé API

`ApiKeyService` ne convertit plus les permissions avec `as any`. Les permissions sont envoyées à Prisma via `Prisma.InputJsonValue`, ce qui conserve la colonne JSON sans désactiver le typage.

### 2.3 Validation et typage des paramètres sensibles

La route `app/api/settings/route.ts` valide maintenant les entrées avec Zod avant toute écriture persistante. Les paramètres généraux sont contraints à une clé non vide et à une valeur JSON ; les structures `company_info` et `location` sont validées avant l’upsert. Les anciens `catch (error: any)` ont été remplacés par `unknown`.

La route d’upload de logo utilise désormais une garde de type MIME explicite au lieu de `mimeType as any`. Les contrôles existants de taille et de signature magique sont préservés.

## 3. Clean Architecture et multi-tenant

La route `app/api/v2/public/payroll/route.ts` n’importe plus Prisma directement. Elle applique désormais la séquence : authentification par clé API, récupération du `companyId` serveur, validation Zod de `month`, `year` et `status`, appel de `ListPayrollsUseCase`, puis réponse HTTP. Le repository `PrismaPayrollRepository` applique le filtre `companyId` dans l’Infrastructure.

Le nombre de routes contenant un import direct de Prisma ou `@/lib/db` passe de **34 à 33**. Cette correction établit un modèle réutilisable pour les autres routes publiques, les exports et les paramètres.

## 4. `any` : corrections ciblées et porte ESLint

Les `any` explicites ont été supprimés du périmètre critique suivant : sécurité, authentification, contexte tenant, API gateway, API publique, paie, déclarations, exports et paramètres. Le comptage de ce périmètre est désormais **0**.

ESLint reste progressivement tolérant sur le reste du dépôt, mais `@typescript-eslint/no-explicit-any` est maintenant une **erreur bloquante** dans les dossiers critiques. Le nombre global d’avertissements `any` est passé de **162 à 147**. Les 147 restants sont à traiter par lots dans les builders PDF, les services généraux, des composants et certains scripts.

## 5. Dépendances et exports Excel

Les versions suivantes ont été mises à jour : Next.js `16.2.11`, `eslint-config-next` `16.2.11` et Nodemailer `9.0.1`. Les overrides pnpm du workspace imposent Sharp `0.35.3`, PostCSS `8.5.26` et UUID `11.1.1` dans l’arbre transitif.

La dépendance `xlsx` ne possède pas de version corrigée publiée sur le registre npm pour les avis identifiés. Les routes de production ont donc été migrées vers **ExcelJS 4.4.0** : modèles de présence et congés, exports de présence et salariés, export comptable V2, imports de présence et congés. Les imports acceptent désormais uniquement `.xlsx`, format produit par les modèles PROGITPAIE ; le format historique `.xls` retourne une erreur contrôlée plutôt que d’exécuter la bibliothèque vulnérable.

`xlsx` est conservé uniquement en dépendance de développement pour quatre scripts d’administration hors runtime. L’audit de production est désormais à zéro vulnérabilité connue. L’audit de développement conserve les deux avis hauts de `xlsx` jusqu’à la migration de :

| Scripts à migrer hors `xlsx` | Priorité |
|---|---:|
| `scripts/generate-emp001-attendance-excel.ts` | P2 |
| `scripts/generate-emp003-attendance-excel.ts` | P2 |
| `scripts/generate-leaves-excel.ts` | P2 |
| `scripts/populate-reference-provisions-2026.ts` | P1, car il manipule un modèle comptable de référence |

## 6. Docker et archivage sûr

Le Dockerfile a été refactoré en image multi-stage autonome. Il installe pnpm 11.21.0 sans npm, npx ou Corepack, installe les dépendances avec `pnpm install --frozen-lockfile`, génère Prisma, compile Next.js et compile les scripts de rotation dans l’image builder. Le runner ne récupère que les artefacts nécessaires.

Le `.dockerignore` exclut `.env`, les dépendances locales, les builds, uploads, archives et rapports. La validation dynamique Docker n’a pas été exécutée dans cet environnement car Docker n’est pas disponible ; une construction `docker compose build --no-cache` et un démarrage `docker compose up` restent obligatoires sur l’environnement de livraison.

Le script `scripts/package-safe.sh`, accessible par `pnpm package:safe`, génère une archive ZIP compatible avec le mode local sans Git. Il exclut secrets et artefacts locaux, puis vérifie qu’aucun vrai `.env` n’est présent. Le test du script a produit une archive sans fichier sensible détecté.

## 7. Écarts non modifiés volontairement

| Écart | Décision | Condition avant correction |
|---|---|---|
| Deux moteurs fiscaux | Non modifié | Comparaison de cas, règle versionnée, sources officielles et validation d’un expert ivoirien. |
| 33 routes Prisma directes | Partiellement réduit | Migration par domaines vers use cases/ports/repositories avec tests tenant. |
| 147 `any` hors zone critique | Réduit mais non nul | Traitement en lots, sans masquer d’erreur par assouplissement ESLint. |
| Tests E2E inter-tenant authentifiés A/B | À enrichir | Fixtures PostgreSQL/Redis dédiées, sessions réelles et données de deux entreprises. |
| `xlsx` dans quatre scripts de développement | Conservé temporairement | Migration des scripts vers ExcelJS, surtout `populate-reference-provisions-2026.ts`. |
| Rotation des secrets d’archives anciennes | Action d’exploitation | Renouvellement réel des secrets si les anciens ZIP ont circulé. |

## 8. Décision de livraison

Le projet corrigé est apte à une **recette technique** : production auditée à zéro vulnérabilité connue, contrôles de sécurité renforcés, builds réussis, tests réussis et livraison ZIP sûre disponible. Il n’est pas encore déclaré conforme fiscalement pour une nouvelle règle de paie tant que l’unification des moteurs et la validation ivoirienne n’ont pas été réalisées.

> Toute mise en production doit être précédée du renouvellement des secrets potentiellement diffusés et d’une validation Docker réelle sur une machine avec Docker, PostgreSQL et Redis.
