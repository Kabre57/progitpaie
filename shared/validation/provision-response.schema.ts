import { z } from "zod";

const finiteNonNegative = z.number().finite().nonnegative();
const isoDateTime = z.string().datetime({ offset: true });

export const provisionWarningSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
}).strict();

export const payrollPeriodUsedSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  eligibleGross: finiteNonNegative,
}).strict();

export const leaveProvisionV2Schema = z.object({
  companyId: z.string().min(1),
  userId: z.string().min(1),
  employeeName: z.string().min(1),
  employeeId: z.string().nullable(),
  referenceDate: isoDateTime,
  joiningDate: isoDateTime,
  seniorityMonths: finiteNonNegative,
  effectiveServiceMonths: finiteNonNegative,
  baseAccruedDays: finiteNonNegative,
  seniorityBonusDays: finiteNonNegative,
  openingBalanceDays: z.number().finite(),
  carriedForwardDays: z.number().finite(),
  consumedDays: finiteNonNegative,
  compensatedDays: finiteNonNegative,
  closingBalanceDays: z.number().finite(),
  averageMonthlySalary: finiteNonNegative,
  dailyDivisorUsed: z.union([z.literal(26), z.literal(30)]),
  salaryMaintenanceDailyRate: finiteNonNegative,
  salaryMaintenanceAmount: finiteNonNegative,
  tenthRulePeriodSalary: finiteNonNegative,
  tenthRuleAmount: finiteNonNegative,
  selectedMethod: z.enum(["TENTH", "SALARY_MAINTENANCE"]),
  provisionAmount: finiteNonNegative,
  salaryMonthsUsed: z.number().int().min(0).max(12),
  payrollPeriodsUsed: z.array(payrollPeriodUsedSchema),
  ruleVersion: z.string().min(1),
  warnings: z.array(provisionWarningSchema),
}).strict();

export const terminationBenefitV2Schema = z.object({
  companyId: z.string().min(1),
  userId: z.string().min(1),
  employeeName: z.string().min(1),
  employeeId: z.string().nullable(),
  referenceDate: isoDateTime,
  seniorityMonths: finiteNonNegative,
  seniorityYears: z.string().regex(/^\d+(\.\d{1,4})?$/),
  averageMonthlySalary: finiteNonNegative,
  salaryMonthsUsed: z.number().int().min(0).max(12),
  firstTrancheMonths: finiteNonNegative,
  firstTrancheAmount: finiteNonNegative,
  secondTrancheMonths: finiteNonNegative,
  secondTrancheAmount: finiteNonNegative,
  thirdTrancheMonths: finiteNonNegative,
  thirdTrancheAmount: finiteNonNegative,
  theoreticalExposure: finiteNonNegative,
  eligible: z.boolean(),
  calculationBasis: z.enum(["ACTUAL_PAYROLL", "CONTRACT_FALLBACK"]),
  payrollPeriodsUsed: z.array(payrollPeriodUsedSchema),
  ruleVersion: z.string().min(1),
  warnings: z.array(provisionWarningSchema),
}).strict();

export const provisionDataQualitySchema = z.object({
  completeSalaryHistories: z.number().int().nonnegative(),
  incompleteSalaryHistories: z.number().int().nonnegative(),
  contractFallbacks: z.number().int().nonnegative(),
  legacyLeaveBalances: z.number().int().nonnegative(),
}).strict();

export const provisionResponseV2Schema = z.object({
  companyId: z.string().min(1),
  referenceDate: isoDateTime,
  ruleVersion: z.string().min(1),
  calculatedAt: isoDateTime,
  leaveProvisions: z.array(leaveProvisionV2Schema),
  terminationBenefits: z.array(terminationBenefitV2Schema),
  totalLeaveProvision: finiteNonNegative,
  totalTerminationExposure: finiteNonNegative,
  totalExposure: finiteNonNegative,
  employeesProcessed: z.number().int().nonnegative(),
  employeesWithWarnings: z.number().int().nonnegative(),
  warnings: z.array(provisionWarningSchema),
  dataQuality: provisionDataQualitySchema,
}).strict();

export const provisionV2ApiEnvelopeSchema = z.object({
  success: z.literal(true),
  data: provisionResponseV2Schema,
}).strict();

export const legacyLeaveProvisionSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  employeeId: z.string().nullable(),
  joiningDate: isoDateTime,
  grossMonthly: finiteNonNegative,
  leaveDaysAccrued: z.number().finite(),
  provisionAmount: finiteNonNegative,
}).strict();

export const legacyTerminationProvisionSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  employeeId: z.string().nullable(),
  joiningDate: isoDateTime,
  seniorityYears: finiteNonNegative,
  grossMonthly: finiteNonNegative,
  provisionAmount: finiteNonNegative,
}).strict();

export const legacyProvisionResponseSchema = z.object({
  companyId: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  leaveProvisions: z.array(legacyLeaveProvisionSchema),
  totalLeaveProvision: finiteNonNegative,
  retirementProvisions: z.array(legacyTerminationProvisionSchema),
  totalRetirementProvision: finiteNonNegative,
  total: finiteNonNegative,
}).strict();

export const legacyProvisionApiEnvelopeSchema = z.object({
  success: z.literal(true),
  data: legacyProvisionResponseSchema,
}).strict();

export type ProvisionV2ApiEnvelope = z.infer<typeof provisionV2ApiEnvelopeSchema>;
export type LegacyProvisionApiEnvelope = z.infer<typeof legacyProvisionApiEnvelopeSchema>;
