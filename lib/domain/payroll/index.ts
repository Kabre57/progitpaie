/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Barrel Export pour le module Domain / Payroll
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Point d'entrée unique du module :
 *   import { calculatePayslip, calculateITS } from "@/lib/domain/payroll"
 */

// Types
export { Money, MONEY_CURRENCY } from "./money";
export type { MoneyCurrency, MoneyInput } from "./money";
export { LeaveEntitlement } from "./provision/LeaveEntitlement";
export { TerminationBenefit } from "./provision/TerminationBenefit";
export { ProvisionCalculator } from "./provision/ProvisionCalculator";
export { ProvisionCalculatorV2 } from "./provision/ProvisionCalculatorV2";
export type {
  EmployeeProvisionV2Result,
  CompanyProvisionV2Result,
} from "./provision/ProvisionCalculatorV2";
export { SalaryReference } from "./provision/SalaryReference";
export type {
  SalaryReferenceBasis,
  SalaryCalculationBasis,
  SalaryReferencePeriodItem,
} from "./provision/SalaryReference";
export { PROVISION_RULE_VERSION } from "./provision/types";
export {
  PROVISION_V2_RULE_SET,
  getSeniorityBonusDays,
} from "./provision/ProvisionRuleSet";
export type {
  DecimalRate,
  LeaveDailyDivisor,
  LeaveValuationMethod,
  SeniorityBonusRule,
  TerminationTrancheRule,
  ProvisionRuleSet,
} from "./provision/ProvisionRuleSet";
export type {
  ProvisionWarning,
  ProvisionWarningCode,
  LeaveEntitlementInput,
  TerminationBenefitInput,
  ProvisionCalculationInput,
  LeaveProvisionDTO,
  TerminationBenefitDTO,
  ProvisionCalculationResult,
} from "./provision/types";
export type {
  LeaveLedgerMovementType,
  ProvisionEmployeeProfile,
  CompensationLineSnapshot,
  MonthlyCompensationSnapshot,
  LeaveLedgerMovement,
  ProvisionEmployeeAggregate,
} from "./provision/data";

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
