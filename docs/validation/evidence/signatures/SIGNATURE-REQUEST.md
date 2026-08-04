# Demande de Signature — Provisions V2

> Source autoritative des signatures du gatekeeper :
> `docs/validation/phase-e-day4-validation-report.md`.
> Les copies de rapports présentes dans ce dossier sont des instantanés d'archive et ne sont pas lues par le gatekeeper.

## Objet
Certification de la nouvelle API Provisions V2 avant suppression de l'API historique.

## Contexte
- Projet : PROGITPAIE
- Module : Provisions RH (congés + indemnité de licenciement)
- Version : CI-CCI-1977-PROVISIONS-2026.2
- Date de référence : 2026-08-03

## Ce qui a été fait
1. Moteur de calcul V2 conforme au Code du Travail de Côte d'Ivoire
2. Rapprochement métier : **418/418 PASS** (20 cas de validation)
3. Tests : **216/216 unitaires**, E2E locaux 2/2
4. Répétition locale du rollback : **3 secondes** ; exercice staging encore requis
5. Isolation multi-tenant vérifiée
6. Sécurité locale : `.env` retiré de l'index et fallbacks supprimés ; rotation distante et purge de l'historique encore requises

## Ce que je certifie

### Responsable Technique
- [ ] Le code est conforme aux standards de qualité
- [ ] Les tests sont suffisants et passent (216/216)
- [ ] L'architecture est solide et maintenable
- [ ] Le déploiement est sécurisé
- [ ] Le rollback est possible et testé

### Responsable Sécurité
- [ ] Les données sensibles sont protégées
- [ ] L'authentification et l'autorisation sont correctes
- [ ] L'isolation multi-tenant est effective
- [ ] Les secrets ne sont pas exposés
- [ ] Les logs ne contiennent pas de données sensibles

## Preuves jointes
1. Rapport de validation (`phase-e-day4-validation-report.md`)
2. Différences de comparaison (`phase-e-day4-differences.csv`)
3. Classeur de référence (`reference-provisions-2026.xlsx`)
4. Checksum (`reference-provisions-2026.sha256`)
5. Rapport architectural (`implementation-status-report.md`)
6. Procédure de rollback (`docs/rollback/provisions-legacy-rollback.md`)

## Signatures
- **Responsable paie** : Kabre Theodore — Date : 2026-08-04 ✅
- **Responsable technique** : Yao aya ange — Date : 2026-08-04
- **Responsable sécurité** : Noham Edwin — Date : 2026-08-04

## Décision
- [ ] GO pour le déploiement V2 en production
- [ ] GO pour la suppression de l'API historique (après observation 7 jours)

---

**Pour valider** : Signer ci-dessus et dater.
