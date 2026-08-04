# [DO NOT MERGE] Suppression de l'API Provisions legacy

## État de cette préparation

Ce document est une description de PR prête à copier. **Aucune suppression décrite ci-dessous n'est actuellement appliquée.**

La création d'une PR distante est différée car :

- le worktree Phase E n'est pas encore consolidé en commits propres ;
- `gh` n'est pas installé dans l'environnement ;
- la validation métier n'est pas signée ;
- la période d'observation V2 n'a pas commencé.

## Objectif de la future PR

Retirer la couche de compatibilité après migration complète des consommateurs vers `/api/v2/payroll/provisions`.

Le renommage `ProvisionCalculatorV2` en `ProvisionCalculator` est explicitement hors périmètre et fera l'objet d'une PR distincte.

## Suppressions prévues

### Route et adaptateur

- `app/api/payroll/provisions/route.ts`
- `lib/application/payroll/provisions/legacy-provision.mapper.ts`
- `lib/application/payroll/provisions/__tests__/legacy-provision.mapper.test.ts`
- `lib/infrastructure/__tests__/provision-legacy-route.test.ts`

### Feature flag

- `lib/config/provision-api-version.ts`
- `lib/config/__tests__/provision-api-version.test.ts`
- variable `NEXT_PUBLIC_PROVISIONS_API_VERSION` dans `.env.example`

### Contrats et validation legacy

Dans `shared/types/contracts/provision.contract.ts`, supprimer uniquement :

- `LeaveProvisionDTO` — historique ;
- `TerminationBenefitDTO` — historique ;
- `ProvisionResponse` — historique.

Conserver :

- `LeaveProvisionV2DTO` ;
- `TerminationBenefitV2DTO` ;
- `ProvisionResponseV2` ;
- `ProvisionDataQualityDTO` ;
- les warnings et périodes partagés.

Dans `shared/validation/provision-response.schema.ts`, supprimer :

- `legacyLeaveProvisionSchema` ;
- `legacyTerminationProvisionSchema` ;
- `legacyProvisionResponseSchema` ;
- `legacyProvisionApiEnvelopeSchema` ;
- les types inférés legacy.

Dans `shared/validation/provision.schema.ts`, supprimer uniquement `provisionQuerySchema`. Le fichier et `provisionV2QuerySchema` doivent être conservés.

Attention : les types portant les mêmes noms dans `lib/domain/payroll/provision/types.ts` sont des types du domaine historique interne, distincts des contrats API partagés. Leur éventuelle suppression n'appartient pas à cette PR sans audit séparé.

## Simplifications frontend prévues

### Client et hook

- rendre `buildPayrollProvisionUrl` exclusivement V2 ;
- retirer `ProvisionApiVersion` de l'appel réseau ;
- supprimer l'union `PayrollProvisionQueryResult` legacy/V2 ;
- retirer le parseur Zod legacy ;
- retirer `isLegacy` et la branche legacy du hook ;
- conserver la clé React Query sans dimension de version devenue inutile.

### Page et composants

- supprimer `LegacyContent` de `app/(dashboard)/admin/provisions/page.tsx` ;
- supprimer les props `apiVersion: "legacy"` de `LeaveProvisionTable` et `TerminationBenefitTable` ;
- retirer les imports de `ProvisionResponse`, `LeaveProvisionDTO` et `TerminationBenefitDTO` ;
- supprimer le test de bannière legacy ;
- conserver les états skeleton, erreur, vide, warnings et actualisation V2.

### Tests à adapter ou supprimer

- retirer les cas legacy de `lib/client/payroll/__tests__/provision-api.test.ts` ;
- retirer les cas legacy de `lib/hooks/__tests__/use-payroll-provisions.test.tsx` ;
- retirer le cas legacy de `app/(dashboard)/admin/provisions/__tests__/page.test.tsx` ;
- ajouter un contrôle statique vérifiant l'absence de chaîne `/api/payroll/provisions` dans le code exécutable ;
- vérifier sur un build que la route legacy n'apparaît plus dans `.next/server/app-paths-manifest.json` ou le manifeste effectivement produit par Next.js 16.

Ne pas figer le test sur `.next/routes-manifest.json` sans inspection : les routes App Router sont principalement décrites dans les manifestes serveur de l'App Router.

## Gates obligatoires avant fusion

- [ ] Validation métier signée par le responsable paie.
- [ ] Artefact frontend construit avec le flag `v2` déployé en production.
- [ ] Observation d'au moins sept jours calendaires.
- [ ] Zéro appel à `/api/payroll/provisions` dans les logs sur toute la période.
- [ ] Zéro consommateur externe identifié.
- [ ] Aucun `404` indiquant un consommateur legacy pendant l'observation.
- [ ] Artefacts backend/frontend précédents identifiés et disponibles pour rollback.
- [ ] Sauvegarde et procédure de restauration vérifiées.
- [ ] TypeScript, ESLint, Jest, build et E2E validés.
- [ ] Approbation technique et sécurité.

## Contrôles exécutés par le gatekeeper

