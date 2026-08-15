# AGENTS.md — Règles des agents IA de PROGITPAIE

**Version : 1.0.0**  
**Projet : PROGITPAIE**  
**Statut : règles obligatoires pour toute intervention d’agent IA**  
**Gestionnaire de paquets obligatoire : pnpm 11.21.0**

## 1. Mission et périmètre

PROGITPAIE est une application SaaS de gestion des ressources humaines et de la paie. Toute modification proposée ou réalisée par un agent doit préserver la confidentialité des données RH, l’isolation stricte entre entreprises, la traçabilité des opérations et la fiabilité des calculs réglementaires.

> Une fonctionnalité n’est considérée comme terminée que lorsqu’elle est correctement architecturée, validée, testée, sécurisée, documentée et compatible avec les contrats existants.

L’agent doit d’abord comprendre le contexte du dépôt, rechercher les implémentations existantes et réutiliser les abstractions en place. Il ne doit pas introduire une seconde manière de résoudre un problème déjà traité par le projet.

## 2. Stack technique et architecture

| Domaine | Choix du projet |
|---|---|
| Runtime et UI | Next.js 16.2.1, App Router, React 19 |
| Langage | TypeScript 5 en mode strict |
| Données | PostgreSQL avec Prisma 6.19 |
| État serveur | TanStack Query v5 |
| Validation | Zod 4 |
| Tests | Jest 30, Testing Library, Playwright |
| Architecture | Clean Architecture V2 |
| Sécurité et intégrations | Authentification, RBAC, chiffrement, Redis, API gateway |

La structure principale observée est la suivante :

```text
app/                         # Next.js App Router, pages et routes HTTP
app/api/v2/                  # contrats HTTP versionnés
components/                  # composants React et composants UI
lib/domain/                  # entités, value objects, règles métier pures
lib/application/             # cas d’utilisation, DTO, ports et mappers
lib/infrastructure/          # Prisma, repositories, services externes, gateway
lib/presentation/            # adaptateurs de présentation lorsqu’ils existent
lib/hooks/                   # hooks client et intégration TanStack Query
lib/client/                  # clients HTTP côté navigateur
lib/database/                # contexte tenant, extensions et middleware Prisma
lib/domain/payroll/money.ts  # service/value object Money pour les montants
prisma/                      # schéma, migrations et seed
scripts/                     # scripts de maintenance ou de validation explicites
e2e/                         # scénarios Playwright
```

Les chemins `@/` sont autorisés et doivent être préférés aux chemins relatifs profonds. Les noms réels du dépôt font foi : lorsque l’arborescence diffère d’un exemple, l’agent suit l’organisation existante sans créer de doublon.

## 3. Architecture : règles non négociables

### 3.1 Les quatre couches

| Couche | Responsabilité | Dépendances autorisées |
|---|---|---|
| **Domain** | Entités, value objects, invariants, règles métier pures | Bibliothèque standard et abstractions métier ; jamais Next.js, Prisma ou HTTP |
| **Application** | Cas d’utilisation, DTO, ports, orchestration | Domain ; interfaces de ports ; jamais une implémentation Prisma concrète |
| **Infrastructure** | Repositories Prisma, services externes, cache, chiffrement, adaptateurs | Application et Domain ; frameworks et fournisseurs externes |
| **Presentation** | Routes App Router, handlers, composants, sérialisation | Application via ses cas d’utilisation et DTO ; Infrastructure uniquement via composition contrôlée |

La règle de dépendance est stricte : **les dépendances pointent vers l’intérieur**. Le Domain ne connaît jamais l’Application, l’Infrastructure ou la Presentation. L’Application ne connaît pas Prisma. Une implémentation concrète est injectée au bord de l’application.

### 3.2 Exemple correct

```ts
// lib/application/employee/ports/EmployeeRepository.ts
import type { Employee } from "@/lib/domain/employee/entities/Employee";

export interface EmployeeRepository {
  findById(companyId: string, id: string): Promise<Employee | null>;
  save(employee: Employee): Promise<Employee>;
}
```

```ts
// app/api/v2/employees/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { CreateEmployeeUseCase } from "@/lib/application/employee/use-cases/CreateEmployeeUseCase";
import { PrismaEmployeeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaEmployeeRepository";

const bodySchema = z.object({ name: z.string().min(1), email: z.email() });

export async function POST(request: Request) {
  const session = await requireRole(["ADMIN", "HR"]);
  const body = bodySchema.parse(await request.json());
  const useCase = new CreateEmployeeUseCase(new PrismaEmployeeRepository());
  const result = await useCase.execute({ ...body, companyId: session.companyId });
  return NextResponse.json(result, { status: 201 });
}
```

La route compose l’adaptateur, valide l’entrée, récupère le tenant depuis la session et appelle un cas d’utilisation. Le cas d’utilisation dépend d’un port, non du client Prisma.

### 3.3 Exemple interdit

