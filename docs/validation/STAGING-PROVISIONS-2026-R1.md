# Manifeste — STAGING-PROVISIONS-2026-R1

## Décision temporelle

- Période validée : du 1er janvier au 3 août 2026.
- Date de référence : `2026-08-03T23:59:59.999Z`.
- Version : `CI-CCI-1977-PROVISIONS-2026.2`.
- Cohérence période/version : **PASS**.
- Réserve : validation complémentaire requise après clôture de décembre 2026.

## Statut

- Fixture technique : **PRÊTE**
- Audit structurel : **PASS**
- Validation automatisée V2 : **PASS**
- Isolation technique A/B : **PASS**
- Tableur indépendant responsable paie : **EN ATTENTE**
- Signature responsable paie : **EN ATTENTE**
- Décision de production : **NON ÉMISE**

## Sauvegardes

### Avant import 2026

- Fichier hors Git : `backups/progitpaie_before_validation_2026_r1_20260803.dump`
- Taille : `119806` octets
- SHA-256 : `ac1919d04fcd588e38e6cbaa24904ae708bfea55e59ec8c2e8a5853541af4c54`

### Jeu 2026 figé

- Fichier hors Git : `backups/STAGING-PROVISIONS-2026-R1.dump`
- Taille : `129303` octets
- SHA-256 : `5407ac1c3d3a90253444ac1d4a5fcaf9fe296622eb7df39febf83061dfc099b5`

## Contenu

| Élément | Quantité |
|---|---:|
| Cas tenant A | 18 |
| Cas tenant B | 2 |
| Administrateurs de validation | 2 |
| Contrats | 20 |
| Paies finalisées janvier-août | 138 |
| Lignes de rémunération | 300 |
| Écritures de congés | 21 |
| Incohérences tenant | 0 |

Les paies d'août sont finalisées au 2 août 2026, avant la référence du 3 août. C18 est embauché le 4 août et doit donc être absent du résultat.

## Couverture automatisée

- C01 : ancienneté insuffisante et non-éligibilité.
- C02–C04 : tranches 30 %, 35 % et 40 %.
- C05–C10 : bonus 1, 2, 3, 5, 7 et 8 jours.
- C11–C12 : congés consommés et compensés.
- C13 : quatre mois disponibles et warning d'historique incomplet.
- C14 : fallback contractuel.
- C15 : exclusion des remboursements de frais.
- C16 : inclusion des primes éligibles.
- C17 : frontière exacte du palier de cinq ans.
- C18 : exclusion avant date d'embauche.
- B01–B02 : isolation tenant et totaux distincts.

## Correction issue de la validation

Le gateway filtrait les employés par rôle mais chargeait encore les paies et écritures de congés des administrateurs. Une écriture migrée appartenant à `admin-user-001` a permis de détecter cette incohérence. Les trois chargements sont désormais uniformément bornés à `role = employee`. Aucune écriture historique n'a été supprimée.

## Scripts

- `scripts/seed-provision-validation-2026-r1.ts`
- `scripts/audit-provision-validation-2026-r1.ts`
- `scripts/validate-provision-dataset-2026-r1.ts`

Le seed est transactionnel et idempotent. Les jeux 2025 et 2026 utilisent des identifiants distincts et peuvent coexister.

## Réserve de signature

Le statut automatisé `PASS` ne constitue pas une validation juridique ou une signature paie. Le responsable paie doit comparer les résultats à un tableur indépendant, confirmer les montants avec une tolérance interne de zéro et signer le rapport avec la réserve portant sur septembre-décembre 2026.
