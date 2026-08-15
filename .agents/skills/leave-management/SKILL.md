# Skill — Leave Management
## Gestionnaire de paquets obligatoire

Utiliser exclusivement **pnpm 11.21.0** dans PROGITPAIE. Ne jamais utiliser `npm`, `npx` ou Yarn. Utiliser `pnpm`, `pnpm exec` et `pnpm-lock.yaml`.


**Version : 1.0.0**  
**Domaine : gestion des absences et congés**

## Objectif
Implémenter ou faire évoluer la gestion des demandes d’absence dans PROGITPAIE, depuis la création jusqu’à l’approbation, au refus, à l’annulation et au suivi des soldes.

Cette compétence complète `.agents/AGENTS.md` et doit être utilisée avec `clean-architecture` et `testing` lorsque la fonctionnalité modifie plusieurs couches.

## Fonctionnalités couvertes

L’agent peut implémenter :

- la création d’une demande d’absence ;
- la consultation des demandes de l’entreprise courante ;
- la consultation d’une demande par identifiant ;
- l’approbation ou le refus par un rôle autorisé ;
- l’annulation selon l’état de la demande ;
- le contrôle des chevauchements et des dates ;
- le calcul ou la consultation du solde lorsqu’il existe dans le domaine ;
- les notifications et l’audit associés.

## Règles métier obligatoires

Une demande appartient à un salarié et à un `companyId`. Les dates de début et de fin sont obligatoires, cohérentes et interprétées dans le fuseau horaire métier du projet. Une demande ne peut pas être approuvée si elle chevauche une absence déjà approuvée ou si le solde disponible est insuffisant lorsque cette règle s’applique.

Les états doivent être explicites, par exemple `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED` et `CANCELLED`. Une demande approuvée ne doit pas être modifiée directement ; elle doit suivre le workflow prévu par le domaine. Un salarié ne peut pas approuver sa propre demande. Toute approbation, tout refus ou toute annulation doit être autorisé par rôle et audité.

## Architecture à créer ou modifier

| Couche | Responsabilité |
|---|---|
| Domain | Entité `Leave`, états, règles de dates, chevauchement et transitions |
| Application | `CreateLeaveUseCase`, `ListLeavesUseCase`, `ApproveLeaveUseCase`, `RejectLeaveUseCase` |
| Infrastructure | Repository Prisma, mapping, transaction et requêtes filtrées par `companyId` |
| Contrats | Schémas Zod, DTO, erreurs et version d’API |
| Presentation | Routes `app/api/v2/leaves/`, authentification et RBAC |
| Tests | Domain, use cases, repository, contrats, isolation et E2E |

## Validation et sécurité

Toutes les entrées utilisent Zod. Le `companyId` est obtenu depuis la session ou le contexte serveur authentifié. Une ressource ne doit jamais être chargée par `id` seul. Les réponses ne retournent que les champs nécessaires et les événements sont journalisés sans données sensibles inutiles.

## Exemple correct

```ts
const inputSchema = z.object({
  employeeId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: z.enum(["ANNUAL", "SICK", "UNPAID"]),
});

const input = inputSchema.parse(await request.json());
const session = await requireRole(["EMPLOYEE", "HR", "ADMIN"]);

return Response.json(await createLeaveUseCase.execute({
  ...input,
  companyId: session.companyId,
  actorId: session.userId,
}));
```

## Tests obligatoires

Ajouter les tests des dates inversées, des dates limites, des chevauchements, du solde insuffisant, des transitions interdites, de l’auto-approbation, des rôles insuffisants et de l’accès inter-tenant. Ajouter un E2E pour le parcours création puis approbation si le workflow est exposé à l’utilisateur.

## Checklist finale

- [ ] Entité et transitions métier définies.
- [ ] Dates, chevauchements et solde validés.
- [ ] `companyId` appliqué à chaque lecture et mutation.
- [ ] RBAC et audit ajoutés.
- [ ] Zod et DTO présents.
- [ ] Tests unitaires, intégration, contrat et E2E pertinents ajoutés.
- [ ] Documentation du workflow mise à jour.
