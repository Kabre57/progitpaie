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
import { calculateAllTaxDeductions, DEFAULT_ITS_SCHEDULE } from "./its-calculator";
import { CI_ITS_2024_RULE } from "../rules/ci-its-2024-rule";
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
  igrSchedule: IGRSchedule = DEFAULT_ITS_SCHEDULE,
  includeCMU: boolean = true
): PayslipResult {
  const { employee, month, year, variables } = input;

  // ─── 1. Éléments de rémunération ───────────────────────────────
  const baseSalary = employee.baseSalary;
  const sursalaire = employee.sursalaire;
  const transportAllowance = employee.transportAllowance;
  const housingAllowance = employee.housingAllowance ?? 0;

  const overtimePay = variables.overtimeAmount ?? calculateOvertimePay(
    variables.overtimeHours,
    variables.overtimeRate
  );

  const totalBonuses = variables.bonuses.reduce(
    (sum, bonus) => sum + bonus.amount,
    0
  );
  const attendanceDeductions = Math.max(
    0,
    (variables.absenceDeduction ?? 0) +
      (variables.lateDeduction ?? 0) +
      (variables.unpaidLeaveDeduction ?? 0)
  );

  // ─── 2. Bruts et bases CI ───────────────────────────────────────
  // Le transport demeure présenté séparément. Sa fraction exonérée est retirée de la
  // base sociale/fiscale, conformément au paramétrage versionné de l’entreprise.
  const grossSalary = Math.max(0, baseSalary + sursalaire + housingAllowance + overtimePay + totalBonuses);
  const grossCashBeforeAttendance = grossSalary + transportAllowance;
  const grossCashAfterAttendance = Math.max(0, grossCashBeforeAttendance - attendanceDeductions);
  const transportExemptAmount = Math.min(transportAllowance, rates.transportExemptAmount ?? 30_000);
  const taxableGross = Math.max(0, grossCashAfterAttendance - transportExemptAmount);
  const isZeroGross = grossCashAfterAttendance <= 0;

  // ─── 3. Cotisations sociales (CNPS + CMU + FDFP) ──────────────
  const employeeContributions = isZeroGross
    ? { cnpsRetirement: 0, cmu: 0, totalEmployee: 0 }
    : calculateAllEmployeeContributions(taxableGross, rates, includeCMU);

  const employerContributions = isZeroGross
    ? { cnpsRetirement: 0, cnpsFamily: 0, cnpsAccident: 0, cmu: 0, fdfpTA: 0, fdfpTFC: 0, totalEmployer: 0 }
    : calculateAllEmployerContributions(taxableGross, rates, includeCMU);

  // ─── 4. ITS unique (Réforme CI 2024 + RICF) ───────────────────
  const taxDeductions = isZeroGross
    ? { its: 0, cn: 0, igr: 0, ce: 0, totalTaxEmployee: 0 }
    : calculateAllTaxDeductions(
        taxableGross,
        employee.partsIGR,
        rates,
        igrSchedule,
        employeeContributions.cnpsRetirement
      );

  // ─── 5. Totaux et Net ─────────────────────────────────────────
  const totalDeductions =
    attendanceDeductions + employeeContributions.totalEmployee + taxDeductions.totalTaxEmployee;

  const netSalary = isZeroGross ? 0 : Math.max(0, grossCashBeforeAttendance - totalDeductions);
  const netToPay = isZeroGross ? 0 : Math.max(0, netSalary - variables.loanDeduction);

  // ─── 6. Résultat immutable ─────────────────────────────────────
  return {
    employeeId: employee.employeeId,
    employeeName: employee.name,
    month,
    year,
    baseSalary,
    sursalaire,
    transportAllowance,
    housingAllowance,
    overtimePay,
    totalBonuses,
    grossSalary,
    taxableGross,
    attendanceDeductions,
    employeeContributions,
    employerContributions,
    taxDeductions,
    totalDeductions,
    netSalary,
    netToPay,
    calculatedAt: new Date().toISOString(),
    formulaVersion: rates.ruleVersion ?? CI_ITS_2024_RULE.id,
  };
}
