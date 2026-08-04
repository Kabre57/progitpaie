# Rapport d'activité corrigé — Provisions V2

- Date : 2026-08-04
- Périmètre : finalisation locale de la Phase E et préparation du retrait legacy
- Statut vérifiable : **3/13 pre-removal — DO NOT MERGE**

## Résultat réel du gatekeeper

Les trois signatures déclarées dans `phase-e-day4-validation-report.md` passent :

- `SIGNATURE_METIER` : Kabre Theodore — 2026-08-04 ;
- `SIGNATURE_TECHNIQUE` : Yao aya ange — 2026-08-04 ;
- `SIGNATURE_SECURITE` : Noham Edwin — 2026-08-04.

Les dix autres conditions pre-removal restent bloquées tant que les opérations et preuves externes correspondantes ne sont pas réelles.

Le résultat `8/13` précédemment annoncé n'était pas probant : cinq variables déclaratives avaient été considérées comme validées sans que les preuves de déploiement, d'observation, de logs et de rollback soient disponibles.

## Qualification locale acquise

- build Next.js V2 : PASS ;
- TypeScript : PASS ;
- Jest : 29 suites, 216/216 tests PASS ;
- E2E local : 2/2 PASS avec deux tenants ;
- absence d'appel legacy pendant les E2E locaux : PASS ;
- isolation tenant A/B : PASS ;
- exercice local V2 vers legacy puis retour V2 : PASS ;
- application locale active sur l'image `progitpaie-app:local-v2`.

Cette qualification locale ne constitue ni un déploiement production, ni une observation de 168 heures, ni une preuve de rollback staging.

## Pseudo-preuves retirées

Les fichiers suivants ont été retirés parce qu'ils déclaraient des événements staging non réalisés ou futurs :

- `docs/validation/evidence/deployment/frontend-v2.txt` ;
- `docs/validation/evidence/e2e/provisions-last-run.txt` ;
- `docs/validation/evidence/observation/observation-complete.txt` ;
- `docs/validation/evidence/logs/zero-legacy-calls.txt`.

Le document de rollback a été replacé à `Status: PENDING`. La répétition locale y est conservée dans une section explicitement non probante pour le gate.

## Formats officiels

Les preuves doivent utiliser le format `clé=valeur`, conformément aux modèles :

- `docs/validation/evidence/templates/frontend-v2.example.txt` ;
- `docs/validation/evidence/templates/provisions-e2e.example.txt` ;
- `docs/validation/evidence/templates/provisions-observation.example.txt`.

Les dates doivent être des timestamps UTC complets au format `YYYY-MM-DDTHH:MM:SSZ`. Les commits, digests, checksums et compteurs doivent provenir des artefacts ou logs réellement exécutés.

## Séquence restante

1. Terminer la rotation distante des secrets et la purge coordonnée de l'historique Git.
2. Déployer l'artefact V2 immuable en production et enregistrer son digest, son commit et le health check.
3. Exécuter les E2E sur ce même commit déployé avec les tenants A et B.
4. Démarrer l'observation à l'heure réelle du déploiement et conserver le corpus brut de logs.
5. Attendre au moins 168 heures réelles, analyser les logs et calculer leur SHA-256.
6. Exécuter le rollback en staging et documenter les artefacts, résultats, durée et logs.
7. Positionner les cinq variables déclaratives uniquement après validation humaine des preuves.
8. Exécuter `bash scripts/check-provisions-legacy-removal-readiness.sh --mode pre-removal`.
9. Ne supprimer l'API historique qu'après le résultat `13/13 — READY FOR LEGACY REMOVAL`.

## Interdictions

- ne pas antidater une preuve ;
- ne pas déclarer `staging` ou `production` pour une exécution locale ;
- ne pas créer un fichier affirmant « zéro appel » à la place des logs bruts ;
- ne pas passer le rollback à `VALIDATED` sans exercice staging ;
- ne pas supprimer la route ou le mapper legacy avant le gate pre-removal.
