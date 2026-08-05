# Architecture Technique V2 — PROGITPAIE (Clean Architecture & DDD)

## 📌 Introduction & Principes
Le système PROGITPAIE adopte l'architecture hexagonale (Clean Architecture) combinée au Domain-Driven Design (DDD) pour l'ensemble des 10 modules applicatifs Paie et RH.

```
       ┌───────────────────────────────────────────────────────────┐
       │                  Présentation / Handlers                  │
       │                   (app/api/v2/[module])                   │
       └─────────────────────────────┬─────────────────────────────┘
                                     │
       ┌─────────────────────────────▼─────────────────────────────┐
       │                Application / Use Cases                    │
       │                 (lib/application/[module])                │
       └─────────────────────────────┬─────────────────────────────┘
                                     │
       ┌─────────────────────────────▼─────────────────────────────┐
       │               Domaine Pure (Agrégats & VO)                │
       │                   (lib/domain/[module])                   │
       └─────────────────────────────▲─────────────────────────────┘
                                     │
       ┌─────────────────────────────┴─────────────────────────────┐
       │              Infrastructure / Repositories                │
       │          (lib/infrastructure/repositories/prisma)         │
       └───────────────────────────────────────────────────────────┘
```

---

## 🏛️ Les 4 Couches Principales

### 1. Domaine (`lib/domain/`)
- **Indépendance Totale** : 0 dépendance vers Prisma, React ou Next.js. TypeScript pur.
- **Règles Métiers Uniques** :
  - Calculettes de paie (Brut, Imposable, CNPS 6.3%/7.7%, ITS, IGR, FDFP 1.2%/0.6%).
  - Calculettes de provisions de congés payés & gratifications (Phase B).
  - Statuts et workflows d'approbation d'heures supplémentaires, congés et prêts.
  - Calculs de fin d'essai, préavis et indemnités légales de solde de tout compte.

### 2. Application (`lib/application/`)
- **Use Cases Atomiques** : Orchestrent la logique applicative (ex: `CalculatePayrollUseCase`, `CheckInUseCase`).
- **Interfaces de Ports (Repositories)** : Définissent les contrats d'accès aux données.
- **DTOs & Mappers** : Isolent les structures de réponse JSON.

### 3. Infrastructure (`lib/infrastructure/`)
- **Repositories Prisma Bounded** : 100% sécurisés par `companyId`.
- **Intégration PDF & Export** : Génération asynchrone des bulletins et déclarations.

### 4. Présentation (`app/api/v2/`)
- Handlers Next.js App Router V2.
- Authentification & Multi-tenant via `requireTenant`.
- Validation d'entrée stricte via Zod (`shared/validation/`).

---

## 🔒 Isolation Multi-Tenant (Tenant Context)

Chaque requête passant par la v2 utilise `requireTenant(request)` qui extrait l'organisation authentifiée (`companyId`) depuis le token JWT signé. Toutes les requêtes en base de données sont obligatoirement bornées par `{ companyId }`.
