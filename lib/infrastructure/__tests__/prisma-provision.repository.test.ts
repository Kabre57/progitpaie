import { Prisma, PayrollStatus, LeaveLedgerEntryType, LeaveLedgerSourceType } from "@prisma/client";
import { PrismaProvisionRepository } from "../repositories/prisma-provision.repository";
import type {
  ProvisionDataGateway,
  ProvisionEmployeeRecord,
  ProvisionPayrollRecord,
} from "../repositories/prisma-provision.repository";
import { mapPayrollCompensation, TenantDataMismatchError } from "../repositories/mappers/payroll-compensation.mapper";
import { mapLeaveLedgerEntry } from "../repositories/mappers/leave-ledger.mapper";

const referenceDate = new Date("2026-12-31T23:59:59.000Z");

function employee(overrides: Partial<ProvisionEmployeeRecord> = {}): ProvisionEmployeeRecord {
  return {
    id: "employee-a",
    companyId: "company-a",
    name: "Awa Koné",
    employeeId: "EMP-001",
    joiningDate: new Date("2020-01-01T00:00:00.000Z"),
    exitDate: null,
    salary: 300_000,
    sursalaire: 50_000,
    contracts: [{ probationPeriodMonths: 3 }],
    ...overrides,
  };
}

function payroll(
  sequence = 1,
  overrides: Partial<ProvisionPayrollRecord> = {}
): ProvisionPayrollRecord {
  const monthIndex = (sequence - 1) % 12;
  const yearOffset = Math.floor((sequence - 1) / 12);
  return {
    id: `payroll-${sequence}`,
    companyId: "company-a",
    userId: "employee-a",
    month: 12 - monthIndex,
    year: 2026 - yearOffset,
    basicSalary: 300_000,
    sursalaire: 50_000,
    transportAllowance: 30_000,
    housingAllowance: 25_000,
    presentDays: 22,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 0,
    unpaidLeaveDays: 0,
    overtimePay: 0,
    absentDeduction: 0,
    lateDeduction: 0,
    unpaidLeaveDeduction: 0,
    bonuses: 10_000,
    grossSalary: 415_000,
    itsTax: 0,
    igrTax: 0,
    cnpsEmployee: 0,
    cnpsEmployer: 0,
    fdfpTax: 0,
    totalDeductions: 0,
    netSalary: 415_000,
    status: PayrollStatus.finalized,
    generatedAt: new Date("2026-12-31T00:00:00.000Z"),
    finalizedAt: new Date("2026-12-31T12:00:00.000Z"),
    createdAt: new Date("2026-12-31T00:00:00.000Z"),
    updatedAt: new Date("2026-12-31T12:00:00.000Z"),
    configSnapshotId: null,
    earningLines: [
      {
        id: `line-${sequence}`,
        companyId: "company-a",
        payrollId: `payroll-${sequence}`,
        code: "BASE_SALARY",
        label: "Salaire de base",
        category: "BASE_SALARY",
        amount: new Prisma.Decimal("300000"),
        includedInLeaveBase: true,
        includedInTerminationBase: true,
        isExpenseReimbursement: false,
        classificationSource: "TEST",
        isEstimated: false,
        createdAt: new Date("2026-12-31T00:00:00.000Z"),
        updatedAt: new Date("2026-12-31T00:00:00.000Z"),
      },
    ],
    ...overrides,
  };
}

