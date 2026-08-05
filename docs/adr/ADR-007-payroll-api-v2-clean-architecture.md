# ADR-007: Migration de l'API `/api/payroll` vers Clean Architecture V2

- **Statut** : Proposé
- **Date** : 2026-08-05
- **Auteurs** : Équipe Architecture PROGITPAIE
- **Décideurs** : Tech Lead, Responsable Paie, Équipe SecOps

---

## 1. Contexte & Problématique

L'API de gestion des bulletins de paie (`/api/payroll`) repose actuellement sur une architecture V1 "Route → Prisma direct", accumulant de la dette technique et des risques de sécurité :
1. **Couplage Fort** : La logique métier fiscale et l'orchestration des données sont imbriquées directement dans les handlers App Router Next.js (`app/api/payroll/route.ts`).
2. **Failles d'Isolation Multi-Tenant (Corrigées en V1, à pérenniser en V2)** : Certaines routes historiques (`/api/payroll/[id]`, `/api/payroll/my`) n'incluaient pas systématiquement la clause `companyId` sur les requêtes Prisma.
3. **Double Moteur Fiscal** : Coexistence de `lib/payroll-tax.ts` (`calculatePayrollTaxes`) et `lib/domain/payroll/calculator/` (`calculatePayslip`), provoquant de légères divergences potentielles.
4. **Format de Réponse V1 Obsolète** : Présence de champs hérités de MongoDB (`_id`, sous-objets `userId` dénormalisés).

Inspiré du succès de la migration **Provisions V2** (418/418 tests PASS, Gatekeeper pre-removal validé), ce document définit les choix d'architecture pour le module **Payroll V2**.

---

## 2. Facteurs de Décision (Decision Drivers)

- **Parité Financière Stricte (Zéro Divergence)** : Les bulletins générés en V2 doivent correspondre au centime près aux bulletins V1.
- **Sécurité Stricte par Tenant (`companyId`)** : Interdiction totale des requêtes globales sans `companyId` dans la couche infrastructure.
- **Testabilité & Découplage (Clean Architecture)** : Séparation claire entre Domaine, Cas d'Usage, Infrastructure et Présentation.
- **Non-Régression & Rétrocompatibilité** : Maintenance de l'API V1 via un adaptateur avec entêtes HTTP de dépréciation pendant la période de transition.
- **Gestion des Événements & Notifications** : Notification automatique des salariés à la finalisation du bulletin.

---

## 3. Décisions Retenues

### 3.1. Choix du Moteur Fiscal — Encapsulation Paritaire Vague 1
Pour la Vague 1 de migration :
- Le moteur fiscal **`calculatePayrollTaxes()`** (`lib/payroll-tax.ts`) sera encapsulé dans le service domaine `PayrollGenerationService`.
- **Aucune modification des formules de calcul** ne sera réalisée lors de cette migration.
- Toute bascule ultérieure vers `calculatePayslip()` fera l'objet d'un ADR dédié (ADR-008).

### 3.2. Architecture en Couches (Clean Architecture)

```
Next.js API V2 (app/api/v2/payroll/*)
  ├── Authentification requireTenant (companyId obligatoire)
  ├── Validation des entrées par schémas Zod (shared/validation/)
  └── Invocation du Cas d'Usage (lib/application/payroll/use-cases/)
        ↓
Couche Application (lib/application/payroll/)
  ├── Use Cases (GeneratePayroll, ListPayrolls, UpdatePayrollBonuses, FinalizePayroll, ListMyPayrolls)
  ├── DTOs V2 clairs (sans _id)
  └── Ports (Interfaces PayrollRepository, NotificationPort)
        ↓
Couche Domaine (lib/domain/payroll/)
  ├── Agrégat Payroll & Entité PayrollEarning
  ├── Value Objects (PayrollPeriod, PayrollStatus, Money)
  └── Services Domaine (PayrollGenerationService, AttendanceSummary)
        ↓
Couche Infrastructure (lib/infrastructure/repositories/prisma/)
  ├── PrismaPayrollRepository (Borné à 100% par companyId)
  └── PrismaNotificationAdapter
```

### 3.3. Isolation Tenant Obliatoire & Zéro Request Tampering
- Toutes les routes V2 sont protégées par `requireTenant(request, "admin")` (ou `requireTenant(request)` pour `/my`).
- L'identifiant de la société (`companyId`) et l'identifiant de l'utilisateur (`userId`) sont **extraits exclusivement du jeton JWT authentifié et de la DB**, jamais des paramètres de requête ou du corps JSON.

### 3.4. Stratégie de Transition & Dépréciation V1
- L'API V1 sera maintenue sous forme d'adaptateur déléguant ses exécutions aux Use Cases V2.
- Réponses V1 accompagnées des entêtes standards de dépréciation HTTP :
  ```http
  Deprecated: true
  Deprecation: true
  Link: </api/v2/payroll>; rel="successor-version"
  ```
- Un Feature Flag frontend (`NEXT_PUBLIC_PAYROLL_API_VERSION=v2`) permettra une bascule instantanée et réversible.

---

## 4. Conséquences

### Positives
- **Garantie Multi-Tenant Stricte** : Aucune fuite de données possible entre entreprises A et B.
- **Code Testable à 100% sans DB** : Les Use Cases et les entités du Domaine sont testables via des fonctions pures et des mocks en mémoire.
- **Rapprochement Automatisé** : Tests de comparaison automatisés V1 ↔ V2 sur corpus de bulletins signés.

### Négatives / Contraintes
- **Effort de Développement initial** : Estimé à 15–22 jours ouvrés d'implémentation + 7 jours d'observation en production.
- **Maintien Temporaire du Mapper V1** : Nécessite de conserver un `legacy-payroll.mapper.ts` pour projeter la réponse V2 vers le format V1 (`_id`, objet `userId`).

---

## 5. Matrice du Périmètre (Vague 1 vs Vague 2)

| Endpoint V2 | Méthodes | Status Vague 1 | Inclus dans ADR-007 ? |
|---|---|---|---|
| `/api/v2/payroll` | `GET` | Actif | ✅ Oui (ListPayrolls) |
| `/api/v2/payroll` | `POST` | Actif | ✅ Oui (GeneratePayroll) |
| `/api/v2/payroll/[id]` | `PUT` | Actif | ✅ Oui (UpdatePayrollBonuses) |
| `/api/v2/payroll/[id]` | `PATCH` | Actif | ✅ Oui (FinalizePayroll) |
| `/api/v2/payroll/my` | `GET` | Actif | ✅ Oui (ListMyPayrolls) |
| `/api/v2/payroll/[id]` | `DELETE` | Différé | ❌ Non (Prévu Vague 2) |
| `/api/v2/payroll/status` | `PATCH` (PAID/CANCELLED) | Différé | ❌ Non (Prévu Vague 2) |

---

## 6. Prochaines Étapes Opérationnelles

1. **Création du Domaine** : Implémenter `Payroll`, `PayrollEarning`, `PayrollPeriod`, `PayrollGenerationService`.
2. **Ports & Application** : Définir `PayrollRepository`, implémenter les 5 Use Cases.
3. **Infrastructure Prisma** : Écrire `PrismaPayrollRepository` avec filtres `companyId` stricts et tests d'étanchéité.
4. **Contrats & Validation** : Schémas Zod pour entrées/sorties V2.
5. **Routes V2 & Adaptateur V1** : Déployer `/api/v2/payroll/*` et adapter `/api/payroll/*`.
6. **Tests E2E & Rapprochement** : Valider zéro divergence sur bulletins de test.
