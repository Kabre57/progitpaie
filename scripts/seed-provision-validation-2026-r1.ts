import {
  ContractType, EmployeeCategory, LeaveLedgerEntryType, LeaveLedgerSourceType,
  PayrollEarningCategory, PayrollStatus, Prisma, PrismaClient, UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();
const DATASET_ID = "STAGING-PROVISIONS-2026-R1";
const RULE_VERSION = "CI-CCI-1977-PROVISIONS-2026.2";
const COMPANY_A = "progitpaie-default-001";
const COMPANY_B = "validation-tenant-b-2026-r1";
const REFERENCE_DATE = new Date("2026-08-03T23:59:59.999Z");
const PASSWORD_HASH = "$2b$12$JpARp/yTX4/B0fS0LeeWKO/D.zCNoC9u8Zs03bBe20d6OZkx9M3PS";

interface CaseDefinition {
  readonly id: string;
  readonly joiningDate: string;
  readonly payrollMonths: number;
  readonly base: number;
  readonly sursalaire: number;
  readonly bonus?: number;
  readonly expense?: number;
  readonly opening?: number;
  readonly consumed?: number;
  readonly compensated?: number;
  readonly purpose: string;
}

const CASES: readonly CaseDefinition[] = [
  { id: "C01", joiningDate: "2026-02-03", payrollMonths: 6, base: 200_000, sursalaire: 50_000, purpose: "Ancienneté inférieure à un an" },
  { id: "C02", joiningDate: "2023-08-03", payrollMonths: 8, base: 210_000, sursalaire: 50_000, purpose: "Tranche 30 % sur trois ans" },
  { id: "C03", joiningDate: "2018-08-03", payrollMonths: 8, base: 220_000, sursalaire: 60_000, purpose: "Tranches 30 % et 35 % sur huit ans" },
  { id: "C04", joiningDate: "2011-08-03", payrollMonths: 8, base: 240_000, sursalaire: 60_000, purpose: "Trois tranches sur quinze ans" },
  { id: "C05", joiningDate: "2021-08-03", payrollMonths: 8, base: 200_000, sursalaire: 40_000, purpose: "Bonus ancienneté cinq ans" },
  { id: "C06", joiningDate: "2016-08-03", payrollMonths: 8, base: 205_000, sursalaire: 40_000, purpose: "Bonus ancienneté dix ans" },
  { id: "C07", joiningDate: "2011-08-03", payrollMonths: 8, base: 210_000, sursalaire: 40_000, purpose: "Bonus ancienneté quinze ans" },
  { id: "C08", joiningDate: "2006-08-03", payrollMonths: 8, base: 215_000, sursalaire: 40_000, purpose: "Bonus ancienneté vingt ans" },
  { id: "C09", joiningDate: "2001-08-03", payrollMonths: 8, base: 220_000, sursalaire: 40_000, purpose: "Bonus ancienneté vingt-cinq ans" },
  { id: "C10", joiningDate: "1996-08-03", payrollMonths: 8, base: 225_000, sursalaire: 40_000, purpose: "Bonus ancienneté trente ans" },
  { id: "C11", joiningDate: "2022-01-01", payrollMonths: 8, base: 230_000, sursalaire: 50_000, opening: 10, consumed: 5, purpose: "Congés consommés" },
  { id: "C12", joiningDate: "2021-01-01", payrollMonths: 8, base: 235_000, sursalaire: 50_000, opening: 10, compensated: 4, purpose: "Congés compensés" },
  { id: "C13", joiningDate: "2019-01-01", payrollMonths: 4, base: 240_000, sursalaire: 60_000, purpose: "Historique salarial partiel janvier-août" },
  { id: "C14", joiningDate: "2018-01-01", payrollMonths: 0, base: 245_000, sursalaire: 60_000, purpose: "Fallback contractuel" },
  { id: "C15", joiningDate: "2017-01-01", payrollMonths: 8, base: 250_000, sursalaire: 60_000, expense: 45_000, purpose: "Remboursement de frais exclu" },
  { id: "C16", joiningDate: "2016-01-01", payrollMonths: 8, base: 255_000, sursalaire: 60_000, bonus: 35_000, purpose: "Prime éligible incluse" },
  { id: "C17", joiningDate: "2021-08-03", payrollMonths: 8, base: 260_000, sursalaire: 60_000, purpose: "Frontière du palier cinq ans" },
  { id: "C18", joiningDate: "2026-08-04", payrollMonths: 0, base: 265_000, sursalaire: 60_000, purpose: "Embauche postérieure à la référence" },
];

const CASES_B: readonly CaseDefinition[] = [
  { id: "B01", joiningDate: "2021-01-01", payrollMonths: 8, base: 180_000, sursalaire: 20_000, purpose: "Isolation tenant B" },
  { id: "B02", joiningDate: "2014-01-01", payrollMonths: 8, base: 190_000, sursalaire: 25_000, bonus: 15_000, purpose: "Totaux tenant B" },
];

function date(value: string): Date { return new Date(`${value}T00:00:00.000Z`); }

async function foundation(tx: Prisma.TransactionClient, companyId: string, name: string) {
  await tx.company.upsert({ where: { id: companyId }, update: { name, isActive: true }, create: { id: companyId, name, city: "Abidjan", country: "Côte d'Ivoire" } });
  const department = await tx.department.upsert({
    where: { companyId_name: { companyId, name: `${DATASET_ID}-VALIDATION` } }, update: { isActive: true },
    create: { id: `${companyId}-${DATASET_ID}-department`, companyId, name: `${DATASET_ID}-VALIDATION`, description: "Validation provisions 2026" },
  });
  const shift = await tx.shift.upsert({
    where: { companyId_name: { companyId, name: `${DATASET_ID}-SHIFT` } }, update: { isActive: true },
    create: { id: `${companyId}-${DATASET_ID}-shift`, companyId, name: `${DATASET_ID}-SHIFT`, startTime: "08:00", endTime: "17:00", workingHours: 8 },
  });
  return { departmentId: department.id, shiftId: shift.id };
}

async function payrolls(tx: Prisma.TransactionClient, companyId: string, userId: string, item: CaseDefinition) {
  const firstMonth = 9 - item.payrollMonths;
  for (let month = firstMonth; month <= 8; month += 1) {
    const bonus = item.bonus ?? 0;
    const expense = item.expense ?? 0;
    const eligible = item.base + item.sursalaire + bonus;
    const timestamp = new Date(Date.UTC(2026, month - 1, month === 8 ? 2 : 28, 12));
    const payroll = await tx.payroll.upsert({
      where: { userId_month_year: { userId, month, year: 2026 } },
      update: { companyId, basicSalary: item.base, sursalaire: item.sursalaire, bonuses: bonus, transportAllowance: expense, grossSalary: eligible + expense, netSalary: eligible + expense, status: PayrollStatus.finalized, finalizedAt: timestamp },
      create: { id: `${companyId}-2026-${item.id}-${month}`, companyId, userId, month, year: 2026, basicSalary: item.base, sursalaire: item.sursalaire, bonuses: bonus, transportAllowance: expense, grossSalary: eligible + expense, netSalary: eligible + expense, presentDays: 26, status: PayrollStatus.finalized, generatedAt: timestamp, finalizedAt: timestamp },
    });
    const lines = [
      { code: "BASE", label: "Salaire de base", category: PayrollEarningCategory.BASE_SALARY, amount: item.base, include: true, expense: false },
      { code: "SURSALAIRE", label: "Sursalaire", category: PayrollEarningCategory.SURSALAIRE, amount: item.sursalaire, include: true, expense: false },
      ...(bonus ? [{ code: "BONUS", label: "Prime éligible", category: PayrollEarningCategory.BONUS, amount: bonus, include: true, expense: false }] : []),
      ...(expense ? [{ code: "EXPENSE", label: "Remboursement de frais", category: PayrollEarningCategory.EXPENSE_REIMBURSEMENT, amount: expense, include: false, expense: true }] : []),
    ];
    for (const line of lines) await tx.payrollEarningLine.upsert({
      where: { payrollId_code: { payrollId: payroll.id, code: line.code } },
      update: { companyId, label: line.label, category: line.category, amount: new Prisma.Decimal(line.amount), includedInLeaveBase: line.include, includedInTerminationBase: line.include, isExpenseReimbursement: line.expense, classificationSource: DATASET_ID, isEstimated: false },
      create: { id: `${payroll.id}-${line.code}`, companyId, payrollId: payroll.id, code: line.code, label: line.label, category: line.category, amount: new Prisma.Decimal(line.amount), includedInLeaveBase: line.include, includedInTerminationBase: line.include, isExpenseReimbursement: line.expense, classificationSource: DATASET_ID, isEstimated: false },
    });
  }
}

async function ledger(tx: Prisma.TransactionClient, companyId: string, userId: string, caseId: string, type: LeaveLedgerEntryType, days: number) {
  const sourceId = `${DATASET_ID}-${companyId}-${caseId}-${type}`;
  await tx.leaveLedgerEntry.upsert({
    where: { companyId_sourceType_sourceId_entryType: { companyId, sourceType: LeaveLedgerSourceType.MANUAL, sourceId, entryType: type } },
    update: { days: new Prisma.Decimal(days), ruleVersion: RULE_VERSION },
    create: { id: `${companyId}-2026-${caseId}-${type}`, companyId, userId, effectiveDate: new Date("2026-01-01T00:00:00.000Z"), referencePeriod: "2026", entryType: type, days: new Prisma.Decimal(days), sourceType: LeaveLedgerSourceType.MANUAL, sourceId, ruleVersion: RULE_VERSION, reason: DATASET_ID },
  });
}

async function validationCase(tx: Prisma.TransactionClient, companyId: string, base: Awaited<ReturnType<typeof foundation>>, item: CaseDefinition) {
  const marker = companyId === COMPANY_A ? "A" : "B";
  const employeeId = `VAL26-${marker}-${item.id}`;
  const userId = `${companyId}-2026-${item.id}-employee`;
  await tx.user.upsert({
    where: { email: `${employeeId.toLowerCase()}@validation.invalid` },
    update: { companyId, employeeId, joiningDate: date(item.joiningDate), salary: item.base, sursalaire: item.sursalaire, departmentId: base.departmentId, shiftId: base.shiftId, isActive: true, jobTitle: item.purpose },
    create: { id: userId, companyId, employeeId, name: `${DATASET_ID} ${item.id}`, email: `${employeeId.toLowerCase()}@validation.invalid`, password: PASSWORD_HASH, role: UserRole.employee, joiningDate: date(item.joiningDate), salary: item.base, sursalaire: item.sursalaire, departmentId: base.departmentId, shiftId: base.shiftId, isActive: true, jobTitle: item.purpose, category: "employe", contractType: "CDI" },
  });
  await tx.contract.upsert({
    where: { id: `${companyId}-2026-${item.id}-contract` },
    update: { companyId, userId, startDate: date(item.joiningDate), baseSalary: item.base, sursalaire: item.sursalaire, status: "active" },
    create: { id: `${companyId}-2026-${item.id}-contract`, companyId, userId, type: ContractType.CDI, category: EmployeeCategory.employe, jobTitle: item.purpose, startDate: date(item.joiningDate), baseSalary: item.base, sursalaire: item.sursalaire, status: "active" },
  });
  await payrolls(tx, companyId, userId, item);
  if (date(item.joiningDate) <= REFERENCE_DATE) {
    await ledger(tx, companyId, userId, item.id, LeaveLedgerEntryType.OPENING_BALANCE, item.opening ?? 0);
    if (item.consumed) await ledger(tx, companyId, userId, item.id, LeaveLedgerEntryType.LEAVE_CONSUMED, item.consumed);
    if (item.compensated) await ledger(tx, companyId, userId, item.id, LeaveLedgerEntryType.LEAVE_COMPENSATED, item.compensated);
  }
}

async function main() {
  const primary = await prisma.company.findUnique({ where: { id: COMPANY_A } });
  if (!primary) throw new Error(`Tenant introuvable: ${COMPANY_A}`);
  await prisma.$transaction(async (tx) => {
    const baseA = await foundation(tx, COMPANY_A, primary.name);
    const baseB = await foundation(tx, COMPANY_B, "VALIDATION TENANT B 2026 R1");
    for (const [companyId, marker] of [[COMPANY_A, "A"], [COMPANY_B, "B"]] as const) {
      await tx.user.upsert({
        where: { email: `admin-${marker.toLowerCase()}-2026-r1@validation.invalid` },
        update: { companyId, role: UserRole.admin, isActive: true },
        create: { id: `${companyId}-2026-admin`, companyId, name: `${DATASET_ID} ADMIN ${marker}`, email: `admin-${marker.toLowerCase()}-2026-r1@validation.invalid`, password: PASSWORD_HASH, role: UserRole.admin, joiningDate: new Date("2020-01-01T00:00:00.000Z"), isActive: true },
      });
    }
    for (const item of CASES) await validationCase(tx, COMPANY_A, baseA, item);
    for (const item of CASES_B) await validationCase(tx, COMPANY_B, baseB, item);
  }, { timeout: 120_000 });
  console.log(JSON.stringify({ datasetId: DATASET_ID, referenceDate: REFERENCE_DATE.toISOString(), primaryCases: 18, secondaryCases: 2 }));
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Erreur inconnue"); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
