# Skill — Security Audit
## Gestionnaire de paquets obligatoire

Utiliser exclusivement **pnpm 11.21.0** dans PROGITPAIE. Ne jamais utiliser `npm`, `npx` ou Yarn. Utiliser `pnpm`, `pnpm exec` et `pnpm-lock.yaml`.


## Objectif
Auditer une fonctionnalité ou une route PROGITPAIE avant livraison, en priorité sous les angles authentification, RBAC, secrets, headers et isolation multi-tenant.

## Procédure
1. Cartographier les entrées : URL, body, headers, cookies, fichiers et webhooks.
2. Vérifier l’authentification côté serveur et l’expiration de session.
3. Vérifier le rôle et la permission sur chaque opération sensible.
4. Vérifier que chaque lecture et mutation est filtrée par `companyId`.
5. Rechercher les imports Prisma dans les routes et les casts `any`.
6. Vérifier Zod, rate limiting, logs et gestion des erreurs.
7. Vérifier CSP, HSTS en HTTPS, `X-Content-Type-Options`, protection anti-frame, référent et permissions policy.
8. Rechercher les secrets dans le diff, les logs, les réponses et les variables publiques.
9. Ajouter ou exécuter les tests négatifs : non authentifié, mauvais rôle, autre tenant, payload invalide.

## Exemple de contrôle
```ts
const session = await requireSession();
if (!session.companyId) return unauthorized();
await requirePermission(session, "PAYROLL_READ");
const input = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
return useCase.execute({ ...input, companyId: session.companyId });
```

## Signaux bloquants
Une route qui accepte un `companyId` arbitraire, une requête Prisma sans tenant, un secret dans le code ou les logs, une réponse contenant des données RH non nécessaires, un endpoint admin sans RBAC, une validation par cast ou un header de sécurité supprimé.

## Livrable d’audit
Le rapport doit indiquer le périmètre, les contrôles réalisés, les findings classés par gravité, les preuves, les corrections et les tests de non-régression. Ne jamais inclure de secret réel dans le rapport.

## Checklist
- [ ] Authentification serveur.
- [ ] Permission et rôle vérifiés.
- [ ] `companyId` imposé et testé.
- [ ] Entrées validées par Zod.
- [ ] Secrets absents des logs et du diff.
- [ ] Headers et rate limiting préservés.
- [ ] Tests négatifs exécutés.
