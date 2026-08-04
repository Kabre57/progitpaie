# Manifeste — STAGING-PROVISIONS-2025-R1

## Statut

- Fixture technique : **PRÊTE**
- Audit d'intégrité : **PASS**
- Validation automatisée du calculateur V2 : **PASS**
- Validation métier et signature responsable paie : **EN ATTENTE**
- Autorisation de production : **NON ACCORDÉE À CE STADE**

## Identification

- Date de référence : `2025-12-31T23:59:59.999Z`
- Version de règles exécutée : `CI-CCI-1977-PROVISIONS-2026.2`
- Tenant A : `progitpaie-default-001`
- Tenant B : `validation-tenant-b-r1`
- Seed : `scripts/seed-provision-validation-r1.ts`
- Audit structurel : `scripts/audit-provision-validation-r1.ts`
- Validation des résultats : `scripts/validate-provision-dataset-r1.ts`

## Sauvegardes

### Avant import

- Fichier hors Git : `backups/progitpaie_before_validation_r1_20260803.dump`
- Taille : `106815` octets
- SHA-256 : `c9ddee122ee9f837ce3008221ae951fdbcb8d750999c470ba1dee9f5fa81d586`

### Jeu figé après import

- Fichier hors Git : `backups/STAGING-PROVISIONS-2025-R1.dump`
- Taille : `119806` octets
- SHA-256 : `9e478dd8111cc5e1dac406ff74aca4e44e96d2bcb18316d0bad991291b5450ab`

## Contenu contrôlé

| Élément | Quantité |
|---|---:|
| Cas tenant A | 18 |
| Cas tenant B | 2 |
| Administrateurs de validation | 2 |
| Contrats | 20 |
| Paies finalisées | 204 |
| Lignes de rémunération | 444 |
| Écritures du registre de congés | 21 |
| Incohérences tenant | 0 |

C18 est volontairement absent du résultat au 31 décembre 2025, sa date d'embauche étant le 1er janvier 2026.

## Couverture des cas

- C01 : ancienneté inférieure à un an.
- C02 à C04 : tranches d'indemnité 30 %, 35 % et 40 %.
- C05 à C10 : paliers d'ancienneté 5, 10, 15, 20, 25 et 30 ans.
- C11 : congés consommés.
- C12 : congés compensés.
- C13 : six paies finalisées, historique incomplet.
- C14 : aucune paie, fallback contractuel.
- C15 : remboursement de frais exclu.
- C16 : prime éligible incluse.
- C17 : frontière exacte du palier de cinq ans.
- C18 : embauche postérieure à la référence.
- B01 et B02 : isolation et totaux du tenant B.

## Contrôles automatisés validés

- ancienneté minimale ;
- répartition des tranches ;
- paliers de jours supplémentaires ;
- congés consommés et compensés ;
- warning d'historique incomplet ;
- warning de fallback contractuel ;
- exclusion des remboursements ;
- inclusion des primes ;
- isolation A/B ;
- exclusion des comptes administrateurs des provisions.

## Point métier à arbitrer

La date de référence du jeu est en 2025 alors que `CI-CCI-1977-PROVISIONS-2026.2` déclare une date d'effet au 1er janvier 2026. Le calculateur applique actuellement cette version à 2025 sans résolution temporelle du jeu de règles. Le responsable paie doit confirmer l'une des décisions suivantes avant signature :

1. utiliser 2026 comme période de validation ;
2. fournir une version de règles applicable à 2025 ;
3. autoriser explicitement l'application rétroactive de la version 2026.2 au jeu 2025.

## Reproductibilité

Le seed est idempotent : les utilisateurs, contrats, paies, lignes et écritures utilisent des clés déterministes. Il ne relance pas `seed-111-employees.ts` et ne supprime aucune donnée importée. Les seules suppressions intégrées concernent les anciennes fixtures erronées C01/C13 et l'écriture pré-embauche C18, toutes identifiées par des IDs appartenant au présent jeu.

Après exécution, lancer successivement :

```bash
npx tsx scripts/audit-provision-validation-r1.ts
npx tsx scripts/validate-provision-dataset-r1.ts
```

Ces commandes nécessitent une `DATABASE_URL` pointant vers la base staging.
