/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Moteur Principal de Calcul de Paie (Payslip Calculator)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Point d'entrée unique pour le calcul d'un bulletin de paie complet.
 * Orchestre les calculateurs ITS/IGR et CNPS/FDFP.
 *
 * Ce module remplace la logique dupliquée entre :
 *   - app/api/export/payslip/[userId]/route.ts (470 lignes)
 *   - app/api/export/payslip/bulk/route.ts (445 lignes)
 *
 * ADR-001 : Fonction pure, zéro `any`, zéro accès DB, zéro side effect.
 * ADR-003 : Support du versioning des formules via IGRSchedule.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type {
  EmployeePayrollData,
  MonthlyVariableElements,
  PayslipCalculationInput,
  PayslipResult,
  TaxRatesConfig,
  IGRSchedule,
} from "../types/payroll-types";
import { calculateAllTaxDeductions, DEFAULT_IGR_SCHEDULE } from "./its-calculator";
import { calculateAllEmployeeContributions, calculateAllEmployerContributions } from "./cnps-calculator";

// ─── Calcul des éléments de rémunération ─────────────────────────────────────

/**
 * Calcule la prime d'ancienneté selon la convention collective de Côte d'Ivoire
 *
 * Barème :
 *   - 2-5 ans   : 2%
 *   - 6-10 ans  : 3%
 *   - 11-15 ans : 5%
 *   - 16-20 ans : 7%
 *   - 21-25 ans : 10%
 *   - 26+ ans   : 12%
 *
 * @param baseSalary    - Le salaire de base
 * @param seniorityYears - Le nombre d'années d'ancienneté
 * @returns Le montant de la prime d'ancienneté
 */
export function calculateSeniorityBonus(baseSalary: number, seniorityYears: number): number {
  if (seniorityYears < 2 || baseSalary <= 0) return 0;

  let rate: number;
  if (seniorityYears <= 5) rate = 0.02;
  else if (seniorityYears <= 10) rate = 0.03;
  else if (seniorityYears <= 15) rate = 0.05;
  else if (seniorityYears <= 20) rate = 0.07;
  else if (seniorityYears <= 25) rate = 0.10;
  else rate = 0.12;

  return Math.round(baseSalary * rate);
}

/**
 * Calcule les heures supplémentaires
 *
 * @param hours - Nombre d'heures supplémentaires
 * @param rate  - Taux horaire de base
 * @returns Le montant des heures supplémentaires
 */
export function calculateOvertimePay(hours: number, rate: number): number {
  if (hours <= 0 || rate <= 0) return 0;
  return Math.round(hours * rate);
}

/**
 * Calcule le nombre d'années d'ancienneté
 *
 * @param joiningDate - La date d'entrée dans l'entreprise
 * @param month       - Le mois de paie
 * @param year        - L'année de paie
 * @returns Le nombre d'années d'ancienneté
 */
export function calculateSeniorityYears(joiningDate: string, month: number, year: number): number {
  const jDate = new Date(joiningDate);
  const payDate = new Date(year, month - 1);
  const diffMs = payDate.getTime() - jDate.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)));
}

// ─── Orchestrateur principal ─────────────────────────────────────────────────

/**
 * Calcule un bulletin de paie complet à partir des données d'entrée.
 *
 * C'est LE point d'entrée unique pour tous les calculs de paie.
 * Les routes API et les générateurs PDF doivent utiliser cette fonction
 * au lieu de dupliquer la logique métier.
 *
 * @param input       - Les données d'entrée (employé + variables du mois)
 * @param rates       - La configuration des taux de cotisation
 * @param igrSchedule - Le barème IGR à appliquer (versioning)
 * @param includeCMU  - Inclure la CMU dans le calcul
 * @returns Le résultat complet du bulletin de paie
 */
export function calculatePayslip(
  input: PayslipCalculationInput,
  rates: TaxRatesConfig,
  igrSchedule: IGRSchedule = DEFAULT_IGR_SCHEDULE,
  includeCMU: boolean = true
): PayslipResult {
  const { employee, month, year, variables } = input;

  // ─── 1. Éléments de rémunération ───────────────────────────────
  const baseSalary = employee.baseSalary;
  const sursalaire = employee.sursalaire;
  const transportAllowance = employee.transportAllowance;

  const overtimePay = calculateOvertimePay(
    variables.overtimeHours,
    variables.overtimeRate
  );

  const totalBonuses = variables.bonuses.reduce(
    (sum, bonus) => sum + bonus.amount,
    0
  );

  // ─── 2. Bruts ──────────────────────────────────────────────────
  const grossSalary = baseSalary + sursalaire + overtimePay + totalBonuses;

  // ─── 3. Cotisations sociales (CNPS + CMU + FDFP) ──────────────
  const employeeContributions = calculateAllEmployeeContributions(
    grossSalary,
    rates,
    includeCMU
  );

  const employerContributions = calculateAllEmployerContributions(
    grossSalary,
    rates,
    includeCMU
  );

  // ─── 4. Impôts (ITS + CN + IGR + CE) ──────────────────────────
  const taxDeductions = calculateAllTaxDeductions(
    grossSalary,
    employee.partsIGR,
    rates,
    igrSchedule
  );

  // ─── 5. Totaux et Net ─────────────────────────────────────────
  const totalDeductions =
    employeeContributions.totalEmployee + taxDeductions.totalTaxEmployee;

  const netSalary = grossSalary + transportAllowance - totalDeductions;
  const netToPay = netSalary - variables.loanDeduction;

  // ─── 6. Résultat immutable ─────────────────────────────────────
  return {
    employeeId: employee.employeeId,
    employeeName: employee.name,
    month,
    year,
    baseSalary,
    sursalaire,
    transportAllowance,
    overtimePay,
    totalBonuses,
    grossSalary,
    employeeContributions,
    employerContributions,
    taxDeductions,
    totalDeductions,
    netSalary,
    netToPay,
    calculatedAt: new Date().toISOString(),
    formulaVersion: `SYSCOHADA-CI-${igrSchedule.validFrom.substring(0, 4)}-v1`,
  };
}
