/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Adaptateur Legacy → Domain
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Pont entre l'ancien format PayrollRatesConfig (lib/rates-config.ts)
 * et le nouveau format TaxRatesConfig (lib/domain/payroll/types).
 *
 * ADR-004 : Cet adaptateur est temporaire. Il sera supprimé une fois
 *           la migration complète terminée (Phase 4).
 *
 * Pattern Strangler Fig : L'ancien code utilise `PayrollRatesConfig`.
 * Le nouveau moteur utilise `TaxRatesConfig`. L'adaptateur traduit
 * l'un vers l'autre sans modifier le code existant.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { PayrollRatesConfig } from "@/lib/rates-config";
import type { TaxRatesConfig } from "@/lib/domain/payroll/types/payroll-types";

/**
 * Convertit l'ancien format PayrollRatesConfig vers le nouveau TaxRatesConfig
 *
 * Mapping :
 *   PayrollRatesConfig.cnpsEmployeeRetraite    → TaxRatesConfig.cnpsRetirementEmployeeRate
 *   PayrollRatesConfig.cnpsEmployerRetraite    → TaxRatesConfig.cnpsRetirementEmployerRate
 *   PayrollRatesConfig.cnpsEmployerPF          → TaxRatesConfig.cnpsFamilyRate
 *   PayrollRatesConfig.cnpsEmployerAT          → TaxRatesConfig.cnpsAccidentRate
 *   PayrollRatesConfig.cnpsCeilingRetraite     → TaxRatesConfig.cnpsMonthlyRetirementCeiling
 *   PayrollRatesConfig.cnpsCeilingPF_AT        → TaxRatesConfig.cnpsMonthlyCeiling70K
 *   PayrollRatesConfig.fdfpTA                  → TaxRatesConfig.fdfpTARate
 *   PayrollRatesConfig.fdfpFPC                 → TaxRatesConfig.fdfpTFCRate
 *   PayrollRatesConfig.itsRate                 → TaxRatesConfig.itsRate
 *   PayrollRatesConfig.cmuEmployeeRate         → TaxRatesConfig.cmuEmployeeRate
 *   PayrollRatesConfig.cmuEmployerRate         → TaxRatesConfig.cmuEmployerRate
 */
export function legacyRatesToTaxRatesConfig(legacy: PayrollRatesConfig): TaxRatesConfig {
  return {
    // Cotisations salariales
    cnpsRetirementEmployeeRate: legacy.cnpsEmployeeRetraite,
    cmuEmployeeRate: legacy.cmuEmployeeRate,

    // Cotisations patronales
    cnpsRetirementEmployerRate: legacy.cnpsEmployerRetraite,
    cnpsFamilyRate: legacy.cnpsEmployerPF,
    cnpsAccidentRate: legacy.cnpsEmployerAT,
    cmuEmployerRate: legacy.cmuEmployerRate,
    fdfpTARate: legacy.fdfpTA,
    fdfpTFCRate: legacy.fdfpFPC,

    // Impôts
    itsRate: legacy.itsRate,
    ceRate: 11.5,    // Contribution Employeur — taux fixe
    cnRate: 1.2,     // Contribution Nationale — taux fixe

    // Plafonds
    cnpsMonthlyRetirementCeiling: legacy.cnpsCeilingRetraite,
    cnpsMonthlyCeiling70K: legacy.cnpsCeilingPF_AT,
  };
}

/**
 * Vérifie si le moteur modulaire est activé via le feature flag.
 * Lecture de la variable d'environnement USE_MODULAR_PAYROLL_ENGINE.
 */
export function isModularEngineEnabled(): boolean {
  return process.env.USE_MODULAR_PAYROLL_ENGINE === "true";
}

/**
 * Vérifie si le builder PDF modulaire est activé via le feature flag.
 */
export function isModularPDFEnabled(): boolean {
  return process.env.USE_MODULAR_PDF_BUILDER === "true";
}