Le script `scripts/check-provisions-legacy-removal-readiness.sh` possède deux modes. `pre-removal` exécute les 13 contrôles opérationnels avant toute suppression. `final`, mode par défaut, ajoute les quatre contrôles structurels et la documentation finale pour atteindre 18 contrôles.

| Contrôle | Preuve |
|---|---|
| `LEGACY_ROUTE_ABSENTE` | fichier de route absent |
| `LEGACY_MAPPER_ABSENT` | mapper absent |
| `FEATURE_FLAG_ABSENT` | résolveur du flag absent |
| `REFERENCES_LEGACY_ABSENTES` | recherche statique dans le code exécutable |
| `LEGACY_REMOVAL_PAYROLL_SIGNED` | variable historique à `true` |
| `LEGACY_REMOVAL_V2_DEPLOYED` | variable historique à `true` |
| `LEGACY_REMOVAL_OBSERVATION_COMPLETE` | variable historique à `true` |
| `LEGACY_REMOVAL_ZERO_CALLS` | variable historique à `true` |
| `LEGACY_REMOVAL_ROLLBACK_READY` | variable historique à `true` |
| `SIGNATURE_METIER` | nom et date dans le rapport Jour 4 |
| `SIGNATURE_TECHNIQUE` | nom et date dans le rapport Jour 4 |
| `SIGNATURE_SECURITE` | nom et date dans le rapport Jour 4 |
| `DOCUMENTATION_FINALE` | guide complet et date de suppression ISO |
| `FRONTEND_V2_DEPLOYE` | confirmation opérateur ou preuve de déploiement |
| `E2E_VALIDE` | scénario présent et preuve PASS récente |
| `OBSERVATION_SEPT_JOURS` | calcul depuis la date de début UTC |
| `ZERO_APPEL_LEGACY` | analyse du fichier ou dossier de logs configuré |
| `ROLLBACK_TESTE` | document de rollback au statut `VALIDATED` |

Une condition échouée entraîne systématiquement `exit 1` et affiche `DO NOT MERGE`.

### Gate préalable à la suppression

```bash
bash scripts/check-provisions-legacy-removal-readiness.sh --mode pre-removal
```

Résultat attendu après obtention de toutes les preuves opérationnelles :

```text
Résumé gatekeeper (pre-removal) : 13/13 conditions satisfaites, 0 échec(s)
READY FOR LEGACY REMOVAL
```

Ce mode n'exige ni la disparition du legacy ni une date de suppression déjà réalisée.

### Variables du gatekeeper

```text
LEGACY_REMOVAL_PAYROLL_SIGNED=true
LEGACY_REMOVAL_V2_DEPLOYED=true
LEGACY_REMOVAL_OBSERVATION_COMPLETE=true
LEGACY_REMOVAL_ZERO_CALLS=true
LEGACY_REMOVAL_ROLLBACK_READY=true

FRONTEND_V2_DEPLOYE=true
# ou FRONTEND_V2_EVIDENCE_FILE=/chemin/frontend-v2.txt

PROVISIONS_E2E_EVIDENCE_FILE=/chemin/provisions-last-run.txt
E2E_MAX_AGE_DAYS=7
OBSERVATION_STARTED_AT=YYYY-MM-DD
OBSERVATION_MIN_DAYS=7
LEGACY_LOG_PATH=/chemin/logs
ROLLBACK_EVIDENCE_FILE=docs/rollback/provisions-legacy-rollback.md
```

La confirmation manuelle du frontend ne remplace pas la variable historique correspondante : les deux contrôles sont volontairement requis.

### Formats des preuves

Preuve frontend :

```text
status=DEPLOYED
api_version=v2
deployed_at=YYYY-MM-DD
commit=<sha>
```

Preuve E2E :

```text
status=PASS
executed_at=YYYY-MM-DD
commit=<sha>
```

Les preuves ne doivent contenir aucun cookie, token, mot de passe, salaire ou payload utilisateur.

## Preuves à joindre

- requête ou dashboard démontrant zéro appel legacy ;
- période exacte d'observation avec fuseau horaire ;
- version/commit du frontend V2 observé ;
- résultat des tests ;
- preuve de validation métier ;
- procédure et durée estimée du rollback ;
- inventaire des consommateurs internes et externes.

## Plan de rollback

1. Redéployer l'artefact backend contenant l'adaptateur legacy.
2. Redéployer l'artefact frontend compatible si nécessaire.
3. Vérifier les deux routes avec une session administrateur de chaque tenant.
4. Contrôler les headers `private, no-store` et l'isolation.
5. Documenter l'incident et suspendre la suppression jusqu'à analyse.

## Vérifications finales

```bash
npx tsc --noEmit
npx eslint .
npm test -- --runInBand
npm run build
bash scripts/check-provisions-legacy-removal-readiness.sh --mode final
```

Le résumé attendu avant revue finale doit être :

```text
Résumé gatekeeper (final) : 18/18 conditions satisfaites, 0 échec(s)
READY FOR FINAL REVIEW
```

## Décision

**DO NOT MERGE** tant qu'une seule case des gates obligatoires reste non cochée.
