/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Calculateur ITS (Impôt Unique sur Traitements et Salaires - Réforme 2024)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Implémentation 100% DYNAMIQUE et CONFIGURABLE conforme à l'Annexe Fiscale 2024 :
 *   1. Impôt Unique ITS sur le Revenu Net Imposable R (Abattement 20% intégré au barème)
 *   2. Réduction pour Charges de Famille (RICF) appliquée selon la table dynamique des parts
 *
 * Toutes les tranches et abattements sont itérés dynamiquement depuis IGRSchedule.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { TaxRatesConfig, TaxDeductions, IGRSchedule } from "../types/payroll-types";
import { CI_ITS_2024_SCHEDULE } from "../rules/ci-its-2024-rule";

/** Barème de référence ITS unique Côte d’Ivoire, applicable depuis 2024. */
export const DEFAULT_ITS_SCHEDULE: IGRSchedule = CI_ITS_2024_SCHEDULE;

/**
 * @deprecated Nom historique conservé pour les consommateurs existants.
 * Utiliser DEFAULT_ITS_SCHEDULE : l’IGR salarial autonome est fusionné dans l’ITS depuis 2024.
 */
export const DEFAULT_IGR_SCHEDULE: IGRSchedule = DEFAULT_ITS_SCHEDULE;

/**
 * Calcule l'ITS Brut 2024 de façon 100% dynamique en itérant sur les tranches de IGRSchedule
 */
export function calculateITSBrut2024(R: number, schedule: IGRSchedule = DEFAULT_IGR_SCHEDULE): number {
  if (R <= 0) return 0;

  const brackets = schedule.brackets || DEFAULT_IGR_SCHEDULE.brackets;
  for (const b of brackets) {
    if (R >= b.min && R <= b.max) {
      const deduction = b.quickDeduction ?? 0;
      return Math.max(0, Math.round(R * b.rate - deduction));
    }
  }

  // Si au-delà de la dernière tranche supérieure
  const lastBracket = brackets[brackets.length - 1];
  if (lastBracket && R > lastBracket.min) {
    const deduction = lastBracket.quickDeduction ?? 0;
    return Math.max(0, Math.round(R * lastBracket.rate - deduction));
  }

  return 0;
}

/**
 * Calcule la Réduction pour Charges de Famille (RICF) de façon 100% dynamique
 */
export function calculateRICF2024(partsIGR: number, schedule: IGRSchedule = DEFAULT_IGR_SCHEDULE): number {
  const table = schedule.ricfTable || DEFAULT_IGR_SCHEDULE.ricfTable!;
  if (partsIGR <= 1.0) return table[1.0] ?? 0;
  
  // Clé exacte ou valeur plafond (max 5.0 parts)
  const exactVal = table[partsIGR];
  if (exactVal !== undefined) return exactVal;

  const maxKey = Math.min(partsIGR, 5.0);
  return table[maxKey] ?? table[5.0] ?? 44_000;
}

/**
 * Calcule l'ITS Net à retenir au salarié (Réforme 2024)
 */
export function calculateITS2024(
  brutImposable: number,
  cnpsEmployee: number,
  partsIGR: number,
  schedule: IGRSchedule = DEFAULT_IGR_SCHEDULE
): number {
  const R = Math.max(0, brutImposable - cnpsEmployee);
  const itsBrut = calculateITSBrut2024(R, schedule);
  const ricf = calculateRICF2024(partsIGR, schedule);
  return Math.max(0, itsBrut - ricf);
}

/**
 * Aliases pour compatibilité
 */
export function calculateITS(brutFiscal: number, _itsRate: number, schedule: IGRSchedule = DEFAULT_IGR_SCHEDULE): number {
  return calculateITSBrut2024(brutFiscal, schedule);
}

export function calculateCN(_brutFiscal: number, _cnRate: number): number {
  return 0; // CN intégrée dans l'ITS Unique 2024
}

export function calculateCE(brutFiscal: number, ceRate: number): number {
  if (brutFiscal <= 0 || ceRate <= 0) return 0;
  return Math.round(brutFiscal * (ceRate / 100));
}

export function calculateIGR(
  brutFiscalAnnuel: number,
  partsIGR: number,
  _itsAnnuel: number,
  _cnAnnuel: number,
  schedule: IGRSchedule = DEFAULT_IGR_SCHEDULE,
  rates?: TaxRatesConfig
): number {
  const brutMensuel = brutFiscalAnnuel / 12;
  const ceiling = rates?.cnpsMonthlyRetirementCeiling ?? 3375000;
  const rate = (rates?.cnpsRetirementEmployeeRate ?? 6.3) / 100;
  const cnpsEstimee = Math.round(Math.min(brutMensuel, ceiling) * rate);
  const itsMensuel = calculateITS2024(brutMensuel, cnpsEstimee, partsIGR, schedule);
  return itsMensuel * 12;
}

/**
 * Orchestrateur principal des retenues fiscales
 */
export function calculateAllTaxDeductions(
  brutFiscal: number,
  partsIGR: number,
  rates: TaxRatesConfig,
  schedule: IGRSchedule = DEFAULT_IGR_SCHEDULE,
  cnpsEmployee?: number
): TaxDeductions {
  const actualCnps = cnpsEmployee ?? Math.round(Math.min(brutFiscal, rates.cnpsMonthlyRetirementCeiling) * (rates.cnpsRetirementEmployeeRate / 100));
  const itsNet = calculateITS2024(brutFiscal, actualCnps, partsIGR, schedule);
  const ce = calculateCE(brutFiscal, rates.ceRate);

  return {
    its: itsNet,
    cn: 0,
    igr: 0,
    ce,
    totalTaxEmployee: itsNet,
  };
}
