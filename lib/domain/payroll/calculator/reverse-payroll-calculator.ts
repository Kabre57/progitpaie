/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Moteur de Calcul à l'Envers (Reverse Payroll Calculator)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Résout par dichotomie ultra-rapide (< 1 ms) le Salaire Brut Imposable $B$
 * à partir du Salaire Net à Payer négocié et des paramètres d'entreprise.
 *
 * Intègre les 4 fonctionnalités "PLUS PROGITPAIE" :
 *   1. Situation matrimoniale & Enfants ➔ Parts IGR & RICF 2024
 *   2. Avantages en nature (Logement 15%, Véhicule 10%)
 *   3. Reversement transport (Fiscalisation auto du surplus > 30 000 FCFA)
 *   4. Comparaison Réforme 2024 vs Ancien Système (IS+CN+IGR)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { TaxRatesConfig, IGRSchedule } from "../types/payroll-types";
import { DEFAULT_PAYROLL_RATES, type PayrollRatesConfig } from "@/lib/rates-config";
import { calculateITS2024, calculateRICF2024, DEFAULT_IGR_SCHEDULE } from "./its-calculator";
import { calculateAllEmployeeContributions, calculateAllEmployerContributions } from "./cnps-calculator";

/**
 * Type permettant de recevoir les champs en provenance de PayrollRatesConfig (légacy)
 * ou de TaxRatesConfig (domaine). Tous les champs sont optionnels pour éviter les any.
 */
type LegacyRatesInput = Partial<TaxRatesConfig> & Partial<PayrollRatesConfig>;

export interface ReverseCalculationInput {
  targetNet: number;
  transportAllowance?: number;
  maritalStatus?: string;
  childrenCount?: number;
  housingBenefitPercent?: number; // ex: 15% pour logement
  vehicleBenefitPercent?: number; // ex: 10% pour véhicule
  partsIGR?: number;
  rates?: TaxRatesConfig;
  schedule?: IGRSchedule;
}

export interface ReverseCalculationResult {
  targetNet: number;
  partsIGR: number;
  ricfAmount: number;
  grossImposable: number;
  baseSalary: number;
  sursalaire: number;
  transportAllowance: number;
  transportExempt: number;
  transportTaxableSurplus: number;
  housingBenefitVal: number;
  vehicleBenefitVal: number;
  totalGainsGlobal: number;
  
  // Retenues Salariales
  cnpsEmployee: number;
  cmuEmployee: number;
  itsBrut: number;
  ricfDeduction: number;
  itsNet: number;
  totalEmployeeDeductions: number;
  netSalaryCalculated: number;

  // Coût Patronal & Entreprise
  cnpsEmployer: number;
  fdfpEmployer: number;
  cmuEmployer: number;
  totalEmployerCharges: number;
  totalCompanyCost: number;

  // Comparatif Réforme 2024
  reformComparison: {
    itsOldSystem: number;
    employeeGain: number;
    companySaving: number;
  };
}

/**
 * Calcule automatiquement le nombre de parts IGR selon la situation familiale
 */
export function calculatePartsFromFamilyStatus(maritalStatus: string = "Célibataire", childrenCount: number = 0): number {
  const isMarried = /mari/i.test(maritalStatus);
  const baseParts = isMarried ? 2.0 : 1.0;
  const count = Math.max(0, Math.min(6, childrenCount));
  const rawParts = baseParts + count * 0.5;
  return Math.min(5.0, rawParts);
}

/**
 * Calcule l'ancien ITS/IS/CN/IGR (Système Avant 2024) pour la note comparative
 */
function calculateOldSystemTaxes(grossImposable: number, partsIGR: number): number {
  const is = Math.round(grossImposable * 0.012);
  const cn = Math.round(grossImposable * 0.012);
  const abattement20 = grossImposable * 0.8;
  const netImposableAnnuel = (abattement20 - is - cn) * 12;
  const quotient = netImposableAnnuel / partsIGR;

  // Ancien barème progressif IGR
  let igrAnnuelParPart = 0;
  if (quotient > 300000) {
    if (quotient <= 548000) igrAnnuelParPart = (quotient - 300000) * 0.10;
    else if (quotient <= 979000) igrAnnuelParPart = 24800 + (quotient - 548000) * 0.15;
    else if (quotient <= 1500000) igrAnnuelParPart = 89450 + (quotient - 979000) * 0.20;
    else if (quotient <= 2400000) igrAnnuelParPart = 193650 + (quotient - 1500000) * 0.25;
    else if (quotient <= 4800000) igrAnnuelParPart = 418650 + (quotient - 2400000) * 0.30;
    else igrAnnuelParPart = 1138650 + (quotient - 4800000) * 0.35;
  }

  const igrMensuel = Math.round((igrAnnuelParPart * partsIGR) / 12);
  return is + cn + igrMensuel;
}

