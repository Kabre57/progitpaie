/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Calculateur ITS (Impôt sur Traitements et Salaires)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Strategy Pattern : Calcule l'ITS, la Contribution Nationale (CN),
 * la Contribution Employeur (CE) et l'Impôt Général sur le Revenu (IGR).
 *
 * Barème applicable : Côte d'Ivoire (SYSCOHADA)
 * ADR-001 : Fonction pure, testable unitairement, zéro side effect.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { TaxRatesConfig, TaxDeductions, IGRSchedule, IGRBracket } from "../types/payroll-types";

// ─── Barème IGR Côte d'Ivoire 2024 (par défaut) ──────────────────────────────

export const DEFAULT_IGR_SCHEDULE: IGRSchedule = {
  validFrom: "2024-01-01",
  validTo: "2099-12-31",
  creditPerPart: 0,
  brackets: [
    { min: 0,        max: 300_000,    rate: 0 },       // 0% — franchise
    { min: 300_001,  max: 548_000,    rate: 0.10 },    // 10%
    { min: 548_001,  max: 979_000,    rate: 0.15 },    // 15%
    { min: 979_001,  max: 1_500_000,  rate: 0.20 },    // 20%
    { min: 1_500_001, max: 2_400_000, rate: 0.25 },    // 25%
    { min: 2_400_001, max: 4_800_000, rate: 0.30 },    // 30%
    { min: 4_800_001, max: 8_000_000, rate: 0.33 },    // 33%
    { min: 8_000_001, max: Infinity,  rate: 0.35 },    // 35%
  ],
};

// ─── Fonctions de calcul pures ───────────────────────────────────────────────

/**
 * Calcule le montant de l'ITS (Impôt sur Traitements et Salaires)
 *
 * @param brutFiscal - Le brut fiscal (base imposable ITS)
 * @param itsRate    - Le taux ITS (ex: 1.2 pour 1.2%)
 * @returns Le montant de l'ITS arrondi
 */
export function calculateITS(brutFiscal: number, itsRate: number): number {
  if (brutFiscal <= 0 || itsRate <= 0) return 0;
  return Math.round(brutFiscal * (itsRate / 100));
}

/**
 * Calcule le montant de la Contribution Nationale (CN)
 *
 * @param brutFiscal - Le brut fiscal
 * @param cnRate     - Le taux CN (ex: 1.2 pour 1.2%)
 * @returns Le montant de la CN arrondi
 */
export function calculateCN(brutFiscal: number, cnRate: number): number {
  if (brutFiscal <= 0 || cnRate <= 0) return 0;
  return Math.round(brutFiscal * (cnRate / 100));
}

/**
 * Calcule le montant de la Contribution Employeur (CE)
 * Note : La CE est à la charge de l'employeur, pas du salarié
 *
 * @param brutFiscal - Le brut fiscal
 * @param ceRate     - Le taux CE (ex: 11.5 pour 11.5%)
 * @returns Le montant de la CE arrondi
 */
export function calculateCE(brutFiscal: number, ceRate: number): number {
  if (brutFiscal <= 0 || ceRate <= 0) return 0;
  return Math.round(brutFiscal * (ceRate / 100));
}

/**
 * Calcule l'IGR selon le barème progressif de Côte d'Ivoire
 *
 * Méthode :
 * 1. Déterminer le revenu net imposable annuel (brutFiscal - ITS - CN)
 * 2. Diviser par le nombre de parts IGR
 * 3. Appliquer le barème progressif par tranche
 * 4. Multiplier par le nombre de parts
 *
 * @param brutFiscalAnnuel - Le brut fiscal annuel
 * @param partsIGR         - Le nombre de parts (ex: 1, 1.5, 2, 2.5, etc.)
 * @param itsAnnuel        - L'ITS annuel déjà calculé
 * @param cnAnnuel         - La CN annuelle déjà calculée
 * @param schedule         - Le barème IGR à appliquer (versioning)
 * @returns Le montant de l'IGR annuel arrondi
 */
export function calculateIGR(
  brutFiscalAnnuel: number,
  partsIGR: number,
  itsAnnuel: number,
  cnAnnuel: number,
  schedule: IGRSchedule = DEFAULT_IGR_SCHEDULE
): number {
  if (brutFiscalAnnuel <= 0 || partsIGR <= 0) return 0;

  // 1. Revenu net imposable = Brut fiscal - ITS - CN
  const revenuNetImposable = brutFiscalAnnuel - itsAnnuel - cnAnnuel;
  if (revenuNetImposable <= 0) return 0;

  // 2. Quotient familial = Revenu / Nombre de parts
  const quotientFamilial = revenuNetImposable / partsIGR;

  // 3. Appliquer le barème progressif au quotient familial
  const igrParPart = applyProgressiveBrackets(quotientFamilial, schedule.brackets);

  // 4. IGR total = IGR par part × nombre de parts
  const igrTotal = igrParPart * partsIGR;

  return Math.round(Math.max(0, igrTotal));
}

/**
 * Applique un barème progressif par tranche
 * Fonction pure interne utilisée par calculateIGR
 */
function applyProgressiveBrackets(amount: number, brackets: ReadonlyArray<IGRBracket>): number {
  let taxTotal = 0;

  for (const bracket of brackets) {
    if (amount <= bracket.min) break;

    const taxableInBracket = Math.min(amount, bracket.max) - bracket.min;
    if (taxableInBracket > 0) {
      taxTotal += taxableInBracket * bracket.rate;
    }
  }

  return Math.round(taxTotal);
}

// ─── Orchestrateur ───────────────────────────────────────────────────────────

/**
 * Calcule l'ensemble des déductions fiscales pour un mois donné
 *
 * Cette fonction orchestre les calculs ITS, CN, CE et IGR.
 * C'est le point d'entrée unique pour les impôts sur salaire.
 *
 * @param brutFiscal   - Le brut fiscal mensuel
 * @param partsIGR     - Le nombre de parts IGR du salarié
 * @param rates        - La configuration des taux de cotisation
 * @param igrSchedule  - Le barème IGR à appliquer (versioning)
 * @returns Le détail complet des déductions fiscales
 */
export function calculateAllTaxDeductions(
  brutFiscal: number,
  partsIGR: number,
  rates: TaxRatesConfig,
  igrSchedule: IGRSchedule = DEFAULT_IGR_SCHEDULE
): TaxDeductions {
  // Calculs mensuels
  const its = calculateITS(brutFiscal, rates.itsRate);
  const cn = calculateCN(brutFiscal, rates.cnRate);
  const ce = calculateCE(brutFiscal, rates.ceRate);

  // IGR : Annualisation → barème → mensualisé
  const brutFiscalAnnuel = brutFiscal * 12;
  const itsAnnuel = its * 12;
  const cnAnnuel = cn * 12;
  const igrAnnuel = calculateIGR(brutFiscalAnnuel, partsIGR, itsAnnuel, cnAnnuel, igrSchedule);
  const igrMensuel = Math.round(igrAnnuel / 12);

  // Total retenu au salarié = ITS + CN + IGR (la CE est patronale)
  const totalTaxEmployee = its + cn + igrMensuel;

  return {
    its,
    cn,
    igr: igrMensuel,
    ce,
    totalTaxEmployee,
  };
}
