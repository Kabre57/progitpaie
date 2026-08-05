# PROGITPAIE — Solution de Gestion de Paie & RH en Côte d'Ivoire (V2 Clean Architecture)

PROGITPAIE est une plateforme Saas moderne de gestion de la paie et des ressources humaines, conforme à la législation du Code du travail et du système fiscal/social ivoirien (CNPS & DGI - SYSCOHADA).

## 🚀 Architecture V2 (Clean Architecture & DDD)

L'application repose sur une architecture hexagonale stricte :
- **Domaine** (`lib/domain/`) : Règlements de paie, calculettes de cotisations, gestion des indemnités, congés, prêts et contrats.
- **Application** (`lib/application/`) : Cas d'usage isolés, ports de repositories et DTOs.
- **Infrastructure** (`lib/infrastructure/`) : Repositories Prisma isolés à 100% par `companyId`, génération PDF & exports.
- **API V2** (`app/api/v2/`) : Endpoints HTTP REST sécurisés et validés par Zod.

## 🧪 Tests & Qualité
- **Tests unitaires & d'intégration** : `npm test` (60/60 test suites PASS, 269 tests)
- **Vérification TypeScript** : `npx tsc --noEmit` (0 erreur)
- **Qualification E2E** : Playwright (`tests/e2e/`)

## 🛠️ Déploiement
- **Stack** : Next.js App Router, Prisma ORM, PostgreSQL, Redis, Docker Compose.
- **Documentation OpenAPI** : Retrouvez la spécification V2 dans [`docs/api/openapi-v2-complete.yaml`](file:///home/hp/Documents/Projet/progitpaie/docs/api/openapi-v2-complete.yaml).