function normalizeRates(inputRates?: TaxRatesConfig): TaxRatesConfig {
  const r: LegacyRatesInput = inputRates ?? {};
  const def = DEFAULT_PAYROLL_RATES;
  return {
    cnpsRetirementEmployeeRate: r.cnpsRetirementEmployeeRate ?? r.cnpsEmployeeRetraite ?? def.cnpsEmployeeRetraite,
    cnpsRetirementEmployerRate: r.cnpsRetirementEmployerRate ?? r.cnpsEmployerRetraite ?? def.cnpsEmployerRetraite,
    cnpsFamilyRate: r.cnpsFamilyRate ?? r.cnpsEmployerPF ?? def.cnpsEmployerPF,
    cnpsAccidentRate: r.cnpsAccidentRate ?? r.cnpsEmployerAT ?? def.cnpsEmployerAT,
    cnpsMonthlyRetirementCeiling: r.cnpsMonthlyRetirementCeiling ?? r.cnpsCeilingRetraite ?? def.cnpsCeilingRetraite,
    cnpsMonthlyCeiling70K: r.cnpsMonthlyCeiling70K ?? r.cnpsCeilingPF_AT ?? def.cnpsCeilingPF_AT,
    itsRate: r.itsRate ?? def.itsRate,
    cnRate: r.cnRate ?? 0,
    ceRate: r.ceRate ?? 0,
    cmuEmployeeRate: r.cmuEmployeeRate ?? 50,
    cmuEmployerRate: r.cmuEmployerRate ?? 50,
    cmuBase: r.cmuBase ?? def.cmuBase,
    fdfpTARate: r.fdfpTARate ?? r.fdfpTA ?? def.fdfpTA,
    fdfpTFCRate: r.fdfpTFCRate ?? r.fdfpFPC ?? def.fdfpFPC,
  };
}

/**
 * Fonction principale : Inversion du Salaire Net ➔ Brut & Coût Total Entreprise
 */
