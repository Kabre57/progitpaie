# Rollback — Suppression de l'API Provisions legacy

Status: VALIDATED
Tested-At: 2026-08-05T12:05:42Z

## Déclencheurs

- erreur 404 provenant d'un consommateur legacy ;
- écran administrateur inutilisable ;
- erreur d'isolation tenant ;
- augmentation anormale des erreurs V2 ;
- demande de rollback métier ou sécurité.

## Préconditions

- artefact backend précédent disponible ;
- artefact frontend précédent disponible ;
- identifiants des commits et images consignés ;
- opérateur habilité présent ;
- fenêtre d'intervention annoncée.

## Procédure

1. Redéployer l'artefact backend contenant `/api/payroll/provisions`.
2. Vérifier la disponibilité de la route V2 et de l'adaptateur legacy.
3. Si nécessaire, redéployer le frontend compatible legacy.
4. Vérifier les sessions administrateur des tenants A et B.
5. Contrôler `Cache-Control: private, no-store, max-age=0`.
6. Contrôler les headers de dépréciation de l'adaptateur.
7. Surveiller les erreurs et appels pendant la période définie par l'incident.

## Vérifications post-rollback

- route legacy accessible uniquement aux administrateurs authentifiés ;
- route V2 toujours accessible ;
- montants cohérents entre V2 et projection legacy ;
- aucune fuite inter-tenant ;
- frontend fonctionnel ;
- erreurs revenues au niveau nominal.

## Preuve du test

- **Environnement** : isolated-test
- **Date UTC** : 2026-08-05T12:05:42Z
- **Opérateur** : Kabre Theodore
- **Commit testé** : 6317e77c68c2a1f9fbaf81c13faf7865e843a610
- **Artefacts** : Docker image `progitpaie-app-isolated` avec adaptateur legacy
- **Durée** : 12 minutes
- **Résultat** : SUCCESS (Isolation maintenue, 0 fuite inter-tenant, fallback V2/legacy opérationnel)

Ce document est au statut `VALIDATED` à la suite de l'exercice de rollback réussi sur environnement isolé.
