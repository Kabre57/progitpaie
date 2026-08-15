# Rapport de correction du moteur fiscal ITS 2024

**Projet :** PROGITPAIE  
**Version applicative :** 1.6.1  
**Date de validation technique :** 13 août 2026  
**Auteur :** Manus AI  
**Statut métier :** **validation locale ivoirienne requise avant activation en production**

## Objet et périmètre

Ce rapport documente la correction du moteur de paie de PROGITPAIE afin que les **nouveaux bulletins de paie ivoiriens** appliquent une logique fiscale unique, versionnée et testée à partir de la réforme entrée en vigueur le 1er janvier 2024. La correction porte sur le calcul des cotisations CNPS, de la CMU, de l’ITS, des réductions pour charges de famille, des indemnités exonérées et des retenues de présence.

> La Direction générale du Trésor indique que l’ordonnance n° 2023-719 a fusionné l’IS, la CN et l’IGR/Salaires dans un prélèvement unique à compter du 1er janvier 2024. Les logiciels de paie devaient être mis à jour pour appliquer cette réforme.[1]

Le moteur historique demeure physiquement présent pour la compatibilité des appelants hérités et d’éventuelles périodes antérieures à 2024. Il est désormais explicitement déprécié et ne doit pas servir à générer une paie ivoirienne dont la période commence le 1er janvier 2024 ou après cette date.

| Élément | Avant la correction | Après la correction |
| --- | --- | --- |
| Génération réelle de bulletin | Moteur historique `calculatePayrollTaxes()` fondé sur IS + CN + IGR | `PayrollGenerationService` appelle `calculatePayslip()` et la règle `CI-ITS-2024-v1` |
| Fiscalité salariale post-2024 | Risque de CN et IGR autonomes | ITS unique ; champs CN/IGR autonomes ramenés à zéro dans le bulletin |
| Plafond retraite CNPS | Documentation et fixture incohérentes | 3 375 000 FCFA documentés et testés |
| Traçabilité réglementaire | Règles éparses et ambiguës | Règle datée, versionnée, sourcée et marquée non approuvée pour production |
| Non-régression | Couverture limitée au calculateur | Tests de service sur la génération réelle et suite applicative complète validés |

## Référentiel réglementaire appliqué

La règle de domaine `CI_ITS_2024_RULE` porte l’identifiant **`CI-ITS-2024-v1`**, une date de début de validité au **1er janvier 2024**, une URL de référence et le marqueur `approvedForProduction: false`. Le barème ITS configuré est progressif par tranche : 0 % jusqu’à 75 000 FCFA, puis 16 %, 21 %, 24 %, 28 % et 32 % sur les fractions successives. La réduction pour charges de famille est calculée après l’impôt brut, conformément au mécanisme de réduction d’impôt décrit par la réforme.[1]

Le plafond mensuel de la branche retraite CNPS est paramétré à **3 375 000 FCFA**. La documentation du projet le rattache au décret n° 2022-986 du 21 décembre 2022, applicable depuis le 1er janvier 2023, et au communiqué de la CNPS destiné aux employeurs.[2] [3] Cette valeur est maintenue comme une règle versionnée à réexaminer dès toute publication normative, instruction CNPS ou modification de plafond.

| Paramètre contrôlé | Valeur configurée | Traitement dans le moteur unifié |
| --- | ---: | --- |
| CNPS retraite salarié | 6,3 % | Appliquée sur le brut social plafonné |
| CNPS retraite employeur | 7,7 % | Appliquée sur le brut social plafonné |
| Plafond retraite CNPS | 3 375 000 FCFA / mois | `min(brut social, plafond)` |
| PF et AT employeur | Plafond 70 000 FCFA / mois | Calculés séparément sur la base plafonnée applicable |
| CMU salarié | 500 FCFA | Incluse dans les retenues salariales lorsque activée |
| ITS salarié | Barème `CI-ITS-2024-v1` | Calcule l’impôt unique après les bases et réductions applicables |
| CN salariale autonome | 0 FCFA post-2024 | Ne doit plus diminuer le net salarié |
| IGR salarial autonome | 0 FCFA post-2024 | Ne doit plus diminuer le net salarié |

## Corrections techniques réalisées

La structure des contrats de paie a été enrichie pour représenter les éléments réellement nécessaires au calcul ivoirien : indemnité de logement, heures supplémentaires, retenues pour absences, retards et congés sans solde, part exonérée du transport, version de règle, brut imposable et total des retenues de présence. Cette extension évite de mélanger des montants de rémunération avec des déductions et laisse une trace exploitable pour les bulletins, exports et contrôles.

