# Skill — Contract Negotiation
## Gestionnaire de paquets obligatoire

Utiliser exclusivement **pnpm 11.21.0** dans PROGITPAIE. Ne jamais utiliser `npm`, `npx` ou Yarn. Utiliser `pnpm`, `pnpm exec` et `pnpm-lock.yaml`.


## Objectif
Encadrer les fonctionnalités de contrats de travail, avenants, validations et règles de négociation dans un contexte RH sécurisé.

## Règles
Un contrat est une donnée RH sensible et tenant-scoped. Les transitions d’état doivent être explicites, autorisées par rôle et historisées. Les dates, montants, avantages, clauses et versions doivent être validés avec Zod à l’entrée et représentés par des types métier adaptés. Toute modification d’un contrat signé doit produire un avenant ou un événement d’historique, jamais une réécriture silencieuse.

## Procédure
1. Identifier les états autorisés : brouillon, soumis, validé, signé, suspendu, résilié.
2. Définir les préconditions de chaque transition dans le Domain.
3. Vérifier l’entreprise, le salarié, le rôle et les conflits de dates.
4. Utiliser `Money` pour toute rémunération ou indemnité.
5. Séparer le document source, les métadonnées et la décision d’approbation.
6. Auditer les changements et protéger les téléchargements.
7. Tester les transitions interdites, la concurrence et l’isolation tenant.

## Exemple de règle
```ts
if (contract.status === "SIGNED" && command.action === "EDIT") {
  throw new ContractStateError("Un contrat signé doit être modifié par avenant");
}
```

## Interdits
Modifier directement un contrat signé sans historique, accepter des dates ambiguës, exposer le document à une autre entreprise ou confondre le rôle de négociateur et celui d’approbateur sans règle explicite.

## Checklist
- [ ] Machine d’états définie.
- [ ] Autorisations et séparation des rôles contrôlées.
- [ ] Dates et montants validés.
- [ ] Historique/audit conservé.
- [ ] Téléchargements protégés.
- [ ] Tests des transitions et conflits ajoutés.
