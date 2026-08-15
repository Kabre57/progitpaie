# Dossier de validation locale — Règle de paie CI-ITS-2024-v1

**Projet :** PROGITPAIE  
**Règle concernée :** `CI-ITS-2024-v1`  
**Période couverte :** à compter du 1er janvier 2024  
**Statut dans le code :** `approvedForProduction: false`  
**Objet :** recueillir l’avis traçable d’un expert paie/fiscalité ivoirien avant toute activation réelle de la règle.

## Mandat de validation

Ce dossier ne constitue ni une déclaration sociale, ni un avis fiscal. Il fournit au validateur local la liste précise des paramètres encodés, des scénarios de calcul et des décisions à consigner. La publication de la Direction générale du Trésor indique que l’ordonnance n° 2023-719 a fusionné l’IS, la CN et l’IGR/Salaires en un prélèvement unique à compter du 1er janvier 2024.[1]

> **Décision de sécurité :** tant que toutes les lignes obligatoires ci-dessous ne sont pas validées et signées, la règle doit conserver la valeur `approvedForProduction: false`.

| Élément à vérifier | Valeur encodée dans PROGITPAIE | Validation de l’expert | Référence examinée |
| --- | ---: | --- | --- |
| Date d’effet de l’ITS unique | 01/01/2024 | ☐ Conforme ☐ À corriger | Ordonnance / commentaire DGI |
| IS salarial autonome | 0 FCFA | ☐ Conforme ☐ À corriger | Ordonnance / commentaire DGI |
| CN salariale autonome | 0 FCFA | ☐ Conforme ☐ À corriger | Ordonnance / commentaire DGI |
| IGR salarial autonome | 0 FCFA | ☐ Conforme ☐ À corriger | Ordonnance / commentaire DGI |
| Tranches ITS | 0 %, 16 %, 21 %, 24 %, 28 %, 32 % | ☐ Conforme ☐ À corriger | Barème applicable à la période |
| Réduction pour charges de famille | Table `CI_ITS_2024_RICF` | ☐ Conforme ☐ À corriger | Texte d’application / instruction DGI |
| CNPS retraite salarié | 6,3 % | ☐ Conforme ☐ À corriger | CNPS / texte applicable |
| CNPS retraite employeur | 7,7 % | ☐ Conforme ☐ À corriger | CNPS / texte applicable |
| Plafond retraite CNPS | 3 375 000 FCFA mensuels | ☐ Conforme ☐ À corriger | Décret n° 2022-986 / CNPS |
| PF et AT employeur | Base plafonnée à 70 000 FCFA | ☐ Conforme ☐ À corriger | CNPS / texte applicable |
| CMU | Montants et assujettissement configurés | ☐ Conforme ☐ À corriger | CMU / instruction applicable |
| Transport | Exonération configurée et plafonnée | ☐ Conforme ☐ À corriger | CGI / instruction applicable |
| Logement, primes, heures supplémentaires | Assujettissement retenu | ☐ Conforme ☐ À corriger | Convention / CGI / instruction applicable |
| Absences, retards, congés sans solde | Déduction unique de la base et du net | ☐ Conforme ☐ À corriger | Règlement intérieur / droit du travail |
| FDFP et autres contributions employeur | Taux et plafonds applicables | ☐ Conforme ☐ À corriger | FDFP / texte applicable |

## Jeux de contrôle à rapprocher

L’expert doit reproduire ou contrôler les scénarios suivants avec son outil de référence, en notant les conventions d’arrondi et les éventuelles différences d’assiette. Toute divergence supérieure à 1 FCFA doit être expliquée ; toute divergence réglementaire doit empêcher l’approbation de la règle.

| Cas | Données | Résultat attendu dans le moteur | Résultat expert | Écart | Décision |
| --- | --- | ---: | ---: | ---: | --- |
| A | Brut 500 000 FCFA, une part, sans variable | CNPS salarié 31 500 ; ITS 74 385 ; net 393 615 |  |  |  |
| B | Brut 4 000 000 FCFA, une part, sans variable | CNPS salarié 212 625 ; CNPS employeur 266 000 |  |  |  |
| C | Salaire 75 000 + transport 30 000 FCFA | ITS 0 ; net 99 775 |  |  |  |
| D | Brut 260 000 FCFA, une absence | Retenue 10 000 ; ITS 25 480 ; net 208 270 |  |  |  |
| E | Cas familial représentatif | RICF appliquée selon la table versionnée |  |  |  |
| F | Primes, logement et heures supplémentaires | Assiettes et exonérations contrôlées |  |  |  |

## Pièces de preuve à joindre

Le dossier complété doit comporter le texte réglementaire ou l’instruction appliquée, une copie datée des barèmes/taux/plafonds, les sorties de calcul de référence, les éventuelles conventions collectives pertinentes et la présente grille renseignée. Les documents qui contiennent des données personnelles doivent être pseudonymisés avant ajout au dépôt.

| Référence | Preuve attendue | Ajoutée |
| --- | --- | --- |
| Ordonnance n° 2023-719 | Texte ou instruction DGI confirmant le passage à l’ITS unique | ☐ |
| Décret n° 2022-986 | Texte publié et confirmation du plafond CNPS associé | ☐ |
| CNPS | Note ou communiqué sur taux et plafonds effectifs | ☐ |
| DGI | Barème ITS, réduction familiale, exonérations et arrondis | ☐ |
| CMU / FDFP | Instruction/tarif applicable à la période | ☐ |
| Convention collective | Éléments de salaire ou primes spécifiques, le cas échéant | ☐ |
| Calculs comparatifs | Fichier pseudonymisé et signé par l’expert | ☐ |

## Décision formelle

| Champ | À renseigner par le validateur |
| --- | --- |
| Nom, qualité et organisme |  |
| Domaine d’habilitation |  |
| Références documentaires examinées |  |
| Période de validité approuvée |  |
| Décision | ☐ Approuvée ☐ Approuvée avec réserves ☐ Refusée |
| Réserves ou corrections impératives |  |
| Date |  |
| Signature / visa |  |

La mise à `approvedForProduction: true` ne peut intervenir qu’après l’archivage de cette décision dans le dépôt, une revue de code, une mise à jour des tests de calcul et une approbation de la personne responsable de la paie. Une nouvelle version de règle doit être créée pour toute modification ultérieure de taux, plafond, tranche, exonération ou arrondi ; la version déjà approuvée ne doit pas être réécrite.

## Références

[1] [Direction générale du Trésor et de la Comptabilité publique — Réforme des impôts sur traitements, salaires, pensions et rentes viagères](https://tresor.gouv.ci/tres/traitements-salaires-pensions-et-rentes-viageres-voici-ce-qui-attend-travailleurs-et-retraites-a-partir-du-1er-janvier-2024/)

[2] [Direction du Contrôle financier — Décret n° 2022-986 du 21 décembre 2022](https://dcf.ci/dcf.ci/actes/decret-n-2022-986-du-21-decembre-2022-portant-revalorisation-du-salaire-minimum-interprofessionnel-garanti/)

[3] [IPS-CNPS — Communiqué à l’attention des employeurs relatif aux plafonds](https://www.facebook.com/IPSCNPS/posts/communique-a-lattention-des-employeursla-direction-g%C3%A9n%C3%A9rale-de-la-cnps-informe-l/1862149440809006/)
