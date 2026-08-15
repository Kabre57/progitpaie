# Skill — Testing
## Gestionnaire de paquets obligatoire

Utiliser exclusivement **pnpm 11.21.0** dans PROGITPAIE. Ne jamais utiliser `npm`, `npx` ou Yarn. Utiliser `pnpm`, `pnpm exec` et `pnpm-lock.yaml`.


## Objectif
Construire une stratégie de tests fiable pour les couches métier, les adaptateurs, les contrats HTTP et les parcours critiques.

## Matrice
| Niveau | Outil | Vérifie |
|---|---|---|
| Unitaire | Jest | invariants Domain, cas d’utilisation, erreurs et calculs |
| Intégration | Jest + base contrôlée | Prisma, mappings, transactions et isolation |
| Composant | Testing Library | comportement UI et états TanStack Query |
| Contrat/API | Jest | Zod, statuts, payloads et permissions |
| E2E | Playwright | parcours utilisateur complet et sécurité observable |

## Procédure
1. Écrire d’abord les scénarios nominaux et négatifs.
2. Tester les ports de l’Application avec des fakes explicites.
3. Tester les repositories avec une base isolée ou un environnement prévu par le dépôt.
4. Pour chaque route, couvrir authentification, rôle, validation, tenant et erreurs.
5. Ajouter un E2E pour tout workflow de paie ou RH critique.
6. Exécuter `pnpm lint`, `pnpm test` et `pnpm test:e2e` selon le périmètre.

## Exemple
```ts
test("refuse un salarié d'une autre entreprise", async () => {
  const result = await repository.findById("company-a", "employee-of-company-b");
  expect(result).toBeNull();
});
```

## Interdits
Supprimer ou affaiblir un test pour faire passer la suite, utiliser des délais arbitraires dans Playwright, partager un état mutable entre tests ou ne tester que le chemin heureux.

## Checklist
- [ ] Test unitaire par règle métier.
- [ ] Test d’intégration pour chaque adaptateur modifié.
- [ ] Contrat HTTP validé.
- [ ] Cas non autorisé et inter-tenant présents.
- [ ] E2E ajouté si le parcours est critique.
- [ ] Suites et lint exécutés.