```ts
// Mauvais : logique métier et accès Prisma directement dans la route.
import { prisma } from "@/lib/db";

export async function GET() {
  return Response.json(await prisma.employee.findMany());
}
```

Cette implémentation contourne les ports, oublie potentiellement `companyId`, expose le modèle de persistance et rend le comportement difficile à tester. Elle doit être remplacée par un cas d’utilisation et un repository tenant-aware.

## 4. Règles de codage

### TypeScript

Le mode strict est obligatoire. **Zéro `any`**, explicite ou implicite. Utiliser un type précis, `unknown` à la frontière puis une validation, un discriminated union ou un générique contraint. Les assertions (`as`) sont exceptionnelles et doivent être justifiées par une preuve locale.

```ts
// Bon
const payload: unknown = await request.json();
const input = employeeSchema.parse(payload);

// Mauvais
const input: any = await request.json();
```

Toute fonction exportée possède des types de paramètres et de retour explicites lorsque l’inférence ne rend pas le contrat évident. Les erreurs doivent être traitées comme `unknown` et converties en erreurs applicatives contrôlées.

### Imports et Prisma

Une route ne doit pas importer le client Prisma, `PrismaClient` ou un modèle Prisma pour faire sa logique métier. Les types Prisma restent confinés à l’Infrastructure ou sont transformés en entités/DTO. Les repositories doivent appliquer l’isolation tenant et mapper les erreurs de persistance.

### Validation avec Zod

Toute donnée externe doit être validée avec Zod : corps JSON, query string, paramètres de route, headers utiles, variables d’environnement et réponses de fournisseurs externes. Ne jamais faire confiance à un cast TypeScript comme mécanisme de validation.

```ts
const paramsSchema = z.object({ id: z.string().uuid() });
const params = paramsSchema.parse(await context.params);
```

### Multi-tenant

Toute lecture, écriture, mise à jour, suppression, agrégation, export, cache key et job doit être rattaché à un `companyId`. Une requête par identifiant seul est interdite. Le `companyId` doit provenir d’une session ou d’un contexte serveur authentifié, jamais d’une valeur librement fournie par le client sans contrôle.

```ts
// Bon
await prisma.employee.findFirst({ where: { id, companyId } });

// Mauvais : risque de fuite inter-entreprises
await prisma.employee.findUnique({ where: { id } });
```

Les tests d’isolation inter-tenant sont obligatoires pour toute fonctionnalité qui manipule des données d’entreprise.

### Montants et Money

Tous les salaires, primes, retenues, cotisations, taxes, indemnités, totaux et autres montants passent par le service/value object `Money` du domaine (`@/lib/domain/payroll/money`). Ne pas utiliser de flottants pour une opération monétaire et ne pas réimplémenter l’arrondi dans une route ou un composant.

```ts
// Bon
const net = Money.of(gross).subtract(Money.of(deductions));

// Mauvais
const net = gross - deductions;
```

### Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Fichier TypeScript | `kebab-case` pour utilitaires, PascalCase pour classes existantes | `tenant-context.ts`, `CreateEmployeeUseCase.ts` |
| Composant React | PascalCase | `EmployeeTable.tsx` |
| Hook | `use` + PascalCase | `useEmployees.ts` |
| Cas d’utilisation | Verbe + `UseCase` | `CreateEmployeeUseCase.ts` |
| Test | même nom + `.test.ts(x)` | `tenant-isolation.test.ts` |
| DTO | suffixe `DTO` | `EmployeeDTO.ts` |
| Route | `route.ts` dans l’arborescence App Router | `app/api/v2/employees/route.ts` |

Respecter les conventions déjà présentes dans le sous-domaine modifié. Ne pas renommer massivement des fichiers dans une fonctionnalité sans migration explicite.

## 5. Tests et qualité

La couverture est obligatoire à chaque couche concernée. Les tests existants dépassent 70 suites et 312 tests ; une modification doit préserver cette base et ajouter les scénarios qui prouvent le nouveau comportement.

| Type | Cible | Contenu attendu |
|---|---|---|
| Unitaire | Domain et Application | invariants, calculs, cas limites, erreurs, ports mockés |
| Intégration | Infrastructure | repositories Prisma, mapping, tenant isolation, transactions |
| Contrat/API | Presentation | schémas d’entrée/sortie, statuts HTTP, permissions, versionnement |
| E2E | parcours critiques | authentification, rôle, workflow RH/paie, export ou déclaration |

Avant livraison, lancer au minimum `pnpm lint`, `pnpm test` et, lorsque le périmètre le justifie, `pnpm test:e2e`. Pour Prisma, utiliser `pnpm prisma:generate`, `pnpm prisma:migrate`, `pnpm prisma:validate` et `pnpm prisma:deploy`. Les tests doivent être déterministes, isolés et lisibles. **N’utiliser ni `npm`, ni `npx`, ni Yarn** dans les commandes, scripts, compétences ou exemples du projet ; utiliser `pnpm` et `pnpm exec`. Le fichier `pnpm-lock.yaml` est la source de vérité et `package-lock.json` ne doit pas être créé ni conservé. Un test qui ne fait que reproduire l’implémentation interne sans vérifier un comportement utile n’est pas suffisant.

