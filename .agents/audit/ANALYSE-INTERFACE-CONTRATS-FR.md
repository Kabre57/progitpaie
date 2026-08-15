# Analyse et amélioration de l’interface des contrats

**Version :** 1.0.0  
**Date :** 12 août 2026  
**Périmètre :** modal de création, vue manager et vue RH experte

## 1. Constat initial

Le modal affichait plusieurs libellés anglais, notamment `New Contract`, `Manager View (Simplified)` et `Expert HR View (Detailed)`. Il proposait aussi des champs comme département, type de temps de travail, devise, notes et matricule alors que le contrat V2 ne les persistait pas dans son schéma ni dans le cas d’utilisation. Ces champs créaient un risque d’illusion fonctionnelle : l’utilisateur pouvait modifier une valeur sans qu’elle soit enregistrée.

Le schéma de création V2 prend en charge le salarié, le type, la catégorie, le poste, les dates, la période d’essai, le salaire de base, le sursalaire, les indemnités et le document associé. L’interface a été réalignée sur ce périmètre.

## 2. Changements réalisés

| Zone | Avant | Après |
|---|---|---|
| Titre | `New Contract` | `Nouveau contrat` |
| Vues | Manager/HR en anglais | `Vue manager — simplifiée` et `Vue RH experte — détaillée` |
| Salarié | `Employee`, sélection anglaise | `Salarié`, sélection française |
| Nature | valeurs `Permanent`, `Fixed-Term`, `Internship` | `CDI`, `CDD`, `STAGE` |
| Dates | date de début uniquement | date de prise de fonction et date de fin obligatoire pour CDD/STAGE |
| Période d’essai | mois anglais | libellés français et valeur envoyée à l’API |
| Champs non persistés | département, temps de travail, devise, notes, matricule éditables | retirés du flux de création pour éviter une perte silencieuse |
| Vue manager | négociation salariale en anglais | net à payer, charges, coût employeur et options en français |
| Vue RH experte | paramètres de réforme présentés comme établis | paramètres marqués comme indicatifs et à valider localement |

## 3. Contrôle fonctionnel

Le formulaire envoie désormais `endDate` et `probationPeriodMonths`, qui sont réellement supportés par le contrat V2. Les contrats CDD et STAGE exigent une date de fin côté interface et côté domaine. Les montants continuent d’être calculés par le service de paie existant.

Les taux et paramètres affichés dans la simulation experte ne doivent pas être considérés comme une certification réglementaire. Le référent paie ivoirien doit compléter le registre `.agents/audit/REGISTRE-REGLES-PAIE-COTE-DIVOIRE.md` et approuver chaque règle avant production.

## 4. Contrôles exécutés

| Contrôle | Résultat |
|---|---|
| `pnpm install --frozen-lockfile --ignore-scripts` | Réussi |
| `pnpm prisma:generate` | Réussi |
| `pnpm exec tsc --noEmit` | Réussi |
| `pnpm lint` | Réussi, 520 avertissements globaux, 0 erreur |
| ESLint ciblé sur les trois composants contrat | Réussi, 0 erreur et 0 avertissement après nettoyage |
| `pnpm test` | 70 suites et 312 tests réussis |

## 5. Limites restantes

Les champs département, temps de travail, devise et notes peuvent être ajoutés ultérieurement, mais uniquement après extension coordonnée du Domain, du cas d’utilisation, du schéma Zod, du modèle Prisma, des migrations et des tests. Ils ne doivent pas être réintroduits comme simples champs locaux dans le formulaire.