Le calculateur `payslip-calculator.ts` est devenu l’orchestrateur fiscal de référence. Il traite les montants variables, applique l’exonération transport configurée, déduit les absences/retards/congés sans solde de la base concernée, calcule la CNPS et l’ITS, puis retourne un résultat complet et explicitement versionné. `its-calculator.ts` expose désormais `DEFAULT_ITS_SCHEDULE`; l’ancien nom `DEFAULT_IGR_SCHEDULE` est seulement un alias déprécié de compatibilité.

`PayrollGenerationService.ts` a été migré de `calculatePayrollTaxes()` vers `calculatePayslip()`. Les brouillons produits par ce service portent désormais l’ITS unique dans `itsTax`, conservent `igrTax` à zéro et appliquent les composantes patronales CNPS, CMU et FDFP définies par la configuration de la règle. Le service accepte l’injection des taux et du barème pour permettre les tests de non-régression, et expose `getRuleVersion()` pour la traçabilité.

| Fichier | Correction appliquée |
| --- | --- |
| `lib/domain/payroll/rules/ci-its-2024-rule.ts` | Création de la règle `CI-ITS-2024-v1`, de son barème ITS, de ses taux CNPS et de son statut d’approbation |
| `lib/domain/payroll/calculator/payslip-calculator.ts` | Prise en charge du logement, des heures supplémentaires, du transport exonéré et des retenues de présence |
| `lib/domain/payroll/services/PayrollGenerationService.ts` | Migration du calcul réel vers `calculatePayslip()` ; IGR autonome à zéro |
| `lib/domain/payroll/services/__tests__/PayrollGenerationService.its2024.test.ts` | Quatre scénarios de bulletin réel post-2024 |
| `lib/domain/payroll/__tests__/payroll-calculator.test.ts` | Fixture CNPS passée à 3 375 000 FCFA et assertion de version mise à jour |
| `lib/domain/payroll/calculator/cnps-calculator.ts` | Commentaire de plafond corrigé et sourcé |
| `lib/rates-config.ts` | Commentaire ambigu de plafond retraite supprimé |
| `lib/payroll-tax.ts` | Avertissement `@deprecated` : ne pas employer le régime IS + CN + IGR pour les périodes postérieures à 2023 |
| `lib/db.ts` et `jest.setup.js` | Initialisation de build/test rendue reproductible sans secret de production |

## Résultats de calcul vérifiés

Les scénarios ci-dessous sont exécutés par les tests de service et vérifient donc le chemin de génération des bulletins, et non uniquement des fonctions de calcul isolées. Les montants sont arrondis au franc CFA conformément au value object `Money`.

| Scénario | Résultat contrôlé |
| --- | --- |
| Brut de 500 000 FCFA | CNPS salarié : 31 500 FCFA ; ITS : 74 385 FCFA ; IGR autonome : 0 FCFA ; retenues totales : 106 385 FCFA ; net : **393 615 FCFA** |
| Brut de 4 000 000 FCFA | CNPS salarié plafonnée : **212 625 FCFA** ; CNPS employeur totale : **266 000 FCFA**, dont retraite plafonnée à 259 875 FCFA, PF à 4 025 FCFA et AT à 2 100 FCFA |
| 75 000 FCFA + transport 30 000 FCFA | Brut versé : 105 000 FCFA ; base ITS après exonération : 75 000 FCFA ; ITS : 0 FCFA ; net : **99 775 FCFA** |
| Brut de 260 000 FCFA, une absence | Retenue d’absence : 10 000 FCFA ; brut après présence : 250 000 FCFA ; CNPS salarié : 15 750 FCFA ; ITS : 25 480 FCFA ; net : **208 270 FCFA** |

## Validation technique exécutée

La validation a été exécutée uniquement avec **pnpm**. La suite complète a initialement révélé que seize suites d’infrastructure ne pouvaient même pas charger Prisma lorsque `DATABASE_URL` était absente. Ce problème ne provenait pas du moteur fiscal. Une URL de test non sensible est désormais initialisée dans Jest, tandis que `lib/db.ts` n’emploie une URL factice qu’au cours de `next build`; en environnement d’exécution, une vraie `DATABASE_URL` reste obligatoire. Cette séparation évite l’exposition d’un secret tout en laissant le conteneur Docker responsable de la configuration réelle.

| Commande de validation | Résultat final du 13 août 2026 |
| --- | --- |
| `pnpm test` | **72 suites, 321 tests réussis** |
| `pnpm exec tsc --noEmit` | **0 erreur TypeScript** |
| `pnpm lint` | **0 erreur ESLint** ; 0 avertissement `no-explicit-any` ; 308 avertissements historiques non bloquants restent à traiter séparément |
| `pnpm build` | **Réussi** ; 146 routes générées/analysées, dont la sortie standalone requise par Docker |
| `pnpm exec playwright test tests/e2e/security-authenticated-isolation.spec.ts --reporter=line` | **3 scénarios correctement ignorés** tant que les comptes E2E réels et isolés ne sont pas injectés par variables d’environnement |
| Construction Docker locale | Non exécutée : l’exécutable Docker n’est pas disponible dans cet environnement de validation (`docker: command not found`) |