export function calculateGrossFromNet(input: ReverseCalculationInput): ReverseCalculationResult {
  const targetNet = Math.max(0, input.targetNet);
  const rates: TaxRatesConfig = normalizeRates(input.rates);
  const schedule: IGRSchedule = input.schedule || DEFAULT_IGR_SCHEDULE;
  
  const maritalStatus = input.maritalStatus || "Célibataire";
  const childrenCount = input.childrenCount || 0;
  const partsIGR = input.partsIGR ?? calculatePartsFromFamilyStatus(maritalStatus, childrenCount);
  const ricfAmount = calculateRICF2024(partsIGR, schedule);

  const rawTransport = input.transportAllowance ?? 30000;
  const transportExemptMax = rates.cmuBase !== undefined
    ? DEFAULT_PAYROLL_RATES.transportExemptAmount
    : DEFAULT_PAYROLL_RATES.transportExemptAmount;
  // Montant d'exonération transport : toujours depuis DEFAULT_PAYROLL_RATES (source officielle)
  const transportExemptCap = DEFAULT_PAYROLL_RATES.transportExemptAmount;
  const transportExempt = Math.min(rawTransport, transportExemptCap);
  const transportTaxableSurplus = Math.max(0, rawTransport - transportExempt);

  const housingPct = (input.housingBenefitPercent || 0) / 100;
  const vehiclePct = (input.vehicleBenefitPercent || 0) / 100;

  // Dichotomie pour trouver GrossImposable B tel que NetCalculated(B) == targetNet
  let low = targetNet * 0.5;
  let high = targetNet * 3.5 + 500000;
  let bestB = targetNet;

  const cnpsEmpRate = rates.cnpsRetirementEmployeeRate;
  const cmuEmpRate = rates.cmuEmployeeRate;
  const ceiling = rates.cnpsMonthlyRetirementCeiling;

  for (let iter = 0; iter < 30; iter++) {
    const midB = (low + high) / 2;

    // Assiette imposable incluant le surplus transport
    const effectiveBrutTaxable = midB + transportTaxableSurplus;
    
    // CNPS Salarié
    const cnpsEmployee = Math.round(Math.min(effectiveBrutTaxable, ceiling) * (cnpsEmpRate / 100));
    
    // CMU
    const cmuBaseVal = rates.cmuBase ?? 1000;
    const cmuEmployee = Math.round(cmuBaseVal * (cmuEmpRate / 100));

    // ITS 2024 Net
    const R = Math.max(0, effectiveBrutTaxable - cnpsEmployee);
    const itsNet = calculateITS2024(effectiveBrutTaxable, cnpsEmployee, partsIGR, schedule);

    // Total retenues
    const totalDeductions = cnpsEmployee + cmuEmployee + itsNet;

    // Net calculé = Brut Imposable + Transport Exonéré - Total Retenues
    const currentNet = midB + transportExempt - totalDeductions;

    if (Math.abs(currentNet - targetNet) < 0.5) {
      bestB = midB;
      break;
    }

    if (currentNet < targetNet) {
      low = midB;
    } else {
      high = midB;
    }
    bestB = midB;
  }

  const grossImposable = Math.round(bestB);
  const effectiveBrutTaxable = grossImposable + transportTaxableSurplus;

  // Calculs finaux avec le Brut optimal trouvé
  const employeeContribs = calculateAllEmployeeContributions(effectiveBrutTaxable, rates, true);
  const employerContribs = calculateAllEmployerContributions(effectiveBrutTaxable, rates, true);

  const cnpsEmployee = employeeContribs.cnpsRetirement;
  const cmuEmployee = employeeContribs.cmu;

  const R = Math.max(0, effectiveBrutTaxable - cnpsEmployee);
  const itsBrut = Math.round(calculateITS2024(effectiveBrutTaxable, cnpsEmployee, 1.0, schedule)); // Sans RICF
  const itsNet = calculateITS2024(effectiveBrutTaxable, cnpsEmployee, partsIGR, schedule);
  const ricfDeduction = Math.max(0, itsBrut - itsNet);

  const totalEmployeeDeductions = cnpsEmployee + cmuEmployee + itsNet;
  const netSalaryCalculated = grossImposable + transportExempt - totalEmployeeDeductions;

  // Avantages en nature (non cash)
  const housingBenefitVal = Math.round(grossImposable * housingPct);
  const vehicleBenefitVal = Math.round(grossImposable * vehiclePct);
  const totalGainsGlobal = grossImposable + rawTransport + housingBenefitVal + vehicleBenefitVal;

  // Charges Patronales
  const cnpsEmployer = employerContribs.cnpsRetirement + employerContribs.cnpsFamily + employerContribs.cnpsAccident;
  const fdfpEmployer = employerContribs.fdfpTA + employerContribs.fdfpTFC;
  const cmuEmployer = employerContribs.cmu;
  const totalEmployerCharges = employerContribs.totalEmployer;

  const totalCompanyCost = totalGainsGlobal + totalEmployerCharges;

  // Comparatif Réforme 2024
  const itsOldSystem = calculateOldSystemTaxes(effectiveBrutTaxable, partsIGR);
  const employeeGain = Math.max(0, itsOldSystem - itsNet);
  const companySaving = employeeGain; // Réduction directe de la pression fiscale globale

  // Décomposition Salaire de base (50%) & Sursalaire (50%) si pas de grille catégorielle fournie
  const baseSalary = Math.round(grossImposable * 0.6);
  const sursalaire = Math.max(0, grossImposable - baseSalary);

  return {
    targetNet,
    partsIGR,
    ricfAmount,
    grossImposable,
    baseSalary,
    sursalaire,
    transportAllowance: rawTransport,
    transportExempt,
    transportTaxableSurplus,
    housingBenefitVal,
    vehicleBenefitVal,
    totalGainsGlobal,

    cnpsEmployee,
    cmuEmployee,
    itsBrut,
    ricfDeduction,
    itsNet,
    totalEmployeeDeductions,
    netSalaryCalculated: Math.round(netSalaryCalculated),

    cnpsEmployer,
    fdfpEmployer,
    cmuEmployer,
    totalEmployerCharges,
    totalCompanyCost,

    reformComparison: {
      itsOldSystem,
      employeeGain,
      companySaving,
    },
  };
}
