/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Calculateur CNPS (Caisse Nationale de Prévoyance Sociale)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Strategy Pattern : Calcule les cotisations salariales et patronales CNPS.
 *
 * Composantes :
 *   - Retraite (salarié + employeur)
 *   - Prestations Familiales (employeur)
 *   - Accident du Travail (employeur)
 *   - CMU — Couverture Maladie Universelle (salarié + employeur)
 *
 * Plafonds CNPS :
 *   - Retraite : 2 421 250 FCFA/mois (plafond 2024)
 *   - PF + AT  : 70 000 FCFA/mois
 *
 * ADR-001 : Fonctions pures, testables unitairement, zéro side effect.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type {
  TaxRatesConfig,
  EmployeeContributions,
  EmployerContributions,
} from "../types/payroll-types";

// ─── Fonctions de calcul pures ───────────────────────────────────────────────

/**
 * Calcule la base plafonnée pour les cotisations CNPS
 *
 * @param brutSocial - Le brut social du salarié
 * @param ceiling    - Le plafond mensuel applicable
 * @returns La base plafonnée (min entre brut social et plafond)
 */
export function calculateCappedBase(brutSocial: number, ceiling: number): number {
  if (brutSocial <= 0) return 0;
  return Math.min(brutSocial, ceiling);
}

/**
 * Calcule la cotisation retraite salarié CNPS
 *
 * @param brutSocial       - Le brut social
 * @param employeeRate     - Le taux salarié retraite (ex: 6.3%)
 * @param retirementCeiling - Le plafond mensuel retraite
 * @returns Le montant de la cotisation arrondi
 */
export function calculateCNPSRetirementEmployee(
  brutSocial: number,
  employeeRate: number,
  retirementCeiling: number
): number {
  const base = calculateCappedBase(brutSocial, retirementCeiling);
  return Math.round(base * (employeeRate / 100));
}

/**
 * Calcule la cotisation retraite employeur CNPS
 *
 * @param brutSocial       - Le brut social
 * @param employerRate     - Le taux patronal retraite (ex: 7.7%)
 * @param retirementCeiling - Le plafond mensuel retraite
 * @returns Le montant de la cotisation arrondi
 */
export function calculateCNPSRetirementEmployer(
  brutSocial: number,
  employerRate: number,
  retirementCeiling: number
): number {
  const base = calculateCappedBase(brutSocial, retirementCeiling);
  return Math.round(base * (employerRate / 100));
}

/**
 * Calcule la cotisation Prestations Familiales (employeur uniquement)
 *
 * @param brutSocial   - Le brut social
 * @param familyRate   - Le taux PF (ex: 5.75%)
 * @param ceiling70K   - Le plafond PF (ex: 70 000 FCFA)
 * @returns Le montant de la cotisation arrondi
 */
export function calculateCNPSFamilyAllowance(
  brutSocial: number,
  familyRate: number,
  ceiling70K: number
): number {
  const base = calculateCappedBase(brutSocial, ceiling70K);
  return Math.round(base * (familyRate / 100));
}

/**
 * Calcule la cotisation Accident du Travail (employeur uniquement)
 *
 * @param brutSocial    - Le brut social
 * @param accidentRate  - Le taux AT (ex: 2-5% selon secteur)
 * @param ceiling70K    - Le plafond AT (ex: 70 000 FCFA)
 * @returns Le montant de la cotisation arrondi
 */
export function calculateCNPSAccidentAtWork(
  brutSocial: number,
  accidentRate: number,
  ceiling70K: number
): number {
  const base = calculateCappedBase(brutSocial, ceiling70K);
  return Math.round(base * (accidentRate / 100));
}

/**
 * Calcule la cotisation CMU (Couverture Maladie Universelle)
 * Note : La CMU est basée sur un montant fixe, pas sur le brut social
 *
 * @param cmuBase         - Le montant de base CMU
 * @param employeeRate    - Le taux salarié CMU (ex: 1%)
 * @param employerRate    - Le taux patronal CMU (ex: 2%)
 * @returns Les montants salarié et employeur
 */
export function calculateCMU(
  cmuBase: number,
  employeeRate: number,
  employerRate: number
): { employee: number; employer: number } {
  return {
    employee: Math.round(cmuBase * (employeeRate / 100)),
    employer: Math.round(cmuBase * (employerRate / 100)),
  };
}

// ─── Orchestrateurs ──────────────────────────────────────────────────────────

/**
 * Calcule l'ensemble des cotisations salariales
 *
 * @param brutSocial - Le brut social du salarié
 * @param rates      - La configuration des taux
 * @param includeCMU - Inclure la CMU dans le calcul
 * @returns Le détail des cotisations salariales
 */
export function calculateAllEmployeeContributions(
  brutSocial: number,
  rates: TaxRatesConfig,
  includeCMU: boolean = true
): EmployeeContributions {
  const cnpsRetirement = calculateCNPSRetirementEmployee(
    brutSocial,
    rates.cnpsRetirementEmployeeRate,
    rates.cnpsMonthlyRetirementCeiling
  );

  const cmu = includeCMU
    ? calculateCMU(0, rates.cmuEmployeeRate, rates.cmuEmployerRate).employee
    : 0;

  return {
    cnpsRetirement,
    cmu,
    totalEmployee: cnpsRetirement + cmu,
  };
}

/**
 * Calcule l'ensemble des cotisations patronales
 *
 * @param brutSocial - Le brut social du salarié
 * @param rates      - La configuration des taux
 * @param includeCMU - Inclure la CMU dans le calcul
 * @returns Le détail des cotisations patronales
 */
export function calculateAllEmployerContributions(
  brutSocial: number,
  rates: TaxRatesConfig,
  includeCMU: boolean = true
): EmployerContributions {
  const cnpsRetirement = calculateCNPSRetirementEmployer(
    brutSocial,
    rates.cnpsRetirementEmployerRate,
    rates.cnpsMonthlyRetirementCeiling
  );
  const cnpsFamily = calculateCNPSFamilyAllowance(
    brutSocial,
    rates.cnpsFamilyRate,
    rates.cnpsMonthlyCeiling70K
  );
  const cnpsAccident = calculateCNPSAccidentAtWork(
    brutSocial,
    rates.cnpsAccidentRate,
    rates.cnpsMonthlyCeiling70K
  );
  const cmu = includeCMU
    ? calculateCMU(0, rates.cmuEmployeeRate, rates.cmuEmployerRate).employer
    : 0;

  // FDFP (Fonds de Développement de la Formation Professionnelle)
  const fdfpTA = Math.round(brutSocial * (rates.fdfpTARate / 100));
  const fdfpTFC = Math.round(brutSocial * (rates.fdfpTFCRate / 100));

  return {
    cnpsRetirement,
    cnpsFamily,
    cnpsAccident,
    cmu,
    fdfpTA,
    fdfpTFC,
    totalEmployer: cnpsRetirement + cnpsFamily + cnpsAccident + cmu + fdfpTA + fdfpTFC,
  };
}
