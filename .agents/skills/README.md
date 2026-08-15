# Rapport des compétences réalisées — PROGITPAIE

**Version du référentiel : 1.0.0**  
**Emplacement :** `.agents/skills/`  
**Fichier général associé :** `.agents/AGENTS.md`  
**Gestionnaire de paquets obligatoire :** `pnpm 11.21.0` — ne pas utiliser `npm`, `npx` ou Yarn

## 1. Résumé

Le référentiel contient six compétences spécialisées et un modèle standard. Chaque compétence explique à l’agent quand l’utiliser, quelles règles respecter, quelle procédure suivre, quels comportements éviter et quels contrôles exécuter avant livraison.

Le fichier `.agents/AGENTS.md` reste prioritaire. Les compétences complètent ses règles et ne doivent jamais être utilisées pour les contourner.

## 2. Liste des compétences

| Compétence | Fichier | Fonction principale | Niveau |
|---|---|---|---|
| Clean Architecture | `clean-architecture/SKILL.md` | Organiser les couches Domain, Application, Infrastructure et Presentation | Réalisée |
| Super Admin | `super-admin/SKILL.md` | Encadrer les opérations globales, le RBAC et l’audit | Réalisée |
| Payroll Calculator | `payroll-calculator/SKILL.md` | Sécuriser les calculs de paie et l’utilisation de `Money` | Réalisée |
| Testing | `testing/SKILL.md` | Définir les tests unitaires, intégration, contrats et E2E | Réalisée |
| Contract Negotiation | `contract-negotiation/SKILL.md` | Gérer les contrats, avenants, états et validations RH | Réalisée |
| Security Audit | `security-audit/SKILL.md` | Auditer authentification, rôles, secrets, headers et tenant isolation | Réalisée |
| Gestion des absences | `leave-management/SKILL.md` | Demandes, approbation, refus, soldes et chevauchements | Réalisée |
| Intégration employés | `employee-onboarding/SKILL.md` | Création, validation, invitation et activation des salariés | Réalisée |
| Gestion des dépenses | `expense-management/SKILL.md` | Notes de frais, justificatifs, approbation et remboursement | Réalisée |
| Institutionnalisation des agents | `progitpaie-agents-institutionalization/SKILL.md` | Partage, formation, ajout de compétences et maintenance du référentiel | Réalisée |
| Modèle générique | `SKILL.template.md` | Servir de base pour créer de nouvelles compétences ou fonctionnalités | Réalisée |

## 3. Rapport détaillé

### 3.1 Clean Architecture

Cette compétence impose la séparation entre le Domain, l’Application, l’Infrastructure et la Presentation. Elle explique comment définir des ports, créer des cas d’utilisation, implémenter des repositories et composer les dépendances depuis la couche de présentation.

Elle doit être utilisée pour une nouvelle fonctionnalité, un refactoring architectural ou la création d’un nouveau sous-domaine métier.

### 3.2 Super Admin

Cette compétence encadre les fonctionnalités réservées aux administrateurs globaux. Elle exige une vérification serveur du rôle, un périmètre autorisé, une validation Zod, une isolation par entreprise lorsque nécessaire et un audit des opérations sensibles.

Elle doit être utilisée pour les dashboards globaux, la gestion des entreprises, les exports administratifs et les opérations de support ou de maintenance.

### 3.3 Payroll Calculator

Cette compétence définit les règles applicables aux calculs de salaires, primes, retenues, cotisations et indemnités. Elle impose l’utilisation du service `Money`, la documentation des formules, la maîtrise des arrondis, la traçabilité du résultat et les tests de précision.

Elle doit être utilisée pour toute modification touchant au brut, au net, aux cotisations, aux taxes, aux indemnités ou aux déclarations calculées.

### 3.4 Testing

Cette compétence fournit une stratégie de vérification par niveau : tests unitaires, intégration, composants, contrats API et E2E. Elle impose la couverture des erreurs, des permissions et de l’isolation inter-tenant.

Elle doit être utilisée pour l’ajout d’une fonctionnalité, la correction d’une régression ou la préparation d’une livraison.

### 3.5 Contract Negotiation

Cette compétence encadre les contrats de travail, avenants, validations et transitions d’état. Elle prévoit la protection des données RH, la vérification des rôles, l’historisation des contrats signés, la validation des dates et l’utilisation de `Money` pour les rémunérations.

Elle doit être utilisée pour les workflows de contrat, de signature, d’approbation, de renouvellement ou de modification de conditions de travail.

### 3.6 Security Audit

Cette compétence fournit une procédure d’audit des routes, services et fonctionnalités. Elle contrôle l’authentification, le RBAC, le `companyId`, les imports Prisma, les secrets, les logs, les headers de sécurité, le rate limiting et les tests négatifs.

