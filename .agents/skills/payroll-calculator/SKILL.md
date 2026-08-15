# Skill — Payroll Calculator
## Gestionnaire de paquets obligatoire

Utiliser exclusivement **pnpm 11.21.0** dans PROGITPAIE. Ne jamais utiliser `npm`, `npx` ou Yarn. Utiliser `pnpm`, `pnpm exec` et `pnpm-lock.yaml`.


## Objectif
Modifier ou créer des calculs de paie exacts, explicables, testables et compatibles avec les règles métier et réglementaires du projet.

## Règles
Tous les montants utilisent `Money` depuis `lib/domain/payroll/money`. Les flottants et opérations arithmétiques monétaires dispersées sont interdits. Chaque formule doit expliciter sa base, son taux, sa période, son arrondi et son ordre d’application. Une modification réglementaire doit être isolée, versionnée si nécessaire et documentée.

## Procédure
1. Décrire la formule en unités métier avant d’écrire le code.
2. Identifier les données d’entrée, leur période et leur tenant.
3. Valider les entrées et les bornes avec des value objects ou Zod à la frontière.
4. Implémenter le calcul dans le Domain ou l’Application, jamais dans une route ou un composant.
5. Appliquer les arrondis à l’endroit défini par la règle, pas uniquement au total final.
6. Produire un résultat traçable : lignes, bases, taux, retenues, total et version de règle.
7. Tester les valeurs nulles, limites, décimales, régressions et scénarios multi-tenant.

## Exemple correct
```ts
const gross = Money.of(input.salary).add(Money.of(input.allowance));
const contribution = gross.multiply(rate).round(0);
const net = gross.subtract(contribution);
```

## Exemple interdit
```ts
const net = Number((salary + allowance - salary * rate).toFixed(2));
```

## Interdits
Modifier une formule sans tests de référence, mélanger des périodes, arrondir silencieusement, utiliser des nombres JavaScript pour comparer des centimes ou exposer une base de calcul non autorisée.

## Checklist
- [ ] Formule métier documentée.
- [ ] `Money` utilisé partout.
- [ ] Période, taux et arrondi explicites.
- [ ] Résultat explicable et auditable.
- [ ] Tests de précision, limites et régression.
