# ADR-006 — Versionner les règles ivoiriennes de provisions V2

- Statut : proposé, en attente de validation formelle du responsable paie
- Date : 2026-08-03

## Contexte

La route historique de provisions mélange les congés payés et une prétendue
« provision retraite », utilise une assiette forfaitaire et ne permet pas de
reconstituer précisément les règles appliquées. Les calculs financiers doivent
être reproductibles, isolés par société et indépendants de Prisma et de l'API.

## Décision

Créer un `ProvisionRuleSet` immuable et daté, identifié par
`CI-CCI-1977-PROVISIONS-2026.2`. Cette version retient :

- 2,2 jours ouvrables acquis par mois de service effectif ;
- les majorations d'ancienneté 1/2/3/5/7/8, appliquées intégralement dès le
  seuil atteint et sans cumul des paliers ;
- les méthodes du dixième et du maintien de salaire, avec sélection de la plus
  favorable ;
- une proratisation du dixième selon le solde sur les droits de la période ;
- une valorisation des reports au salaire courant, accompagnée d'un warning ;
- une moyenne des douze dernières paies validées ;
- le barème de licenciement 30 % / 35 % / 40 %, avec fractions d'année
  calculées au mois inférieur et une ancienneté minimale de douze mois ;
- un diviseur de 26 pour la méthode du maintien, puisque les droits sont
  exprimés en jours ouvrables.

Le diviseur demeure un paramètre de type `26 | 30`. La valeur 26 doit être
confirmée par le responsable paie avant que la V2 ne devienne la source de
vérité en production.

## Options considérées

### Diviseur 26

- cohérent avec un décompte en jours ouvrables ;
- évite de mélanger jours calendaires et droits conventionnels ;
- nécessite une validation de l'applicabilité conventionnelle à PROGITPAIE.

### Diviseur 30

- courant dans certains calculs mensualisés ;
- incompatible sans justification avec un solde exprimé en jours ouvrables.

### Règles codées directement dans les calculateurs

- plus simple à court terme ;
- rejeté car non traçable et impossible à faire évoluer par date d'effet.

## Conséquences

### Positives

- chaque résultat pourra indiquer la version exacte des règles ;
- les taux restent des chaînes décimales compatibles avec `Money` ;
- les contrats V2 distinguent clairement congés et licenciement ;
- une modification juridique future créera une nouvelle version sans altérer
  les snapshots historiques.

### Négatives et risques

- le calcul V2 ne doit pas être activé avant validation du diviseur ;
- le modèle actuel ne ventile pas encore les remboursements de frais ;
- le registre des congés et les snapshots persistants restent à migrer ;
- valoriser les reports au salaire courant est une convention qui doit rester
  visible dans les warnings.

## Plan d'application

1. Valider et accepter le présent ADR.
2. Ajouter le ledger, les lignes de rémunération et les snapshots.
3. Injecter le rule set dans les calculateurs V2.
4. Exposer la V2 sans modifier le contrat historique.
5. Déprécier l'ancien contrat après tests de rapprochement.

## Références

- Convention collective interprofessionnelle de Côte d'Ivoire, articles sur
  les congés et l'indemnité de licenciement.
- ADR-002 — Extension Prisma multi-tenant.