Elle doit être utilisée avant la livraison d’une route sensible, d’un export, d’une fonctionnalité admin ou d’une intégration externe.

### 3.7 Gestion des absences

Cette compétence décrit le workflow des absences, les états, les règles de dates, les chevauchements, les soldes, les rôles d’approbation et l’isolation `companyId`.

### 3.8 Intégration des employés

Cette compétence encadre la création et l’activation de salariés, l’unicité du matricule, la protection des données personnelles, les invitations, l’idempotence et l’audit.

### 3.9 Gestion des dépenses

Cette compétence encadre les notes de frais, les montants `Money`, les devises, les justificatifs, les plafonds, la séparation des tâches et les intégrations paie/comptabilité.

### 3.10 Institutionnalisation des agents

Cette compétence transforme le processus d’adoption du référentiel en workflow réutilisable : inspection de `.agents/`, message de partage, formation de 30 minutes, processus d’ajout de compétences et calendrier de maintenance.

### 3.11 Parcours de création de contrat

Le parcours de contrat utilise désormais des libellés français et distingue deux usages : la **vue manager — simplifiée**, centrée sur le net à payer et le coût employeur, et la **vue RH experte — détaillée**, centrée sur les paramètres familiaux, les retenues, les charges et les éléments à valider localement. Les champs affichés comme éditables doivent être persistés par l’API ; les champs non pris en charge ne doivent pas être présentés comme enregistrés.

Le formulaire alimente les champs contractuels réellement supportés : salarié, poste, nature du contrat, dates, période d’essai et rémunération. Un CDD ou une convention de stage doit comporter une date de fin. Les paramètres de calcul local restent indicatifs tant qu’ils n’ont pas été validés par un référent paie ivoirien.

### 3.12 Modèle générique

`SKILL.template.md` est un modèle standard utilisant exclusivement pnpm et permettant de créer rapidement une nouvelle compétence. Il contient les sections suivantes : objectif, périmètre, contexte projet, règles obligatoires, procédure d’exécution, exemples corrects et incorrects, gestion des erreurs, tests, sécurité, checklist et format de restitution.

## 4. Comment utiliser les compétences

L’agent doit charger uniquement la compétence pertinente pour la tâche demandée. Il n’est pas nécessaire d’utiliser les six compétences à chaque intervention.

| Exemple de demande | Compétence à charger |
|---|---|
| « Ajoute un nouveau cas d’utilisation » | `clean-architecture` |
| « Crée une page de gestion globale » | `super-admin` |
| « Modifie le calcul du salaire net » | `payroll-calculator` |
| « Ajoute les tests de cette route » | `testing` |
| « Ajoute un avenant de contrat » | `contract-negotiation` |
| « Vérifie la sécurité de cet endpoint » | `security-audit` |
| « Implémente les demandes de congé » | `leave-management` |
| « Crée le parcours d’un nouvel employé » | `employee-onboarding` |
| « Ajoute les notes de frais » | `expense-management` |
| « Institutionnalise le référentiel des agents » | `progitpaie-agents-institutionalization` |
| « Crée un nouveau contrat de travail » | `contract-negotiation` + `payroll-calculator` + `testing` |

Exemple de consigne :

```text
Lis `.agents/AGENTS.md` et `.agents/skills/payroll-calculator/SKILL.md`.
Implémente la nouvelle règle de calcul demandée dans le périmètre de la paie.
Respecte Clean Architecture, utilise Money, ajoute les tests ciblés et ne modifie
aucun fichier sans rapport avec cette fonctionnalité.
```

## 5. État de validation

Les fichiers suivants ont été créés et contrôlés :

```text
.agents/AGENTS.md
.agents/skills/SKILL.template.md
.agents/skills/README.md
.agents/skills/clean-architecture/SKILL.md
.agents/skills/super-admin/SKILL.md
.agents/skills/payroll-calculator/SKILL.md
.agents/skills/testing/SKILL.md
.agents/skills/contract-negotiation/SKILL.md
.agents/skills/security-audit/SKILL.md
```

Les contrôles effectués portent sur la présence des fichiers, leur contenu non vide, la présence des titres de compétence et la couverture des règles principales : architecture, TypeScript strict, `any`, Zod, `companyId`, `Money`, tests, sécurité et checklist de livraison.

## 6. Améliorations possibles

Le référentiel pourra ensuite être enrichi avec `payroll-declarations`, `document-generation` ou d’autres domaines métier. Pour chaque nouvelle compétence, partir de `SKILL.template.md`, décrire les règles métier précises et indiquer les fichiers du sous-domaine concernés.

Une compétence fonctionnelle complète doit toujours préciser son périmètre, ses règles métier, les couches à modifier, les rôles autorisés, les tests obligatoires et ses critères de fin.