## 6. Sécurité

Toute route privée doit vérifier l’authentification, le `companyId` et le rôle requis avant d’appeler le cas d’utilisation. Les routes d’administration et de super-administration doivent appliquer un contrôle RBAC explicite, auditable et testé. Les routes publiques doivent utiliser le mécanisme d’API gateway prévu et limiter strictement leur surface de données.

Les secrets, tokens, clés de chiffrement, mots de passe, chaînes de connexion et données personnelles ne doivent jamais être committés, journalisés, inclus dans une réponse ou exposés au navigateur. Utiliser les variables d’environnement et les services de chiffrement existants. Les logs doivent exclure les salaires, identifiants sensibles et données d’authentification.

Les headers de sécurité configurés par le projet sont obligatoires sur les réponses applicables : CSP, HSTS en environnement HTTPS, `X-Content-Type-Options`, `X-Frame-Options` ou équivalent CSP, politique de référent et permissions policy. Toute modification de middleware, proxy ou configuration Next doit préserver ces headers.

Les entrées doivent être validées, les sorties minimisées, les erreurs non verbeuses côté client et les opérations sensibles auditées. Les exports et téléchargements doivent revérifier l’autorisation au moment de l’action.

## 7. Compétences disponibles

Les compétences réutilisables sont situées dans `.agents/skills/`. Chaque compétence contient un `SKILL.md` avec son périmètre, sa procédure, ses garde-fous et sa checklist.

| Compétence | Chemin | Usage |
|---|---|---|
| Clean Architecture | `.agents/skills/clean-architecture/SKILL.md` | concevoir ou refactorer les couches et ports |
| Super Admin | `.agents/skills/super-admin/SKILL.md` | opérations globales, RBAC et isolation renforcée |
| Payroll Calculator | `.agents/skills/payroll-calculator/SKILL.md` | calculs paie, Money, arrondis et traçabilité |
| Testing | `.agents/skills/testing/SKILL.md` | stratégie unitaire, intégration, contrat et E2E |
| Contract Negotiation | `.agents/skills/contract-negotiation/SKILL.md` | contrats de travail, règles métier et workflows de validation |
| Security Audit | `.agents/skills/security-audit/SKILL.md` | audit de routes, secrets, headers et multi-tenant |

Un agent doit lire la compétence pertinente avant d’intervenir sur son domaine et ne doit pas utiliser une compétence comme autorisation pour contourner les règles non négociables de ce fichier.

## 8. Checklist d’une nouvelle fonctionnalité

Avant de déclarer une fonctionnalité prête, l’agent vérifie les étapes suivantes dans l’ordre :

- [ ] **Domain** : entités, value objects et invariants sont définis sans dépendance framework ; les montants utilisent `Money`.
- [ ] **Application** : cas d’utilisation, commandes, DTO, ports et erreurs applicatives sont définis ; `companyId` fait partie du contexte contrôlé.
- [ ] **Infrastructure** : repository/service concret, mapping Prisma, transactions, index et isolation tenant sont implémentés.
- [ ] **Contrats** : schémas Zod, DTO de sortie, version d’API, statuts et erreurs sont explicites.
- [ ] **Routes/Presentation** : authentification, rôle, validation, rate limiting éventuel, headers et sérialisation sont appliqués.
- [ ] **Tests** : unitaires, intégration, contrat/API et E2E sont ajoutés selon le risque ; les scénarios négatifs et inter-tenant sont présents.
- [ ] **Documentation** : README ou documentation du domaine, variables d’environnement, migration et décision d’architecture sont mis à jour.
- [ ] **Vérification** : lint, tests, build si nécessaire et revue du diff sont exécutés ; aucun secret ni `any` n’est introduit.

## 9. Procédure de travail de l’agent

L’agent commence par lire les fichiers concernés, les tests proches et les compétences pertinentes. Il formule brièvement les invariants et les risques avant de modifier le code. Il privilégie les changements ciblés, réversibles et compatibles avec les contrats existants. En cas d’ambiguïté métier ou réglementaire, il signale l’hypothèse au lieu de l’inventer.

L’agent ne supprime pas un test pour faire passer la suite, ne désactive pas TypeScript strict, ne contourne pas RBAC, ne neutralise pas l’isolation tenant et ne masque pas une erreur avec `any`, `eslint-disable` ou un cast non justifié. Toute exception doit être documentée et approuvée explicitement.

## 10. Références du dépôt

Les règles ci-dessus sont alignées sur la configuration et les conventions présentes dans `package.json` (avec `packageManager: pnpm@11.21.0`), `pnpm-lock.yaml`, `tsconfig.json`, `lib/domain/`, `lib/application/`, `lib/infrastructure/`, `app/api/v2/`, `lib/database/` et les suites de tests du dépôt. Elles constituent la source opérationnelle pour les agents intervenant sur PROGITPAIE.
