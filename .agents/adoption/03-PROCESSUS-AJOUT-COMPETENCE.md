# Processus d’ajout d’une compétence fonctionnelle

## Objectif

Ajouter une compétence fonctionnelle utile, maintenable et cohérente avec les règles générales de PROGITPAIE sans alourdir inutilement le référentiel.

## Quand créer une nouvelle compétence

Créer un nouveau `SKILL.md` lorsqu’un domaine possède des règles métier propres, des rôles spécifiques, des transitions d’état, des calculs sensibles ou des tests particuliers. Ne pas créer une compétence pour une simple tâche ponctuelle déjà couverte par `AGENTS.md` ou une compétence existante.

## Processus en sept étapes

### 1. Identifier le domaine

Décrire le besoin, les utilisateurs concernés, les données manipulées, les rôles, les risques et les compétences existantes potentiellement réutilisables. Vérifier que le domaine n’est pas déjà couvert.

Exemples de domaines possibles : `payroll-declarations`, `document-generation`, `reporting-analytics`, `timesheet-management`, `recruitment` et `performance-review`.

### 2. Créer le dossier et le fichier

Utiliser un nom en `kebab-case` :

```bash
mkdir -p .agents/skills/payroll-declarations
cp .agents/skills/SKILL.template.md \
  .agents/skills/payroll-declarations/SKILL.md
```

### 3. Rédiger la compétence

Le fichier doit contenir au minimum :

| Section | Contenu attendu |
|---|---|
| Objectif | Finalité et périmètre |
| Quand l’utiliser | Cas inclus et exclus |
| Architecture | Couches et dossiers concernés |
| Règles métier | Invariants, états et contraintes |
| Sécurité | Authentification, rôles, tenant et données sensibles |
| Exemples | Code correct et erreurs à éviter |
| Tests | Scénarios unitaires, intégration, API et E2E |
| Checklist | Critères de fin vérifiables |

La compétence doit rappeler que `.agents/AGENTS.md` est prioritaire et doit mentionner les compétences complémentaires pertinentes.

### 4. Ajouter au catalogue

Mettre à jour `.agents/skills/README.md` avec le nom, le chemin, le rôle et l’état de la compétence. Ajouter la compétence aux exemples de sélection lorsqu’elle répond à un cas courant.

### 5. Faire relire la règle

Une compétence fonctionnelle doit être relue par un référent métier et une personne technique. La revue vérifie que les règles ne sont pas ambiguës, contradictoires avec le code ou trop prescriptives sans justification.

### 6. Ajouter les preuves dans le code

Lorsqu’une règle est critique, elle doit être soutenue par une implémentation et un test. Une compétence ne doit pas prétendre imposer une règle que le système ne vérifie jamais, sauf si elle décrit précisément le travail à réaliser.

### 7. Versionner et annoncer

Commiter le nouveau fichier avec le code associé, mettre à jour le rapport et annoncer la compétence à l’équipe. Utiliser un message explicite, par exemple :

```text
feat(agents): add payroll declarations skill
```

## Checklist de validation

- [ ] Le domaine et le périmètre sont clairement définis.
- [ ] Une compétence existante ne couvre pas déjà le besoin.
- [ ] Le nom du dossier est en `kebab-case`.
- [ ] Le fichier est basé sur `SKILL.template.md`.
- [ ] Les règles `companyId`, Zod, TypeScript strict et sécurité sont traitées.
- [ ] Les couches Domain, Application, Infrastructure et Presentation sont indiquées.
- [ ] Les tests attendus sont précisés.
- [ ] `README.md` est mis à jour.
- [ ] La compétence a été relue par les référents concernés.
- [ ] Le changement est versionné avec le code.

## Compétences fonctionnelles candidates

| Compétence | Priorité indicative | Points à traiter |
|---|---|---|
| `payroll-declarations` | Haute | périodes, contrôles, exports, audit et statuts |
| `document-generation` | Moyenne | modèles, données sensibles, stockage et téléchargement |
| `reporting-analytics` | Moyenne | agrégations tenant, permissions et performance |
| `timesheet-management` | Haute | présence, horaires, validation et impact paie |
| `recruitment` | Moyenne | candidats, confidentialité, pipeline et consentement |
| `performance-review` | Moyenne | évaluations, rôles, confidentialité et historique |
