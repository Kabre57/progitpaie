# Rapport d'Architecture & de Migration API V1 / V2 — PROGITPAIE

- **Date** : 2026-08-05
- **Périmètre** : Sprint 1 multi-tenant, Sprint 2 Provisions V2, Sprint 3 Payroll V2 Clean Architecture
- **Statut** : Module Payroll V2 finalisé, 34/34 suites de tests PASS, période d'observation 7 jours engagée.

---

## 1. Synthèse de l'Architecture V2 (Payroll & Provisions)

Le projet **PROGITPAIE** a achevé la migration de ses deux modules centraux vers la Clean Architecture :
1. **Module Provisions V2** : `app/api/v2/payroll/provisions/route.ts` (API historique supprimée avec succès post-gatekeeper 18/18).
2. **Module Payroll V2** : `app/api/v2/payroll/route.ts`, `app/api/v2/payroll/[id]/route.ts`, `app/api/v2/payroll/my/route.ts`.

---

## 2. Garanties de Sécurité & Rapprochement

- **Isolation Multi-Tenant Stricte** : 100% des routes et des exports sont protégés par `requireTenant` et bornés par `companyId`.
- **Rapprochement Financier** : Les entités et Use Cases du Domaine encapsulent le moteur fiscal paritaire `calculatePayrollTaxes` pour garantir 0 divergence de calcul.
- **Rétrocompatibilité Temporaire** : Les endpoints V1 `/api/payroll/*` sont dépréciés via les entêtes HTTP `Deprecated: true` et `Link: </api/v2/payroll>; rel="successor-version"`.

---

## 3. Plan de Retrait Final de l'API Historique Payroll

Une fois la période de 7 jours révolue (168h) :
1. Validation qu'aucun appel ne touche l'API V1 historique.
2. Déclaration des variables gatekeeper :
   ```env
   PAYROLL_LEGACY_REMOVAL_SIGNED=true
   PAYROLL_LEGACY_REMOVAL_V2_DEPLOYED=true
   PAYROLL_LEGACY_REMOVAL_OBSERVATION_COMPLETE=true
   PAYROLL_LEGACY_REMOVAL_ZERO_CALLS=true
   PAYROLL_LEGACY_REMOVAL_ROLLBACK_READY=true
   PAYROLL_OBSERVATION_STARTED_AT=2026-08-05
   PAYROLL_LEGACY_LOG_PATH=/path/to/logs
   ```
3. Exécution du Gatekeeper :
   ```bash
   bash scripts/check-payroll-legacy-removal-readiness.sh --mode final
   ```
4. Suppression définitive des adaptateurs V1 et fusion de la PR.
