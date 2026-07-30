/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Barrel Export pour le module Domain / Payroll
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Point d'entrée unique du module :
 *   import { calculatePayslip, calculateITS } from "@/lib/domain/payroll"
 */

// Types
export type {
  EmployeePayrollData,
  MonthlyVariableElements,
  PayslipCalculationInput,
  PayslipResult,
  TaxRatesConfig,
  IGRSchedule,
  IGRBracket,
  EmployeeContributions,
  EmployerContributions,
  TaxDeductions,
  ITSDeclarationData,
  CNPSDeclarationData,
  FDFPDeclarationData,
  DomainEventType,
  DomainEvent,
} from "./types/payroll-types";

// Calculateurs
export {
  calculateITS,
  calculateCN,
  calculateCE,
  calculateIGR,
  calculateAllTaxDeductions,
  DEFAULT_IGR_SCHEDULE,
} from "./calculator/its-calculator";

export {
  calculateCappedBase,
  calculateCNPSRetirementEmployee,
  calculateCNPSRetirementEmployer,
  calculateCNPSFamilyAllowance,
  calculateCNPSAccidentAtWork,
  calculateCMU,
  calculateAllEmployeeContributions,
  calculateAllEmployerContributions,
} from "./calculator/cnps-calculator";

export {
  calculatePayslip,
  calculateSeniorityBonus,
  calculateOvertimePay,
  calculateSeniorityYears,
} from "./calculator/payslip-calculator";
