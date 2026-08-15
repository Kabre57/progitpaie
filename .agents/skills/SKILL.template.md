# Skill — [Nom de la compétence]

**Version : 1.0.0**  
**Projet : PROGITPAIE**  
**Domaine : [architecture | métier | sécurité | tests | administration | autre]**  
**Statut : modèle réutilisable**  
**Gestionnaire de paquets obligatoire : pnpm 11.21.0**

## 0. Gestionnaire de paquets obligatoire

Dans PROGITPAIE, utiliser exclusivement **pnpm 11.21.0**. Ne jamais proposer ou exécuter `npm`, `npx` ou Yarn. Utiliser `pnpm`, `pnpm exec` et le fichier `pnpm-lock.yaml`. Toute commande fournie dans cette compétence doit respecter cette règle.

## 1. Objectif

Décrire en une ou deux phrases ce que cette compétence permet à l’agent de réaliser et dans quel contexte elle doit être utilisée.

Cette compétence complète `.agents/AGENTS.md`. En cas de conflit, les règles de `.agents/AGENTS.md` sont prioritaires.

## 2. Quand utiliser cette compétence

Utiliser cette compétence lorsque la demande concerne :

- [Cas d’utilisation 1].
- [Cas d’utilisation 2].
- [Cas d’utilisation 3].

Ne pas utiliser cette compétence pour :

- [Cas hors périmètre 1].
- [Cas hors périmètre 2].

## 3. Contexte projet à respecter

Avant toute modification, l’agent doit vérifier les éléments suivants :

| Élément | Emplacement ou règle |
|---|---|
| Règles générales | `.agents/AGENTS.md` |
| Domaine concerné | `lib/domain/[contexte]/` |
| Cas d’utilisation | `lib/application/[contexte]/` |
| Adaptateurs | `lib/infrastructure/[contexte]/` |
| Routes et contrats | `app/api/v2/[contexte]/` |
| Tests | fichiers `*.test.ts`, `*.test.tsx` et dossiers `e2e/` |

L’agent doit rechercher une implémentation existante avant d’en créer une nouvelle et doit respecter les conventions déjà utilisées dans le sous-domaine.

## 4. Règles obligatoires

Les règles suivantes sont obligatoires pour toute intervention relevant de cette compétence :

1. Respecter la Clean Architecture : le Domain reste indépendant de Next.js, Prisma et HTTP.
2. Utiliser TypeScript strict et ne jamais introduire `any`.
3. Valider toute donnée externe avec Zod.
4. Filtrer toutes les opérations de données par `companyId` lorsque la donnée est tenant-scoped.
5. Utiliser les services métier existants, notamment `Money` pour les montants.
6. Préserver les contrats API, les permissions, les logs d’audit et les headers de sécurité.
7. Ajouter ou mettre à jour les tests correspondant au comportement modifié.
8. Ne pas supprimer un test, désactiver une règle de lint ou masquer une erreur pour faire passer la validation.

## 5. Procédure d’exécution

### Étape 1 — Comprendre la demande

Identifier le résultat attendu, le périmètre, les contraintes, les utilisateurs concernés et les données sensibles manipulées. En cas d’ambiguïté métier, formuler une hypothèse explicite au lieu d’inventer une règle silencieuse.

### Étape 2 — Inspecter le code existant

Lire `.agents/AGENTS.md`, les fichiers directement concernés, les tests voisins et les ports ou services déjà disponibles. Ne pas analyser tout le dépôt si la demande est limitée à un sous-domaine.

### Étape 3 — Définir la conception

Décrire les changements par couche :

| Couche | Changement prévu |
|---|---|
| Domain | [entité, value object ou invariant] |
| Application | [use case, DTO, port ou mapper] |
| Infrastructure | [repository ou service concret] |
| Presentation | [schéma Zod, route ou composant] |
| Tests | [tests unitaires, intégration, contrat ou E2E] |
| Documentation | [fichier ou section à mettre à jour] |

### Étape 4 — Implémenter

Effectuer des modifications ciblées. Réutiliser les abstractions existantes. Maintenir l’isolation tenant, les contrôles de rôle et la gestion d’erreurs. Ne pas réaliser de refactorisation générale non nécessaire à la demande.

### Étape 5 — Vérifier

Exécuter les tests les plus proches du changement, puis les contrôles adaptés au risque :

```bash
pnpm lint
pppnpm test -- --runInBand [chemin-du-test]
ppnpm test:e2e -- [fichier-ou-projet]
```

