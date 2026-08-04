import {
  ContractType,
  EmployeeCategory,
  LeaveLedgerEntryType,
  LeaveLedgerSourceType,
  PayrollEarningCategory,
  PayrollStatus,
  Prisma,
  PrismaClient,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();
const DATASET_ID = "STAGING-PROVISIONS-2025-R1";
const RULE_VERSION = "CI-CCI-1977-PROVISIONS-2026.2";
const PRIMARY_COMPANY_ID = "progitpaie-default-001";
const SECONDARY_COMPANY_ID = "validation-tenant-b-r1";
const VALIDATION_PASSWORD_HASH = "$2b$12$JpARp/yTX4/B0fS0LeeWKO/D.zCNoC9u8Zs03bBe20d6OZkx9M3PS";

interface ValidationCase {
  readonly id: string;
  readonly joiningDate: string;
  readonly payrollMonths: number;
  readonly baseSalary: number;
  readonly sursalaire: number;
  readonly monthlyBonus?: number;
  readonly monthlyExpense?: number;
  readonly openingDays?: number;
  readonly consumedDays?: number;
  readonly compensatedDays?: number;
  readonly expectedPurpose: string;
}

const CASES: readonly ValidationCase[] = [
  { id: "C01", joiningDate: "2025-07-01", payrollMonths: 6, baseSalary: 200_000, sursalaire: 50_000, expectedPurpose: "Ancienneté inférieure à un an" },
  { id: "C02", joiningDate: "2022-12-31", payrollMonths: 12, baseSalary: 210_000, sursalaire: 50_000, expectedPurpose: "Tranche 30 % sur trois ans" },
  { id: "C03", joiningDate: "2017-12-31", payrollMonths: 12, baseSalary: 220_000, sursalaire: 60_000, expectedPurpose: "Tranches 30 % et 35 % sur huit ans" },
  { id: "C04", joiningDate: "2010-12-31", payrollMonths: 12, baseSalary: 240_000, sursalaire: 60_000, expectedPurpose: "Trois tranches sur quinze ans" },
  { id: "C05", joiningDate: "2020-12-31", payrollMonths: 12, baseSalary: 200_000, sursalaire: 40_000, expectedPurpose: "Bonus ancienneté cinq ans" },
  { id: "C06", joiningDate: "2015-12-31", payrollMonths: 12, baseSalary: 205_000, sursalaire: 40_000, expectedPurpose: "Bonus ancienneté dix ans" },
  { id: "C07", joiningDate: "2010-12-31", payrollMonths: 12, baseSalary: 210_000, sursalaire: 40_000, expectedPurpose: "Bonus ancienneté quinze ans" },
  { id: "C08", joiningDate: "2005-12-31", payrollMonths: 12, baseSalary: 215_000, sursalaire: 40_000, expectedPurpose: "Bonus ancienneté vingt ans" },
  { id: "C09", joiningDate: "2000-12-31", payrollMonths: 12, baseSalary: 220_000, sursalaire: 40_000, expectedPurpose: "Bonus ancienneté vingt-cinq ans" },
  { id: "C10", joiningDate: "1995-12-31", payrollMonths: 12, baseSalary: 225_000, sursalaire: 40_000, expectedPurpose: "Bonus ancienneté trente ans" },
  { id: "C11", joiningDate: "2022-01-01", payrollMonths: 12, baseSalary: 230_000, sursalaire: 50_000, openingDays: 10, consumedDays: 5, expectedPurpose: "Congés consommés" },
  { id: "C12", joiningDate: "2021-01-01", payrollMonths: 12, baseSalary: 235_000, sursalaire: 50_000, openingDays: 10, compensatedDays: 4, expectedPurpose: "Congés compensés" },
  { id: "C13", joiningDate: "2019-01-01", payrollMonths: 6, baseSalary: 240_000, sursalaire: 60_000, expectedPurpose: "Historique salarial incomplet" },
  { id: "C14", joiningDate: "2018-01-01", payrollMonths: 0, baseSalary: 245_000, sursalaire: 60_000, expectedPurpose: "Fallback contractuel sans paie" },
  { id: "C15", joiningDate: "2017-01-01", payrollMonths: 12, baseSalary: 250_000, sursalaire: 60_000, monthlyExpense: 45_000, expectedPurpose: "Remboursement de frais exclu" },
  { id: "C16", joiningDate: "2016-01-01", payrollMonths: 12, baseSalary: 255_000, sursalaire: 60_000, monthlyBonus: 35_000, expectedPurpose: "Prime éligible incluse" },
  { id: "C17", joiningDate: "2020-12-31", payrollMonths: 12, baseSalary: 260_000, sursalaire: 60_000, expectedPurpose: "Frontière exacte du palier cinq ans" },
  { id: "C18", joiningDate: "2026-01-01", payrollMonths: 0, baseSalary: 265_000, sursalaire: 60_000, expectedPurpose: "Embauche postérieure à la référence" },
];

const TENANT_B_CASES: readonly ValidationCase[] = [
  { id: "B01", joiningDate: "2021-01-01", payrollMonths: 12, baseSalary: 180_000, sursalaire: 20_000, expectedPurpose: "Contrôle isolation tenant B" },
  { id: "B02", joiningDate: "2014-01-01", payrollMonths: 12, baseSalary: 190_000, sursalaire: 25_000, monthlyBonus: 15_000, expectedPurpose: "Contrôle totaux tenant B" },
];

function utc(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

async function upsertCompanyFoundation(
  tx: Prisma.TransactionClient,
  companyId: string,
  companyName: string
): Promise<{ departmentId: string; shiftId: string }> {
  await tx.company.upsert({
    where: { id: companyId },
    update: { name: companyName, isActive: true },
    create: { id: companyId, name: companyName, city: "Abidjan", country: "Côte d'Ivoire", isActive: true },
  });
  const department = await tx.department.upsert({
    where: { companyId_name: { companyId, name: `${DATASET_ID}-VALIDATION` } },
    update: { isActive: true },
    create: { id: `${companyId}-department`, companyId, name: `${DATASET_ID}-VALIDATION`, description: "Cas de validation des provisions" },
  });
  const shift = await tx.shift.upsert({
    where: { companyId_name: { companyId, name: `${DATASET_ID}-SHIFT` } },
    update: { isActive: true },
    create: { id: `${companyId}-shift`, companyId, name: `${DATASET_ID}-SHIFT`, startTime: "08:00", endTime: "17:00", workingHours: 8 },
  });
  return { departmentId: department.id, shiftId: shift.id };
}

async function upsertLedger(
  tx: Prisma.TransactionClient,
  companyId: string,
  userId: string,
  caseId: string,
  entryType: LeaveLedgerEntryType,
  days: number
): Promise<void> {
  const sourceId = `${DATASET_ID}-${companyId}-${caseId}-${entryType}`;
  await tx.leaveLedgerEntry.upsert({
    where: { companyId_sourceType_sourceId_entryType: { companyId, sourceType: LeaveLedgerSourceType.MANUAL, sourceId, entryType } },
    update: { days: new Prisma.Decimal(days), ruleVersion: RULE_VERSION, isEstimated: false },
    create: {
      id: `${companyId}-${caseId}-ledger-${entryType.toLowerCase()}`,
      companyId,
      userId,
      effectiveDate: utc("2025-01-01"),
      referencePeriod: "2025",
      entryType,
      days: new Prisma.Decimal(days),
      sourceType: LeaveLedgerSourceType.MANUAL,
      sourceId,
      ruleVersion: RULE_VERSION,
      reason: `${DATASET_ID} ${caseId}`,
      isEstimated: false,
    },
  });
}

async function upsertPayrollHistory(
  tx: Prisma.TransactionClient,
  companyId: string,
  userId: string,
  testCase: ValidationCase
): Promise<void> {
  const firstMonth = 13 - testCase.payrollMonths;
  for (let month = firstMonth; month <= 12; month += 1) {
    const bonus = testCase.monthlyBonus ?? 0;
    const expense = testCase.monthlyExpense ?? 0;
    const eligibleGross = testCase.baseSalary + testCase.sursalaire + bonus;
    const payroll = await tx.payroll.upsert({
      where: { userId_month_year: { userId, month, year: 2025 } },
      update: {
        companyId, basicSalary: testCase.baseSalary, sursalaire: testCase.sursalaire,
        bonuses: bonus, transportAllowance: expense, grossSalary: eligibleGross + expense,
        netSalary: eligibleGross + expense, status: PayrollStatus.finalized,
        finalizedAt: new Date(Date.UTC(2025, month - 1, 28, 12)),
      },
      create: {
        id: `${companyId}-${testCase.id}-payroll-2025-${String(month).padStart(2, "0")}`,
        companyId, userId, month, year: 2025,
        basicSalary: testCase.baseSalary, sursalaire: testCase.sursalaire,
        bonuses: bonus, transportAllowance: expense, grossSalary: eligibleGross + expense,
        netSalary: eligibleGross + expense, presentDays: 26, status: PayrollStatus.finalized,
        generatedAt: new Date(Date.UTC(2025, month - 1, 28, 10)),
        finalizedAt: new Date(Date.UTC(2025, month - 1, 28, 12)),
      },
    });
    const lines = [
      { code: "BASE", label: "Salaire de base", category: PayrollEarningCategory.BASE_SALARY, amount: testCase.baseSalary, leave: true, termination: true, expense: false },
      { code: "SURSALAIRE", label: "Sursalaire", category: PayrollEarningCategory.SURSALAIRE, amount: testCase.sursalaire, leave: true, termination: true, expense: false },
      ...(bonus > 0 ? [{ code: "BONUS", label: "Prime éligible", category: PayrollEarningCategory.BONUS, amount: bonus, leave: true, termination: true, expense: false }] : []),
      ...(expense > 0 ? [{ code: "EXPENSE", label: "Remboursement de frais", category: PayrollEarningCategory.EXPENSE_REIMBURSEMENT, amount: expense, leave: false, termination: false, expense: true }] : []),
    ];
    for (const line of lines) {
      await tx.payrollEarningLine.upsert({
        where: { payrollId_code: { payrollId: payroll.id, code: line.code } },
        update: {
          companyId, label: line.label, category: line.category, amount: new Prisma.Decimal(line.amount),
          includedInLeaveBase: line.leave, includedInTerminationBase: line.termination,
          isExpenseReimbursement: line.expense, classificationSource: DATASET_ID, isEstimated: false,
        },
        create: {
          id: `${payroll.id}-${line.code.toLowerCase()}`, companyId, payrollId: payroll.id,
          code: line.code, label: line.label, category: line.category, amount: new Prisma.Decimal(line.amount),
          includedInLeaveBase: line.leave, includedInTerminationBase: line.termination,
          isExpenseReimbursement: line.expense, classificationSource: DATASET_ID, isEstimated: false,
        },
      });
    }
  }
}

async function upsertValidationCase(
  tx: Prisma.TransactionClient,
  companyId: string,
  foundation: { departmentId: string; shiftId: string },
  testCase: ValidationCase,
  password: string
): Promise<void> {
  const userId = `${companyId}-${testCase.id.toLowerCase()}-employee`;
  const employeeId = `VAL-${companyId === PRIMARY_COMPANY_ID ? "A" : "B"}-${testCase.id}`;
  await tx.user.upsert({
    where: { email: `${employeeId.toLowerCase()}@validation.invalid` },
    update: {
      companyId, employeeId, joiningDate: utc(testCase.joiningDate), salary: testCase.baseSalary,
      sursalaire: testCase.sursalaire, departmentId: foundation.departmentId, shiftId: foundation.shiftId,
      isActive: true, jobTitle: testCase.expectedPurpose,
    },
    create: {
      id: userId, companyId, name: `${DATASET_ID} ${testCase.id}`,
      email: `${employeeId.toLowerCase()}@validation.invalid`, password, role: UserRole.employee,
      employeeId, joiningDate: utc(testCase.joiningDate), salary: testCase.baseSalary,
      sursalaire: testCase.sursalaire, departmentId: foundation.departmentId, shiftId: foundation.shiftId,
      jobTitle: testCase.expectedPurpose, category: "employe", contractType: "CDI", isActive: true,
    },
  });
  await tx.contract.upsert({
    where: { id: `${companyId}-${testCase.id}-contract` },
    update: { companyId, userId, startDate: utc(testCase.joiningDate), baseSalary: testCase.baseSalary, sursalaire: testCase.sursalaire, status: "active" },
    create: {
      id: `${companyId}-${testCase.id}-contract`, companyId, userId, type: ContractType.CDI,
      category: EmployeeCategory.employe, jobTitle: testCase.expectedPurpose,
      startDate: utc(testCase.joiningDate), probationPeriodMonths: 0,
      baseSalary: testCase.baseSalary, sursalaire: testCase.sursalaire, status: "active",
    },
  });
  await upsertPayrollHistory(tx, companyId, userId, testCase);
  if (utc(testCase.joiningDate) <= utc("2025-12-31")) {
    await upsertLedger(tx, companyId, userId, testCase.id, LeaveLedgerEntryType.OPENING_BALANCE, testCase.openingDays ?? 0);
    if (testCase.consumedDays) await upsertLedger(tx, companyId, userId, testCase.id, LeaveLedgerEntryType.LEAVE_CONSUMED, testCase.consumedDays);
    if (testCase.compensatedDays) await upsertLedger(tx, companyId, userId, testCase.id, LeaveLedgerEntryType.LEAVE_COMPENSATED, testCase.compensatedDays);
  }
}

async function main(): Promise<void> {
  const primary = await prisma.company.findUnique({ where: { id: PRIMARY_COMPANY_ID } });
  if (!primary) throw new Error(`Tenant principal introuvable: ${PRIMARY_COMPANY_ID}`);

  await prisma.$transaction(async (tx) => {
    const primaryFoundation = await upsertCompanyFoundation(tx, PRIMARY_COMPANY_ID, primary.name);
    const secondaryFoundation = await upsertCompanyFoundation(tx, SECONDARY_COMPANY_ID, "VALIDATION TENANT B R1");
    await tx.user.upsert({
      where: { email: "admin-a-r1@validation.invalid" },
      update: { companyId: PRIMARY_COMPANY_ID, role: UserRole.admin, isActive: true },
      create: {
        id: `${PRIMARY_COMPANY_ID}-validation-admin`, companyId: PRIMARY_COMPANY_ID,
        name: `${DATASET_ID} ADMIN A`, email: "admin-a-r1@validation.invalid",
        password: VALIDATION_PASSWORD_HASH, role: UserRole.admin, joiningDate: utc("2020-01-01"),
        salary: 0, sursalaire: 0, isActive: true,
      },
    });
    await tx.user.upsert({
      where: { email: "admin-b-r1@validation.invalid" },
      update: { companyId: SECONDARY_COMPANY_ID, role: UserRole.admin, isActive: true },
      create: {
        id: `${SECONDARY_COMPANY_ID}-admin`, companyId: SECONDARY_COMPANY_ID,
        name: `${DATASET_ID} ADMIN B`, email: "admin-b-r1@validation.invalid",
        password: VALIDATION_PASSWORD_HASH, role: UserRole.admin, joiningDate: utc("2020-01-01"),
        salary: 0, sursalaire: 0, isActive: true,
      },
    });
    await tx.payroll.deleteMany({
      where: {
        id: {
          in: ["C01", "C13"].flatMap((caseId) =>
            Array.from({ length: 6 }, (_, index) =>
              `${PRIMARY_COMPANY_ID}-${caseId}-payroll-2025-${String(index + 1).padStart(2, "0")}`
            )
          ),
        },
      },
    });
    await tx.leaveLedgerEntry.deleteMany({
      where: { id: `${PRIMARY_COMPANY_ID}-C18-ledger-opening_balance` },
    });
    for (const testCase of CASES) await upsertValidationCase(tx, PRIMARY_COMPANY_ID, primaryFoundation, testCase, VALIDATION_PASSWORD_HASH);
    for (const testCase of TENANT_B_CASES) await upsertValidationCase(tx, SECONDARY_COMPANY_ID, secondaryFoundation, testCase, VALIDATION_PASSWORD_HASH);
  }, { timeout: 120_000 });

  console.log(JSON.stringify({ datasetId: DATASET_ID, primaryCases: CASES.length, secondaryCases: TENANT_B_CASES.length, ruleVersion: RULE_VERSION }));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Erreur inconnue");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
