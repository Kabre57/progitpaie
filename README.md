# PROGITPAIE — Solution SaaS de Gestion de Paie & RH (V2 Clean Architecture)

PROGITPAIE est une plateforme SaaS moderne de gestion des ressources humaines et de la paie, conçue selon les principes de la **Clean Architecture V2** et conforme au Code du travail et à la fiscalité ivoirienne (CNPS & DGI - Barème ITS/IGR 2024, SYSCOHADA).

---

## 🏗️ Architecture & Technologies

- **Runtime & UI** : Next.js 16 (App Router, React 19, Standalone Output)
- **Langage** : TypeScript 5 (Mode strict)
- **Base de données & ORM** : PostgreSQL 15, Prisma 6.19 (Schéma multi-fichiers modulaire)
- **Gestionnaire de paquets obligatoire** : `pnpm` (pnpm 9+ / 11+)
- **Cache & Sessions** : Redis 7
- **Sécurité** : JWT HttpOnly, chiffrement AES-256-GCM, RBAC, isolation multi-tenant stricte (`companyId`)

---

## 📁 Structure du Projet

```text
app/                         # Next.js App Router (Pages & API REST V2)
app/api/v2/                  # 16 domaines API REST sécurisés et validés par Zod
components/                  # Composants UI React
lib/domain/                  # Entités, Value Objects, règles métier pures (Money, Calculs)
lib/application/             # Cas d'usage, DTOs, interfaces de ports
lib/infrastructure/          # Repositories Prisma, sécurité, passerelles, mappers
prisma/schema/               # Schéma Prisma modulaire (core + 5 modules métier)
prisma/migrations/           # 16 migrations ordonnées
scripts/                     # Scripts de diagnostic et de maintenance
```

---

## ⚡ Commandes Principales

```bash
# 1. Vérification de l'environnement
pnpm verify

# 2. Génération et validation Prisma
pnpm prisma:generate
pnpm prisma:validate

# 3. Qualité et Typecheck
pnpm exec tsc --noEmit
pnpm lint

# 4. Exécution des tests (79 suites, 379 tests)
pnpm test

# 5. Build et Déploiement Local
pnpm build
bash deploy-local.sh
```

---

## 🔒 Sécurité & Isolation Multi-Tenant

Toutes les requêtes de données et d'API sont cloisonnées par `companyId`. Le projet applique une politique de headers de sécurité stricts (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) et dispose d'une suite de tests dédiée à l'isolation inter-entreprises.