function ledger(overrides: Record<string, unknown> = {}) {
  return {
    id: "ledger-1",
    companyId: "company-a",
    userId: "employee-a",
    effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
    referencePeriod: "2026",
    entryType: LeaveLedgerEntryType.OPENING_BALANCE,
    days: new Prisma.Decimal("20.5000"),
    sourceType: LeaveLedgerSourceType.MIGRATION,
    sourceId: "employee-a",
    ruleVersion: "TEST-1",
    createdById: null,
    reason: null,
    isEstimated: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function gateway(data?: {
  employees?: readonly ProvisionEmployeeRecord[];
  payrolls?: readonly ProvisionPayrollRecord[];
  ledger?: readonly ReturnType<typeof ledger>[];
}): ProvisionDataGateway & {
  findEmployees: jest.Mock;
  findFinalizedPayrolls: jest.Mock;
  findLeaveLedger: jest.Mock;
} {
  return {
    findEmployees: jest.fn().mockResolvedValue(data?.employees ?? [employee()]),
    findFinalizedPayrolls: jest.fn().mockResolvedValue(data?.payrolls ?? [payroll()]),
    findLeaveLedger: jest.fn().mockResolvedValue(data?.ledger ?? [ledger()]),
  };
}

describe("PrismaProvisionRepository", () => {
  it("effectue exactement trois chargements groupés, quel que soit le nombre de salariés", async () => {
    const source = gateway({
      employees: [employee(), employee({ id: "employee-b", employeeId: "EMP-002" })],
      payrolls: [],
      ledger: [],
    });
    await new PrismaProvisionRepository(source).loadProvisionData({ companyId: "company-a", referenceDate });
    expect(source.findEmployees).toHaveBeenCalledTimes(1);
    expect(source.findFinalizedPayrolls).toHaveBeenCalledTimes(1);
    expect(source.findLeaveLedger).toHaveBeenCalledTimes(1);
  });

  it("transmet le tenant et la date de référence à chaque chargement", async () => {
    const source = gateway();
    await new PrismaProvisionRepository(source).loadProvisionData({ companyId: "company-a", referenceDate });
    expect(source.findEmployees).toHaveBeenCalledWith("company-a", referenceDate);
    expect(source.findFinalizedPayrolls).toHaveBeenCalledWith("company-a", referenceDate);
    expect(source.findLeaveLedger).toHaveBeenCalledWith("company-a", referenceDate);
  });

  it("ne conserve que les douze dernières paies par salarié", async () => {
    const source = gateway({ payrolls: Array.from({ length: 13 }, (_, index) => payroll(index + 1)) });
    const [result] = await new PrismaProvisionRepository(source).loadProvisionData({
      companyId: "company-a",
      referenceDate,
    });
    expect(result.payrolls).toHaveLength(12);
    expect(result.payrolls.map(({ payrollId }) => payrollId)).not.toContain("payroll-13");
  });

  it("rejette un salarié provenant d'un autre tenant", async () => {
    const source = gateway({ employees: [employee({ companyId: "company-b" })], payrolls: [], ledger: [] });
    await expect(
      new PrismaProvisionRepository(source).loadProvisionData({ companyId: "company-a", referenceDate })
    ).rejects.toBeInstanceOf(TenantDataMismatchError);
  });

  it("rejette une paie orpheline du périmètre salarié", async () => {
    const source = gateway({ payrolls: [payroll(1, { userId: "employee-b" })] });
    await expect(
      new PrismaProvisionRepository(source).loadProvisionData({ companyId: "company-a", referenceDate })
    ).rejects.toThrow("aucun salarié chargé");
  });

  it("rejette une écriture de congés orpheline", async () => {
    const source = gateway({ ledger: [ledger({ userId: "employee-b" })] });
    await expect(
      new PrismaProvisionRepository(source).loadProvisionData({ companyId: "company-a", referenceDate })
    ).rejects.toThrow("aucun salarié chargé");
  });
});

describe("Mappers de provisions", () => {
  it("rejette une paie d'un autre tenant", () => {
    expect(() => mapPayrollCompensation(payroll(1, { companyId: "company-b" }), "company-a")).toThrow(
      TenantDataMismatchError
    );
  });

  it("calcule l'assiette avec Money et exclut les remboursements", () => {
    const record = payroll();
    record.earningLines.push({
      ...record.earningLines[0],
      id: "expense-1",
      code: "TRANSPORT",
      category: "EXPENSE_REIMBURSEMENT",
      amount: new Prisma.Decimal("30000"),
      includedInLeaveBase: false,
      includedInTerminationBase: false,
      isExpenseReimbursement: true,
    });
    const mapped = mapPayrollCompensation(record, "company-a");
    expect(mapped.leaveEligibleGross.toNumber()).toBe(300_000);
    expect(mapped.terminationEligibleGross.toNumber()).toBe(300_000);
  });

  it("signale une ventilation absente", () => {
    const mapped = mapPayrollCompensation(payroll(1, { earningLines: [] }), "company-a");
    expect(mapped.warnings).toContainEqual(
      expect.objectContaining({ code: "COMPENSATION_BREAKDOWN_INCOMPLETE" })
    );
  });

  it("signale une classification estimée", () => {
    const record = payroll();
    record.earningLines[0].isEstimated = true;
    expect(mapPayrollCompensation(record, "company-a").warnings).toContainEqual(
      expect.objectContaining({ code: "EXPENSE_CLASSIFICATION_UNKNOWN" })
    );
  });

  it("rejette une ligne d'un autre tenant", () => {
    const record = payroll();
    record.earningLines[0].companyId = "company-b";
    expect(() => mapPayrollCompensation(record, "company-a")).toThrow(TenantDataMismatchError);
  });

  it("rejette un remboursement inclus dans une assiette", () => {
    const record = payroll();
    record.earningLines[0].isExpenseReimbursement = true;
    expect(() => mapPayrollCompensation(record, "company-a")).toThrow("ne peut entrer");
  });

  it("préserve les jours du ledger sous forme décimale exacte", () => {
    expect(mapLeaveLedgerEntry(ledger(), "company-a").days).toBe("20.5000");
  });

  it("rejette une écriture du ledger d'un autre tenant", () => {
    expect(() => mapLeaveLedgerEntry(ledger({ companyId: "company-b" }), "company-a")).toThrow(
      TenantDataMismatchError
    );
  });
});
