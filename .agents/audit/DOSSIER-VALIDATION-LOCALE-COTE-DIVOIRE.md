# Dossier de validation locale — PROGITPAIE

**Statut :** À faire valider par des professionnels en Côte d’Ivoire  
**Version :** 1.0.0  
**Date :** 12 août 2026

> La remédiation technique ne constitue pas une validation juridique locale. Ce dossier organise les preuves à remettre à un expert ivoirien ; il ne remplace ni son analyse ni les formalités auprès des autorités compétentes.

## 1. Responsables de validation

| Rôle | Nom | Signature/date | Périmètre |
|---|---|---|---|
| Référent paie ivoirien | À désigner | À compléter | Formules, assiettes, taux, plafonds et exceptions |
| Expert droit social ivoirien | À désigner | À compléter | Contrats, congés, absences, heures supplémentaires et ruptures |
| Expert fiscal ivoirien | À désigner | À compléter | ITS, retenues, déclarations et échéances |
| Référent protection des données | À désigner | À compléter | Loi n° 2013-450, traitements RH, conservation et transferts |
| Responsable technique | À désigner | À compléter | Code, sécurité, tests et traçabilité |

## 2. Pièces techniques remises

| Pièce | Emplacement | Statut |
|---|---|---|
| Rapport d’audit initial | `.agents/audit/AUDIT-CONFORMITE-COTE-DIVOIRE.md` | Disponible |
| Registre des règles de paie | `.agents/audit/REGISTRE-REGLES-PAIE-COTE-DIVOIRE.md` | À compléter |
| Procédure de tests | `.agents/audit/TESTS-REPRODUCTIBLES.md` | Disponible |
| Audit dépendances | `.agents/audit/DEPENDANCES-SECURITE.md` | Disponible |
| Matrice des routes | fichier de contrôle généré hors dépôt | À intégrer si nécessaire |
| Résultat final des tests | CI et artefact de build | À archiver par version |

## 3. Checklist de validation locale

| Domaine | Question de validation | Preuve attendue | Statut |
|---|---|---|---|
| CNPS | Les salariés, embauches et départs sont-ils immatriculés et traçables ? | Numéro, statut, date, preuve de transmission | À valider |
| CNPS | Les assiettes, taux, plafonds et échéances sont-ils ceux du texte en vigueur ? | Texte officiel, version et tests de référence | À valider |
| Fiscal | Les règles ITS et retenues sont-elles exactes pour chaque catégorie ? | CGI/annexe fiscale, formule approuvée et cas tests | À valider |
| Travail | Les contrats et avenants contiennent-ils les mentions requises ? | Revue juridique de modèles et snapshots | À valider |
| Congés | Les droits et absences correspondent-ils aux textes/conventions applicables ? | Matrice métier et tests approuvés | À valider |
| Données | Les traitements RH ont-ils une finalité, une base et une durée ? | Registre de traitements, politique et procédures | À valider |
| Données | Les transferts et sous-traitants SaaS sont-ils documentés ? | Contrats, localisation et mesures de sécurité | À valider |
| Sécurité | Les accès inter-entreprises sont-ils impossibles et testés ? | Tests tenant, logs et revue de code | À valider |
| Déclarations | Les exports sont-ils acceptés par les canaux officiels ? | Fichier d’exemple validé ou preuve de rejet corrigé | À valider |

## 4. Règle de décision

Une règle peut passer à `VALIDÉE` uniquement si le texte ou la source officielle est identifié, la date d’effet est enregistrée, un expert compétent a relu la règle, un cas nominal et des cas limites sont testés, et le résultat est archivé avec la version du code.

En l’absence d’une de ces preuves, le statut doit rester `À valider` ou `Non vérifiable`. Aucun taux ou plafond ne doit être inventé pour faire passer un test.

## 5. Sources institutionnelles de départ

[CNPS — Employeur](https://www.cnps.ci/employeur/) ; [Service Public — Immatriculation CNPS](https://servicepublic.gouv.ci/accueil/detaildemarcheparticulier/2/446/10) ; [Autorité de protection — Lois](https://www.autoritedeprotection.ci/lois/) ; [DGI — Portail officiel](https://www.dgi.gouv.ci/).
