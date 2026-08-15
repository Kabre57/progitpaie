# Skill — Employee Onboarding
## Gestionnaire de paquets obligatoire

Utiliser exclusivement **pnpm 11.21.0** dans PROGITPAIE. Ne jamais utiliser `npm`, `npx` ou Yarn. Utiliser `pnpm`, `pnpm exec` et `pnpm-lock.yaml`.


**Version : 1.0.0**  
**Domaine : intégration des nouveaux employés**

## Objectif
Implémenter un parcours sécurisé et traçable d’intégration d’un nouvel employé, depuis la collecte des informations jusqu’à son activation dans PROGITPAIE.

Cette compétence complète `.agents/AGENTS.md` et doit être associée à `clean-architecture`, `security-audit` et `testing` pour une fonctionnalité complète.

## Fonctionnalités couvertes

L’agent peut implémenter :

- la création d’un dossier salarié ;
- la validation des informations personnelles et professionnelles ;
- l’attribution d’un matricule unique dans l’entreprise ;
- l’affectation à un département, poste, rôle ou calendrier ;
- la collecte des informations contractuelles et bancaires nécessaires ;
- l’envoi ou la génération de tâches d’intégration ;
- la validation RH et l’activation du salarié ;
- l’import contrôlé de plusieurs employés.

## Règles métier obligatoires

Toute donnée salarié appartient à un `companyId`. L’email, le matricule et les identifiants métier doivent être contrôlés dans le périmètre de l’entreprise. Les informations obligatoires, les dates d’entrée, le type de contrat et les règles d’activation doivent être définis avant de créer le cas d’utilisation.

Les données personnelles et bancaires sont sensibles. Elles ne doivent pas être retournées dans les listes ou les logs sans nécessité. Les champs secrets ou hautement sensibles doivent utiliser les services de chiffrement existants. Une création partielle ne doit pas activer un salarié tant que les préconditions ne sont pas satisfaites.

L’activation doit être idempotente et auditée. Une invitation ou une notification ne doit pas révéler d’informations sensibles et doit pouvoir être rejouée sans créer de doublon.

## Architecture à créer ou modifier

| Couche | Responsabilité |
|---|---|
| Domain | Entité `Employee`, value objects, statut d’onboarding et invariants |
| Application | Cas d’utilisation de création, validation, invitation et activation |
| Infrastructure | Repository, transaction, chiffrement, email et persistance |
| Contrats | Schémas Zod, DTO minimisés et erreurs publiques |
| Presentation | Routes versionnées, formulaires, permissions et sérialisation |
| Tests | Unitaire, intégration, contrat, sécurité et E2E |

## Validation et sécurité

Valider avec Zod les données de formulaire, les imports, les dates, les emails et les fichiers éventuels. Vérifier le rôle avant chaque étape sensible. Les invitations doivent utiliser un mécanisme à durée limitée. Les exports, téléchargements et informations bancaires doivent être protégés et audités.

## Exemple correct

```ts
const employeeInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  joiningDate: z.coerce.date(),
  departmentId: z.string().uuid().optional(),
});

const session = await requireRole(["HR", "ADMIN"]);
const input = employeeInputSchema.parse(await request.json());

const employee = await createEmployeeUseCase.execute({
  ...input,
  companyId: session.companyId,
  actorId: session.userId,
});

return Response.json(toEmployeeDTO(employee), { status: 201 });
```

## Tests obligatoires

Tester les champs manquants, les emails invalides, les doublons de matricule ou d’email dans la même entreprise, l’absence de collision entre entreprises, les rôles interdits, l’idempotence de l’invitation, la protection des données sensibles et l’activation incomplète. Ajouter un E2E du parcours RH si la fonctionnalité est disponible dans l’interface.

## Checklist finale

- [ ] Statuts et préconditions d’activation définis.
- [ ] Matricule et email uniques dans le bon tenant.
- [ ] Données personnelles minimisées et protégées.
- [ ] Chiffrement utilisé pour les champs sensibles si nécessaire.
- [ ] RBAC, invitation limitée et audit présents.
- [ ] DTO et réponses ne révèlent pas le modèle Prisma.
- [ ] Tests de validation, sécurité, isolation et idempotence ajoutés.
- [ ] Documentation du parcours d’intégration mise à jour.
