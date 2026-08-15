# Calendrier de maintenance du référentiel `.agents/`

## Principes

La maintenance doit rester légère, régulière et liée aux changements réels du projet. Le référentiel est versionné avec le code et toute modification significative doit passer par une revue de code.

## Calendrier recommandé

| Fréquence | Durée cible | Action | Responsable recommandé |
|---|---:|---|---|
| À chaque fonctionnalité | 5–15 min | Vérifier si une règle ou compétence doit être ajoutée ou mise à jour | Développeur auteur |
| À chaque revue de code | 2–5 min | Vérifier l’impact du changement sur `.agents/` | Reviewer |
| Chaque semaine | 10 min | Examiner les nouvelles règles, régressions et demandes répétées aux agents | Référent technique |
| Chaque mois | 30 min | Parcourir le catalogue, les chemins, rôles, commandes et exemples | Référent technique + référent métier |
| Chaque trimestre | 45–60 min | Revue complète : architecture, sécurité, tests, compétences obsolètes et priorités | Équipe technique |
| À chaque version majeure | 30–60 min | Versionner le référentiel et documenter les changements importants | Responsable projet |

## Checklist mensuelle

- [ ] Tous les chemins référencés existent encore.
- [ ] Les règles d’architecture correspondent au code réel.
- [ ] Les rôles et permissions décrits sont toujours valides.
- [ ] Les commandes de lint, tests et E2E sont correctes.
- [ ] Les règles `companyId` sont toujours appliquées.
- [ ] Les exemples n’introduisent pas de `any` ou d’accès Prisma interdit.
- [ ] Les règles Zod, `Money`, audit et headers de sécurité restent valides.
- [ ] Les compétences récentes sont présentes dans `skills/README.md`.
- [ ] Les compétences obsolètes sont corrigées, remplacées ou archivées.
- [ ] Aucun secret ou donnée personnelle ne figure dans le référentiel.

## Déclencheurs de mise à jour immédiate

Mettre à jour le référentiel sans attendre la revue mensuelle lorsqu’une nouvelle règle réglementaire affecte la paie, qu’une faille de sécurité est découverte, qu’un changement d’architecture modifie les dépendances entre couches, qu’un test révèle une règle tenant oubliée ou que plusieurs développeurs rencontrent la même ambiguïté.

## Versionnement

Utiliser une version majeure pour une modification qui change le comportement attendu des agents, une version mineure pour l’ajout d’une compétence ou d’une règle compatible et une correction de contenu pour une clarification sans impact comportemental.

Chaque mise à jour doit indiquer le motif, les fichiers concernés et l’impact attendu. Exemple de message de commit :

```text
docs(agents): update security audit checklist
```

## Indicateurs simples de suivi

L’équipe peut suivre quatre indicateurs légers : nombre de compétences disponibles, date de dernière revue, nombre de règles ajoutées après une régression et nombre de demandes nécessitant une clarification du référentiel. Ces indicateurs servent à améliorer la documentation, non à mesurer individuellement les développeurs.
