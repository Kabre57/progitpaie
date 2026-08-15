# Skill — Expense Management
## Gestionnaire de paquets obligatoire

Utiliser exclusivement **pnpm 11.21.0** dans PROGITPAIE. Ne jamais utiliser `npm`, `npx` ou Yarn. Utiliser `pnpm`, `pnpm exec` et `pnpm-lock.yaml`.


**Version : 1.0.0**  
**Domaine : gestion des dépenses et remboursements professionnels**

## Objectif
Implémenter un workflow sécurisé de déclaration, validation, approbation, remboursement et suivi des dépenses professionnelles.

Cette compétence complète `.agents/AGENTS.md` et doit être associée à `clean-architecture`, `payroll-calculator`, `security-audit` et `testing` lorsque les dépenses influencent la paie ou la comptabilité.

## Fonctionnalités couvertes

L’agent peut implémenter :

- la création d’une note de frais ;
- l’ajout de lignes de dépenses et de justificatifs ;
- la catégorisation et le contrôle des plafonds ;
- la soumission à validation ;
- l’approbation, le rejet ou la demande de correction ;
- le calcul du remboursement ;
- l’intégration dans la paie ou la comptabilité lorsque le contrat le prévoit ;
- l’export contrôlé et le suivi d’audit.

## Règles métier obligatoires

Chaque dépense appartient à un salarié et à un `companyId`. Une ligne doit contenir une date, un montant, une devise, une catégorie et, lorsque requis, un justificatif. Les montants utilisent `Money` et les devises doivent être explicites. Les plafonds, règles de TVA, frais kilométriques et taux de conversion ne doivent pas être inventés : ils doivent provenir d’une configuration ou d’une règle métier validée.

Les états doivent être explicites, par exemple `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `PAID` et `CANCELLED`. Une dépense payée ne doit pas être modifiée silencieusement. Toute approbation, tout rejet, remboursement ou export doit être autorisé, audité et idempotent.

Le demandeur ne doit pas approuver sa propre dépense lorsque la séparation des tâches est exigée. Les justificatifs sont des documents sensibles : leur accès doit être vérifié à chaque téléchargement.

## Architecture à créer ou modifier

| Couche | Responsabilité |
|---|---|
| Domain | Entités `ExpenseReport`, `ExpenseLine`, value objects Money, devise, état et règles de plafond |
| Application | Cas d’utilisation de création, soumission, validation, rejet, paiement et export |
| Infrastructure | Repository, stockage des justificatifs, transaction, conversion et intégrations |
| Contrats | Zod, DTO, upload sécurisé, statuts et erreurs |
| Presentation | Routes versionnées, RBAC, téléchargements et interface de suivi |
| Tests | Calculs, workflow, tenant isolation, fichiers, sécurité et E2E |

## Validation et sécurité

Valider avec Zod les montants, devises, catégories, dates, identifiants et métadonnées de fichier. Refuser les montants négatifs ou les devises non supportées. Contrôler le type, la taille et le contenu des justificatifs avant stockage. Ne jamais faire confiance au nom de fichier fourni par le client.

Le `companyId` et l’identité du demandeur proviennent de la session. Les téléchargements de justificatifs doivent vérifier la permission et l’entreprise. Les logs ne doivent pas contenir le contenu des documents, les coordonnées bancaires ou des données personnelles inutiles.

## Exemple correct

```ts
const expenseSchema = z.object({
  amount: z.number().finite().positive(),
  currency: z.enum(["XOF", "EUR"]),
  category: z.string().min(1).max(80),
  spentAt: z.coerce.date(),
});

const input = expenseSchema.parse(await request.json());
const session = await requireRole(["EMPLOYEE", "MANAGER", "HR", "ADMIN"]);

const result = await createExpenseUseCase.execute({
  ...input,
  amount: Money.of(input.amount),
  companyId: session.companyId,
  employeeId: session.employeeId,
  actorId: session.userId,
});
```

## Tests obligatoires

Tester les montants nuls, négatifs et décimaux, les devises non autorisées, les plafonds, les doublons de soumission, les transitions interdites, la séparation des tâches, les accès aux justificatifs, l’isolation inter-tenant et l’intégration éventuelle avec la paie ou la comptabilité. Ajouter un E2E du workflow de soumission et d’approbation lorsque le parcours est disponible.

## Checklist finale

- [ ] Montants représentés par `Money` et devises explicites.
- [ ] États et transitions définis.
- [ ] Plafonds et règles de remboursement sourcés dans la configuration métier.
- [ ] `companyId` et identité du demandeur imposés côté serveur.
- [ ] Justificatifs validés, stockés et téléchargés de manière sécurisée.
- [ ] RBAC, séparation des tâches, audit et idempotence présents.
- [ ] Tests de calcul, workflow, fichiers, sécurité et isolation ajoutés.
- [ ] Intégrations paie/comptabilité documentées et testées si concernées.
