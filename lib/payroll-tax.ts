/**
 * Moteur de Calcul Fiscalité & Cotisations Sociales (Côte d'Ivoire /  )
 */

export interface TaxCalculationParams {
  basicSalary: number;
  sursalaire?: number;
  transportAllowance?: number; // Exonéré jusqu'à 30 000 FCFA / mois
  housingAllowance?: number;
  overtimePay?: number;
  bonuses?: number;
  partsIGR?: number; // ex: 1 (célibataire), 2 (marié), 2.5 (marié + 1 enfant)...
  absentDeduction?: number;
  lateDeduction?: number;
  unpaidLeaveDeduction?: number;
}

export interface TaxCalculationResult {
  brutImposable: number;
  grossSalary: number;
  itsTax: number;       // Impôt sur Salaire (IS + CN)
  igrTax: number;       // Impôt Général sur le Revenu (IGR)
  cnpsEmployee: number; // Retraite salarié (6.3%)
  cnpsEmployer: number; // CNPS Patronale (Retraite + PF + AT)
  cmuEmployee?: number; // CMU Part Salarié (500 FCFA)
  cmuEmployer?: number; // CMU Part Patronale (500 FCFA)
  fdfpTax: number;      // FDFP Patronale (TFC 1.2% + TAP 0.4%)
  totalDeductions: number;
  netSalary: number;
}

/**
 * Calcul de la Contribution Nationale (CN)
 */
function calculateCN(base: number): number {
  if (base <= 50000) return 0;
  if (base <= 130000) return (base - 50000) * 0.015;
  if (base <= 200000) return 1200 + (base - 130000) * 0.05;
  return 4700 + (base - 200000) * 0.10;
}

/**
 * Calcul de l'Impôt Général sur le Revenu (IGR) selon le barème progressif et le nombre de parts
 */
function calculateIGR(base: number, parts: number): number {
  const partsVal = Math.max(1, parts || 1);
  // Déduction forfaitaire de 20% pour frais professionnels
  const baseApresAbattement = base * 0.8;
  const R = baseApresAbattement / partsVal;

  let igrBrut = 0;
  if (R <= 25000) {
    igrBrut = 0;
  } else if (R <= 45000) {
    igrBrut = (R * 0.10) - 2500;
  } else if (R <= 60000) {
    igrBrut = (R * 0.15) - 4750;
  } else if (R <= 80000) {
    igrBrut = (R * 0.20) - 7750;
  } else if (R <= 100000) {
    igrBrut = (R * 0.25) - 11750;
  } else if (R <= 160000) {
    igrBrut = (R * 0.35) - 21750;
  } else if (R <= 300000) {
    igrBrut = (R * 0.45) - 37750;
  } else if (R <= 500000) {
    igrBrut = (R * 0.55) - 67750;
  } else {
    igrBrut = (R * 0.60) - 92750;
  }

  const igrTotal = Math.max(0, igrBrut * partsVal);
  return Math.round(igrTotal);
}

import { PayrollRatesConfig, DEFAULT_PAYROLL_RATES } from "./rates-config";

/**
 * Calcule l'ensemble de la fiche de paie et de la fiscalité (100% Dynamique)
 */
export function calculatePayrollTaxes(
  params: TaxCalculationParams,
  customRates?: Partial<PayrollRatesConfig>
): TaxCalculationResult {
  const rates: PayrollRatesConfig = {
    ...DEFAULT_PAYROLL_RATES,
    ...customRates,
  };

  const basicSalary = params.basicSalary || 0;
  const sursalaire = params.sursalaire || 0;
  const housingAllowance = params.housingAllowance || 0;
  const overtimePay = params.overtimePay || 0;
  const bonuses = params.bonuses || 0;

  // Prime de transport non imposable selon le plafond configuré (ex: 30,000 FCFA)
  const transportAllowance = params.transportAllowance || 0;
  const transportExemptLimit = rates.transportExemptAmount || 30000;

  const absentDeduction = params.absentDeduction || 0;
  const lateDeduction = params.lateDeduction || 0;
  const unpaidLeaveDeduction = params.unpaidLeaveDeduction || 0;

  const totalDeductionsPresences = absentDeduction + lateDeduction + unpaidLeaveDeduction;

  // Salaire Brut Total
  const grossSalary = Math.max(0, basicSalary + sursalaire + housingAllowance + transportAllowance + overtimePay + bonuses - totalDeductionsPresences);

  // Brut Imposable (Brut sans la part exonérée de transport)
  const brutImposable = Math.max(0, grossSalary - Math.min(transportAllowance, transportExemptLimit));

  // 1. IS (Impôt sur Salaire calculé selon le taux configuré, par défaut 1.2%)
  const isTax = Math.round(brutImposable * (rates.itsRate / 100));

  // 2. CN (Contribution Nationale)
  const cnTax = Math.round(calculateCN(brutImposable));

  // Total ITS (IS + CN)
  const itsTax = isTax + cnTax;

  // 3. CNPS Salarié (Taux configuré, par défaut 6.3% sur retraite, plafonné selon cnpsCeilingRetraite)
  const baseCNPSRetraite = Math.min(brutImposable, rates.cnpsCeilingRetraite || 3375000);
  const cnpsEmployee = Math.round(baseCNPSRetraite * (rates.cnpsEmployeeRetraite / 100));

  // 4. Base nette pour calcul IGR = Brut Imposable - (ITS + CNPS Salarié)
  const baseNetImposableIGR = Math.max(0, brutImposable - (itsTax + cnpsEmployee));
  const igrTax = calculateIGR(baseNetImposableIGR, params.partsIGR || 1);

  // 5. Cotisations Patronales CNPS
  const baseCNPSPF = Math.min(brutImposable, rates.cnpsCeilingPF_AT || 75000);
  const cnpsEmployerRetraite = baseCNPSRetraite * (rates.cnpsEmployerRetraite / 100);
  const cnpsEmployerPF = baseCNPSPF * (rates.cnpsEmployerPF / 100);
  const cnpsEmployerAT = baseCNPSPF * (rates.cnpsEmployerAT / 100);
  const cnpsEmployer = Math.round(cnpsEmployerRetraite + cnpsEmployerPF + cnpsEmployerAT);

  // FDFP Patronale (TFC% + TAP%)
  const fdfpRateTotal = (rates.fdfpFPC + rates.fdfpTA) / 100;
  const fdfpTax = Math.round(brutImposable * fdfpRateTotal);

  // 3b. CMU (Calculé selon la base et les taux configurés, par défaut 500 FCFA salarié / 500 FCFA employeur)
  const cmuTotal = rates.cmuBase || 1000;
  const cmuEmployee = Math.round(cmuTotal * (rates.cmuEmployeeRate / 100));
  const cmuEmployer = Math.round(cmuTotal * (rates.cmuEmployerRate / 100));

  // Somme des retenues salariales totales
  const totalDeductions = Math.round(itsTax + igrTax + cnpsEmployee + cmuEmployee + totalDeductionsPresences);

  // Salaire Net Final
  const netSalary = Math.max(0, grossSalary - (itsTax + igrTax + cnpsEmployee + cmuEmployee));

  return {
    brutImposable: Math.round(brutImposable),
    grossSalary: Math.round(grossSalary),
    itsTax,
    igrTax,
    cnpsEmployee,
    cnpsEmployer,
    cmuEmployee,
    cmuEmployer,
    fdfpTax,
    totalDeductions,
    netSalary,
  };
}
