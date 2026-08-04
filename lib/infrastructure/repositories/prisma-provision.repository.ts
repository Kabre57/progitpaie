import { prisma } from "@/lib/db";
import { Money } from "@/lib/domain/payroll/money";
import type {
  ProvisionEmployeeAggregate,
  ProvisionEmployeeProfile,
} from "@/lib/domain/payroll/provision/data";
import type {
  ProvisionDataQuery,
  ProvisionRepository,
} from "@/lib/application/payroll/provisions/ports";
import { PayrollStatus, Prisma, UserRole, type LeaveLedgerEntry } from "@prisma/client";
import {
  mapPayrollCompensation,
  TenantDataMismatchError,
} from "./mappers/payroll-compensation.mapper";
import { mapLeaveLedgerEntry } from "./mappers/leave-ledger.mapper";

const employeeArgs = Prisma.validator<Prisma.UserDefaultArgs>()({
  select: {
    id: true,
    companyId: true,
    name: true,
    employeeId: true,
    joiningDate: true,
    exitDate: true,
    salary: true,
    sursalaire: true,
    contracts: {
      where: { status: "active" },
      orderBy: { startDate: "desc" },
      take: 1,
      select: { probationPeriodMonths: true },
    },
  },
});

const payrollArgs = Prisma.validator<Prisma.PayrollDefaultArgs>()({
  include: { earningLines: true },
});

export type ProvisionEmployeeRecord = Prisma.UserGetPayload<typeof employeeArgs>;
export type ProvisionPayrollRecord = Prisma.PayrollGetPayload<typeof payrollArgs>;

export interface ProvisionDataGateway {
  findEmployees(companyId: string, referenceDate: Date): Promise<readonly ProvisionEmployeeRecord[]>;
  findFinalizedPayrolls(
    companyId: string,
    referenceDate: Date
  ): Promise<readonly ProvisionPayrollRecord[]>;
  findLeaveLedger(companyId: string, referenceDate: Date): Promise<readonly LeaveLedgerEntry[]>;
}

export class PrismaProvisionDataGateway implements ProvisionDataGateway {
  public findEmployees(companyId: string, referenceDate: Date) {
    const periodStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), 0, 1));
    return prisma.user.findMany({
      where: {
        companyId,
        role: UserRole.employee,
        joiningDate: { lte: referenceDate },
        OR: [{ isActive: true }, { exitDate: { gte: periodStart, lte: referenceDate } }],
      },
      ...employeeArgs,
      orderBy: { id: "asc" },
    });
  }

  public findFinalizedPayrolls(companyId: string, referenceDate: Date) {
    const year = referenceDate.getUTCFullYear();
    const month = referenceDate.getUTCMonth() + 1;
    return prisma.payroll.findMany({
      where: {
        companyId,
        status: PayrollStatus.finalized,
        user: { role: UserRole.employee },
        OR: [{ year: { lt: year } }, { year, month: { lte: month } }],
      },
      ...payrollArgs,
      orderBy: [{ userId: "asc" }, { year: "desc" }, { month: "desc" }],
    });
  }

  public findLeaveLedger(companyId: string, referenceDate: Date) {
    return prisma.leaveLedgerEntry.findMany({
      where: {
        companyId,
        effectiveDate: { lte: referenceDate },
        user: { role: UserRole.employee },
      },
      orderBy: [{ userId: "asc" }, { effectiveDate: "asc" }, { createdAt: "asc" }],
    });
  }
}

export class PrismaProvisionRepository implements ProvisionRepository {
  public constructor(private readonly gateway: ProvisionDataGateway = new PrismaProvisionDataGateway()) {}

  public async loadProvisionData(
    query: ProvisionDataQuery
  ): Promise<readonly ProvisionEmployeeAggregate[]> {
    const [employeeRecords, payrollRecords, ledgerRecords] = await Promise.all([
      this.gateway.findEmployees(query.companyId, query.referenceDate),
      this.gateway.findFinalizedPayrolls(query.companyId, query.referenceDate),
      this.gateway.findLeaveLedger(query.companyId, query.referenceDate),
    ]);

    const employees = employeeRecords.map((record) => this.mapEmployee(record, query.companyId));
    const employeeIds = new Set(employees.map(({ id }) => id));
    const payrollsByUser = new Map<string, ReturnType<typeof mapPayrollCompensation>[]>();
    const ledgerByUser = new Map<string, ReturnType<typeof mapLeaveLedgerEntry>[]>();

    for (const record of payrollRecords) {
      if (!employeeIds.has(record.userId)) {
        throw new TenantDataMismatchError(`La paie ${record.id} ne correspond à aucun salarié chargé`);
      }
      const mapped = mapPayrollCompensation(record, query.companyId);
      const current = payrollsByUser.get(record.userId) ?? [];
      if (current.length < 12) current.push(mapped);
      payrollsByUser.set(record.userId, current);
    }

    for (const record of ledgerRecords) {
      if (!employeeIds.has(record.userId)) {
        throw new TenantDataMismatchError(`L'écriture ${record.id} ne correspond à aucun salarié chargé`);
      }
      const current = ledgerByUser.get(record.userId) ?? [];
      current.push(mapLeaveLedgerEntry(record, query.companyId));
      ledgerByUser.set(record.userId, current);
    }

    return employees.map((employee) => ({
      employee,
      payrolls: payrollsByUser.get(employee.id) ?? [],
      leaveLedger: ledgerByUser.get(employee.id) ?? [],
    }));
  }

  private mapEmployee(
    record: ProvisionEmployeeRecord,
    companyId: string
  ): ProvisionEmployeeProfile {
    if (record.companyId !== companyId) {
      throw new TenantDataMismatchError(`Le salarié ${record.id} n'appartient pas au tenant demandé`);
    }
    return {
      id: record.id,
      companyId: record.companyId,
      name: record.name,
      employeeId: record.employeeId,
      joiningDate: record.joiningDate,
      exitDate: record.exitDate,
      currentBaseSalary: Money.of(record.salary.toString()),
      currentSursalaire: Money.of(record.sursalaire.toString()),
      probationMonths: record.contracts[0]?.probationPeriodMonths ?? 0,
    };
  }
}