Si une commande n’est pas nécessaire ou ne peut pas être exécutée, le signaler clairement avec la raison.

### Étape 6 — Restituer

Présenter les fichiers modifiés, le comportement ajouté ou corrigé, les tests exécutés, les éventuelles limites et les actions restantes. Ne pas prétendre qu’un contrôle a été exécuté s’il ne l’a pas été.

## 6. Règles métier ou techniques spécifiques

Remplacer cette section par les règles propres à la compétence.

Exemple :

> Toute opération doit être exécutée dans le contexte de l’entreprise authentifiée. Une ressource identifiée par `id` ne doit jamais être chargée sans le filtre `companyId`.

Exemple :

```ts
const entity = await repository.findById({
  id: input.id,
  companyId: session.companyId,
});
```

## 7. Exemple correct

```ts
const inputSchema = z.object({
  id: z.string().uuid(),
});

type Input = z.infer<typeof inputSchema>;

export async function execute(request: Request): Promise<Response> {
  const session = await requireSession();
  const input: Input = inputSchema.parse(await request.json());

  const result = await useCase.execute({
    ...input,
    companyId: session.companyId,
  });

  return Response.json(result);
}
```

Pourquoi cet exemple est correct : l’entrée est validée, la session fournit le tenant, le cas d’utilisation porte la logique et la route ne dépend pas directement d’un modèle Prisma.

## 8. Exemple incorrect

```ts
export async function POST(request: Request) {
  const body: any = await request.json();
  const employee = await prisma.employee.findUnique({
    where: { id: body.id },
  });

  return Response.json(employee);
}
```

Problèmes : `any` est utilisé, l’entrée n’est pas validée, Prisma est appelé directement depuis la route, `companyId` est absent, l’autorisation n’est pas vérifiée et le modèle de persistance est exposé directement.

## 9. Gestion des erreurs

Les erreurs externes doivent être traitées comme `unknown`. Les erreurs métier doivent être converties en réponses contrôlées sans révéler de détails sensibles. Les erreurs doivent être journalisées côté serveur avec un identifiant de corrélation, sans secret, token, mot de passe, salaire ou donnée personnelle inutile.

```ts
try {
  return Response.json(await useCase.execute(input));
} catch (error: unknown) {
  logger.error({ error, correlationId }, "Échec de l’opération");
  return Response.json(
    { error: "Une erreur est survenue", correlationId },
    { status: 500 },
  );
}
```

## 10. Tests obligatoires

Ajouter les tests correspondant au risque :

- **Unitaire** : règles métier, invariants, cas limites et erreurs.
- **Intégration** : repository, mapping, transaction et isolation tenant.
- **Contrat/API** : validation Zod, statuts, payloads et permissions.
- **E2E** : parcours utilisateur critique ou opération sensible.

Les scénarios négatifs doivent couvrir au minimum : entrée invalide, utilisateur non authentifié, rôle insuffisant et accès à une donnée d’un autre `companyId` lorsque cela s’applique.

## 11. Sécurité et confidentialité

Vérifier l’authentification serveur, le rôle requis, la minimisation des données retournées, les headers de sécurité, le rate limiting et l’absence de secrets dans le code, les logs et les réponses. Toute fonctionnalité d’administration ou d’export doit être auditée.

## 12. Checklist finale

- [ ] `.agents/AGENTS.md` a été lu.
- [ ] Le périmètre de la compétence est respecté.
- [ ] Les fichiers existants ont été recherchés avant création.
- [ ] Les dépendances entre couches sont correctes.
- [ ] Aucun `any` n’a été introduit.
- [ ] Toutes les entrées externes utilisent Zod.
- [ ] `companyId` est contrôlé lorsque nécessaire.
- [ ] Les montants utilisent `Money` lorsque nécessaire.
- [ ] Authentification, rôle et audit sont vérifiés.
- [ ] Tests unitaires et autres tests pertinents sont présents.
- [ ] Lint et tests ciblés ont été exécutés.
- [ ] La documentation est à jour.
- [ ] Le diff ne contient aucun secret ni changement hors périmètre.

## 13. Format de restitution de l’agent

À la fin de l’intervention, l’agent doit répondre avec ce format :

```text
## Résumé
[Ce qui a été réalisé]

## Fichiers modifiés
- [chemin] — [rôle du changement]

## Vérifications
- [commande] — [résultat]

## Points d’attention
[Limites, hypothèses ou travaux restant à faire]
```
