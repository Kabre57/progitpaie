# Migration de l'API Provisions vers V2

## Statut

La V2 est disponible à `/api/v2/payroll/provisions`. La route `/api/payroll/provisions` reste un adaptateur de compatibilité déprécié.

La suppression legacy est préparée mais ne doit pas être appliquée avant la satisfaction de tous les gates documentés dans `provisions-legacy-removal-draft-pr.md`.

## Correspondance des contrats

| Contrat historique | Contrat V2 |
|---|---|
| `name` | `employeeName` |
| `grossMonthly` | `averageMonthlySalary` |
| `leaveDaysAccrued` | `closingBalanceDays` |
| `retirementProvisions` | `terminationBenefits` |
| `totalRetirementProvision` | `totalTerminationExposure` |
| total calculé | `totalExposure` |

Les noms historiques liés à la retraite sont conservés uniquement dans la couche de compatibilité. Ils ne représentent pas une provision retraite dans le domaine V2.

## Activation frontend

La valeur actuelle est résolue au build :

```text
NEXT_PUBLIC_PROVISIONS_API_VERSION=legacy | v2
```

Avant suppression, l'artefact frontend de production doit être construit avec `v2`, déployé et observé pendant au moins sept jours.

## Rollback avant suppression

Tant que la route legacy existe, le rollback frontend consiste à redéployer l'artefact construit avec `legacy`. Après suppression, le rollback exige le redéploiement coordonné de l'artefact backend précédent et de l'artefact frontend compatible.

## Date de suppression

- Date de suppression : À RENSEIGNER

Cette date doit être remplacée par une date ISO `YYYY-MM-DD` après validation métier, observation et approbation finale.
