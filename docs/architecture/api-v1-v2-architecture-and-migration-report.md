# Cartographie & Rapport d'Architecture API PROGITPAIE (V1 ↔ V2)

- **Date** : 2026-08-05
- **Version Next.js** : 16 (App Router)
- **Portée** : Analyse statique complète des routes d'API, Use Cases, Repositories et schémas Zod.

---

## 1. Vue d'Ensemble & Diagramme d'Architecture Comparatif

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ARCHITECTURE V1 (Historique)                    │
│                                                                             │
│  Navigateur / Client  ──►  Next.js API Route  ──►  Prisma ORM Direct  ──►  DB│
│                             (app/api/*)            (lib/db.ts)              │
└─────────────────────────────────────────────────────────────────────────────┘

                                     VS

┌─────────────────────────────────────────────────────────────────────────────┐
│                             ARCHITECTURE V2 (Clean Architecture)            │
│                                                                             │
│  Client / Admin UI    ──►  V2 API Route (app/api/v2/*)                      │
│                                  │ (Validation Zod & Tenant Context)        │
│                                  ▼                                          │
│                             Use Case Application (lib/application/*)        │
│                                  │                                          │
│                                  ▼                                          │
│                             Domaine / Entités (lib/domain/*)                │
│                                  │                                          │
│                                  ▼                                          │
│                             Repository Infrastructure (lib/infrastructure/*)│
│                                  │                                          │
│                                  ▼                                          │
│                             Prisma ORM / Data Storage                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Inventaire des API V1 (`app/api/*` hors `v2/`)

Les API V1 regroupent à la fois les routes internes du Dashboard (V1 interne) et les routes d'intégration tierces publiques (`app/api/v1/*`).

| Chemin d'API | Méthodes HTTP | Fichier Source | Mode d'Accès Données | Validation Zod | Sécurité & Isolation |
|---|---|---|---|---|---|
| `/api/auth/login` | `POST` | `app/api/auth/login/route.ts` | Prisma direct | `loginSchema` | Public / Rate-Limited |
| `/api/auth/register` | `POST` | `app/api/auth/register/route.ts` | Prisma direct | Interne | Fermé si `userCount > 0` |
| `/api/auth/google` | `POST` | `app/api/auth/google/route.ts` | Prisma direct | Interne | OAuth / Rate-Limited |
| `/api/auth/me` | `GET` | `app/api/auth/me/route.ts` | Prisma direct | Non | `requireAuth` |
| `/api/auth/logout` | `POST` | `app/api/auth/logout/route.ts` | Suppression Cookie | Non | Public |
| `/api/payroll/provisions` *(Legacy)* | `GET` | `app/api/payroll/provisions/route.ts` | **Délégué à V2 (Adaptateur)** | `provisionQuerySchema` | `requireTenant(admin)` |
| `/api/payroll` | `GET`, `POST` | `app/api/payroll/route.ts` | Prisma direct | Non | `requireTenant(admin)` |
| `/api/payroll/my` | `GET` | `app/api/payroll/my/route.ts` | Prisma direct | Non | `requireTenant` |
| `/api/employees` | `GET`, `POST` | `app/api/employees/route.ts` | Prisma direct | Non | `requireTenant(admin)` |
| `/api/employees/[id]` | `GET`, `PUT`, `DELETE` | `app/api/employees/[id]/route.ts` | Prisma direct | Non | `requireTenant(admin)` |
| `/api/attendance` | `GET`, `POST` | `app/api/attendance/route.ts` | Prisma direct | Non | `requireTenant` |
| `/api/attendance/check-in` | `POST` | `app/api/attendance/check-in/route.ts` | Prisma direct | Non | `requireTenant` + Géoloc |
| `/api/attendance/check-out` | `POST` | `app/api/attendance/check-out/route.ts` | Prisma direct | Non | `requireTenant` + Géoloc |
| `/api/leaves/apply` | `POST` | `app/api/leaves/apply/route.ts` | Prisma direct | Non | `requireTenant` |
| `/api/v1/employees` *(Public API)* | `GET` | `app/api/v1/employees/route.ts` | `EmployeeRepository` | Non | `authenticatePublicApi` |
| `/api/v1/payroll` *(Public API)* | `GET` | `app/api/v1/payroll/route.ts` | `PayslipRepository` | Non | `authenticatePublicApi` |
| `/api/companies` | `GET`, `POST` | `app/api/companies/route.ts` | Prisma direct | Non | `requireAdmin` |

---

## 3. Inventaire des API V2 (`app/api/v2/*`)

Les API V2 appliquent la **Clean Architecture** stricte (Domain Driven Design).

| Chemin V2 | Méthodes | Fichier Route | Use Case App (`lib/application/`) | Domaine (`lib/domain/`) | Repository | DTO & Zod Schema |
|---|---|---|---|---|---|---|
| `/api/v2/payroll/provisions` | `GET` | `app/api/v2/payroll/provisions/route.ts` | `GetPayrollProvisions` | `ProvisionsCalculator` | `ProvisionLedgerRepository` | `provisionV2QuerySchema` / `mapProvisionResultToV2DTO` |

---

## 4. Matrice de Correspondance & État de la Migration V1 ↔ V2

| Périmètre Fonctionnel | API V1 (Legacy) | API V2 (Clean Arch) | Statut de la Migration | Adaptateur de Compatibilité |
|---|---|---|---|---|
| **Provisions Congés & Licenciement** | `/api/payroll/provisions` | `/api/v2/payroll/provisions` | 🟡 **Phase d'Observation 7j (V2 Déployée)** | ✅ Adaptateur actif dans `/api/payroll/provisions` avec `Deprecation` header |
| **Gestion de la Paie & Bulletins** | `/api/payroll` | En préparation | 🔴 V1 active en production | Non |
| **Gestion des Salariés** | `/api/employees` | En préparation | 🔴 V1 active (`EmployeeRepository` partiel sur V1 public) | Non |
| **Pointage & Géolocalisation** | `/api/attendance/*` | En préparation | 🔴 V1 active en production | Non |
| **Gestion des Congés** | `/api/leaves/*` | En préparation | 🔴 V1 active en production | Non |

---

## 5. Synthèse & Prochaines Étapes de Migration

1. **API Provisions** : La migration est au stade final. V2 est l'API cible principale. L'API V1 sert d'adaptateur temporaire pendant la fenêtre d'observation de 168h.
2. **Standardisation Clean Architecture** : La structure `lib/application/` et `lib/domain/` servira de modèle pour migrer les routes Paie et Salariés vers V2.
