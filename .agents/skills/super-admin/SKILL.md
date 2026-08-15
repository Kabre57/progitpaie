# Skill — Super Admin
## Gestionnaire de paquets obligatoire

Utiliser exclusivement **pnpm 11.21.0** dans PROGITPAIE. Ne jamais utiliser `npm`, `npx` ou Yarn. Utiliser `pnpm`, `pnpm exec` et `pnpm-lock.yaml`.


## Objectif
Implémenter des opérations globales d’administration sans affaiblir le RBAC, l’audit ni l’isolation des entreprises.

## Règles
Un rôle super-admin n’est pas une permission implicite pour ignorer les contrôles. Toute action doit vérifier l’identité, le rôle explicite, le périmètre autorisé, l’intention et la traçabilité. Les opérations globales doivent distinguer clairement les actions de lecture, d’export, de mutation et de support.

## Procédure
1. Identifier le rôle et la permission exacte requis.
2. Vérifier la session côté serveur et refuser les valeurs de rôle provenant du client.
3. Définir le périmètre : global, liste de `companyId` autorisés ou entreprise courante.
4. Valider les filtres et paramètres avec Zod.
5. Exécuter l’action via un cas d’utilisation et un repository tenant-aware.
6. Enregistrer un audit minimal : acteur, action, cible, entreprise, résultat et horodatage.
7. Ajouter les tests d’accès autorisé, refusé et de tentative de franchissement de tenant.

## Exemple correct
```ts
const session = await requireRole(["SUPER_ADMIN"]);
const input = adminQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
const result = await useCase.execute({ actorId: session.userId, ...input });
await audit.log({ actorId: session.userId, action: "COMPANY_READ", companyId: input.companyId });
```

## Interdits
Faire confiance à `role` ou `companyId` envoyé dans le body, utiliser un endpoint d’administration non authentifié, retourner des secrets ou supprimer l’audit pour simplifier un test.

## Checklist
- [ ] Permission explicite et serveur.
- [ ] Périmètre et tenant contrôlés.
- [ ] Zod appliqué aux entrées.
- [ ] Audit créé sans données sensibles.
- [ ] Tests positif, négatif et inter-tenant.
