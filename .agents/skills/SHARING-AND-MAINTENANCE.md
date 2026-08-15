# Partage et maintenance du référentiel des agents

## 1. Objectif

Le référentiel `.agents/` doit être connu de toute l’équipe afin que les agents IA et les développeurs appliquent les mêmes règles d’architecture, de sécurité, de tests et de métier.

## 2. Message de partage à l’équipe

> Le projet PROGITPAIE dispose désormais d’un référentiel pour les agents IA dans `.agents/`. Le fichier `.agents/AGENTS.md` contient les règles générales obligatoires du projet. Les fichiers `.agents/skills/*/SKILL.md` décrivent les procédures spécialisées pour l’architecture, l’administration, la paie, les tests, les contrats, la sécurité, les absences, l’onboarding salarié et les dépenses. Toute nouvelle fonctionnalité assistée par IA doit commencer par la lecture de `AGENTS.md` et de la compétence pertinente.

## 3. Règles d’utilisation en équipe

Le dossier `.agents/` doit être versionné avec le projet et inclus dans les revues de code. Toute modification d’une règle importante doit expliquer son motif et son impact. Une compétence ne doit pas contredire `AGENTS.md` et ne doit pas contenir de secret, de donnée personnelle ou de procédure non validée.

Les demandes aux agents doivent préciser le périmètre, les fichiers concernés, la compétence à utiliser, les contraintes et les tests attendus. Une demande ciblée est préférable à une demande générale de refactorisation.

## 4. Processus de mise à jour

| Moment | Action |
|---|---|
| Nouvelle fonctionnalité | Ajouter ou modifier la compétence fonctionnelle concernée |
| Changement d’architecture | Mettre à jour `AGENTS.md` et `clean-architecture/SKILL.md` |
| Changement réglementaire paie | Mettre à jour `payroll-calculator/SKILL.md`, les tests et la documentation métier |
| Nouvelle faille ou règle de sécurité | Mettre à jour `security-audit/SKILL.md` et les règles générales |
| Régression constatée | Ajouter une règle préventive et un test de non-régression |
| Revue périodique | Relire le référentiel au moins à chaque version majeure du projet |

## 5. Procédure de modification

1. Identifier la règle devenue obsolète ou la nouvelle règle à ajouter.
2. Vérifier les fichiers de code et les tests qui prouvent cette règle.
3. Modifier le fichier de compétence le plus spécifique possible.
4. Modifier `AGENTS.md` uniquement si la règle s’applique à tous les agents.
5. Mettre à jour le tableau du rapport dans `.agents/skills/README.md`.
6. Vérifier les exemples de code, les chemins et les commandes.
7. Faire relire le changement par un responsable technique ou métier selon le domaine.
8. Commiter la modification avec un message explicite.

## 6. Convention de version

Le référentiel utilise une version simple :

- **Correction éditoriale** : correction d’une faute ou précision sans changement de règle.
- **Version mineure** : ajout d’une règle ou d’une compétence compatible.
- **Version majeure** : changement de règle pouvant modifier le comportement attendu des agents.

La version de référence doit être mise à jour dans `AGENTS.md` et dans le fichier concerné lorsqu’une règle évolue.

## 7. Revue périodique

À chaque revue, vérifier que les compétences mentionnent encore les bons chemins, les bons rôles, les bons scripts de test et les bons services du projet. Supprimer ou marquer les compétences obsolètes plutôt que de laisser des instructions contradictoires.

La revue doit également rechercher les occurrences de `any`, les exemples sans `companyId`, les appels Prisma directs dans les routes, les validations absentes et les règles de sécurité qui ne correspondent plus à l’implémentation.