Le `Dockerfile` a été vérifié statiquement : il utilise Node `24.15-alpine`, pnpm `11.21.0`, génère Prisma, compile Next.js en mode standalone et exécute l’application sous un utilisateur non privilégié. La construction et le démarrage Docker restent néanmoins à rejouer dans l’environnement cible avec `docker build --tag progitpaie:fiscal-validation .`, puis avec une base PostgreSQL, Redis et les secrets de l’environnement local ou de production. Ce point est une limitation d’infrastructure de validation, non un échec du build Next.js autonome.

## Réserve obligatoire avant la production

Le marqueur **`approvedForProduction: false` est volontaire**. Il interdit de considérer la règle comme juridiquement approuvée par la seule validation technique. Avant d’activer cette règle pour une paie réelle, un expert local ivoirien — fiscaliste, conseil paie ou représentant habilité de l’entreprise — doit vérifier les taux, plafonds, exonérations, réductions familiales, arrondis, contributions employeur et modalités déclaratives applicables à la période concernée. Cette validation doit être tracée avec la date, l’identité du validateur, les sources examinées et la version exacte de la règle approuvée.

> Une réussite des tests prouve la cohérence entre le code et les scénarios encodés. Elle ne remplace pas une validation réglementaire, déclarative et conventionnelle par un professionnel compétent en Côte d’Ivoire.

## Clôture des actions de remédiation

Les travaux initialement planifiés ont été exécutés dans le dépôt. Les trente-trois routes auparavant dépendantes de Prisma ont été migrées vers les cas d’utilisation et repositories ; le contrôle final relève **zéro import Prisma direct dans les routes**. Les quatre scripts d’administration ont migré de `xlsx` vers ExcelJS, et la dépendance `xlsx` a été retirée. Enfin, les 147 avertissements `any` relevés à l’ouverture ont été intégralement supprimés : le contrôle final retourne **zéro** `no-explicit-any`.

Trois scénarios Playwright supplémentaires sont désormais définis dans `tests/e2e/security-authenticated-isolation.spec.ts`. Ils s’authentifient réellement en tant qu’administrateur du tenant A, salarié du tenant A et administrateur démo, puis vérifient l’impossibilité de lire un salarié du tenant B ou de lancer une paie. Ils exigent les comptes isolés injectés par variables `E2E_*` et restent volontairement ignorés hors environnement E2E préparé, plutôt que de générer un résultat de sécurité trompeur.

| Priorité | Élément | État à la clôture | Condition résiduelle |
| --- | --- | --- | --- |
| P0 métier | Validation locale de `CI-ITS-2024-v1` | **Ouvert et bloquant avant production** | Preuve écrite d’un expert ivoirien, date d’effet et décision documentée avant `approvedForProduction: true` |
| P1 architecture | Routes Prisma directes | **Clôturé** | 0 route restante ; maintenir la règle dans les revues |
| P1 qualité | Avertissements `any` | **Clôturé** | 0 `no-explicit-any` ; traiter séparément les autres avertissements ESLint historiques |
| P1 Excel | Scripts d’administration | **Clôturé** | Conserver ExcelJS ; ne pas réintroduire `xlsx` |
| P1 sécurité | E2E authentifiés multi-tenant | **Implémenté, exécution cible requise** | Provisionner les comptes E2E tenant A, tenant B et démo, puis exécuter la suite contre Docker |
| P1 déploiement | Construction Docker | **Validation statique et build Next.js réussis** | Construire et démarrer l’image avec les variables de production dans un environnement doté de Docker |

## Références

[1] [Direction générale du Trésor et de la Comptabilité publique — Réforme des impôts sur traitements, salaires, pensions et rentes viagères, 31 octobre 2023](https://tresor.gouv.ci/tres/traitements-salaires-pensions-et-rentes-viageres-voici-ce-qui-attend-travailleurs-et-retraites-a-partir-du-1er-janvier-2024/)

[2] [IPS-CNPS — Communiqué à l’attention des employeurs sur les nouveaux plafonds, publication officielle](https://www.facebook.com/IPSCNPS/posts/communique-a-lattention-des-employeursla-direction-g%C3%A9n%C3%A9rale-de-la-cnps-informe-l/1862149440809006/)

[3] [Direction du Contrôle financier — Décret n° 2022-986 du 21 décembre 2022](https://dcf.ci/dcf.ci/actes/decret-n-2022-986-du-21-decembre-2022-portant-revalorisation-du-salaire-minimum-interprofessionnel-garanti/)

[4] [Direction générale des Impôts — BODGI 2025, page 40](https://www.dgi.gouv.ci/assets/documents/EBOOK/BODGI_2025/files/basic-html/page40.html)
