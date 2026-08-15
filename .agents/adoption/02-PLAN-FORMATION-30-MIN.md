# Plan de formation — Utiliser le référentiel des agents IA

**Durée : 30 minutes**  
**Public : développeurs PROGITPAIE**  
**Format : démonstration courte, exercice pratique et questions-réponses**  
**Objectif :** permettre à chaque développeur de demander une modification à un agent IA en respectant les règles du projet.

## Résultats attendus

À la fin de la session, chaque participant doit savoir localiser `.agents/`, expliquer le rôle de `AGENTS.md`, choisir une compétence, rédiger une demande bornée et vérifier le résultat produit par l’agent.

## Déroulé

| Temps | Séquence | Contenu | Résultat |
|---:|---|---|---|
| 0–3 min | Introduction | Pourquoi le référentiel existe et quels risques il réduit | Comprendre l’objectif |
| 3–8 min | Structure | `AGENTS.md`, `skills/`, `README.md`, modèle et guide de maintenance | Savoir où chercher |
| 8–13 min | Règles critiques | Architecture, `any`, Zod, `companyId`, `Money`, tests et sécurité | Connaître les règles non négociables |
| 13–18 min | Démonstration | Demande ciblée avec `clean-architecture` et `testing` | Voir le flux complet |
| 18–25 min | Cas pratique | Ajouter un nouveau cas d’utilisation | Appliquer la méthode |
| 25–28 min | Revue | Vérifier diff, tests, tenant et permissions | Savoir contrôler le résultat |
| 28–30 min | Récapitulatif et Q&A | Questions, erreurs fréquentes, prochaines étapes | Valider l’appropriation |

## Déroulé détaillé

### 0–3 minutes — Introduction

Présenter `.agents/` comme un contrat de collaboration entre l’équipe et les agents IA. Insister sur le fait que le référentiel ne remplace ni la revue de code ni la validation métier : il fournit un cadre reproductible.

### 3–8 minutes — Structure du référentiel

Montrer les fichiers suivants :

- `.agents/AGENTS.md` : règles générales obligatoires ;
- `.agents/skills/README.md` : catalogue des compétences ;
- `.agents/skills/SKILL.template.md` : modèle de nouvelle compétence ;
- `.agents/skills/*/SKILL.md` : règles spécialisées ;
- `.agents/skills/SHARING-AND-MAINTENANCE.md` : gouvernance et mises à jour.

### 8–13 minutes — Règles non négociables

Présenter un exemple correct et un exemple incorrect. Les points à retenir sont la séparation Domain/Application/Infrastructure/Presentation, l’absence de `any`, la validation Zod, l’isolation par `companyId`, l’usage de `Money`, les permissions par rôle et la couverture de tests.

### 13–18 minutes — Démonstration

Utiliser la consigne suivante :

```text
Lis `.agents/AGENTS.md`, `.agents/skills/clean-architecture/SKILL.md`
et `.agents/skills/testing/SKILL.md`.

Ajoute le cas d’utilisation `GetEmployeeByIdUseCase`.
Périmètre : Domain/Application et tests associés.
Contraintes : ne pas importer Prisma dans le cas d’utilisation,
filtrer par companyId, ne pas introduire any et ne pas modifier les routes.
Validation : exécuter uniquement les tests du cas d’utilisation.
```

Montrer que l’agent doit d’abord inspecter les fichiers existants, identifier le port, créer le use case, ajouter les tests et rendre compte des vérifications.

### 18–25 minutes — Cas pratique

Les participants doivent rédiger une demande pour ajouter un cas d’utilisation de leur choix, par exemple `ListEmployeeAbsencesUseCase` ou `CalculatePayrollSummaryUseCase`.

La demande doit préciser :

1. le résultat attendu ;
2. les fichiers ou dossiers autorisés ;
3. les compétences à lire ;
4. les règles métier ;
5. les tests à ajouter ;
6. les fichiers à ne pas modifier.

### 25–28 minutes — Revue du résultat

Utiliser cette checklist :

- [ ] Les couches sont respectées.
- [ ] Les ports et DTO sont cohérents.
- [ ] `companyId` est contrôlé.
- [ ] Les entrées externes sont validées avec Zod.
- [ ] Aucun `any` n’a été introduit.
- [ ] Les rôles et erreurs sont traités.
- [ ] Les tests ciblés existent et passent.
- [ ] Le diff reste dans le périmètre demandé.

### 28–30 minutes — Récapitulatif et Q&A

Faire rappeler la règle principale : lire `AGENTS.md`, charger seulement la compétence nécessaire, formuler une demande bornée et vérifier le résultat. Répondre aux questions et recueillir les besoins de nouvelles compétences fonctionnelles.

## Support remis aux participants

Chaque développeur reçoit le chemin du référentiel, le modèle de prompt et la checklist finale. Une nouvelle personne doit pouvoir être autonome après lecture de `AGENTS.md`, `skills/README.md` et de la compétence liée à sa tâche.
