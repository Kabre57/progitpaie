import { prisma } from "@/lib/db";
import { Payroll } from "@/lib/domain/payroll/entities/Payroll";
import { PayrollPeriod } from "@/lib/domain/payroll/value-objects/PayrollPeriod";
import { PayrollRepository, ListPayrollsQuery, ListMyPayrollsQuery } from "@/lib/application/payroll/ports/PayrollRepository";
import { EmployeeGenerationInput, AttendanceRecordInput } from "@/lib/domain/payroll/services/PayrollGenerationService";
import { mapPrismaToDomainPayroll } from "./mappers/prisma-payroll-entity.mapper";
import { PayrollStatus, LeaveType, LeaveStatus, AttendanceStatus, Prisma } from "@prisma/client";
import { PayslipConfigService } from "@/lib/payslip-config-service";

export class PrismaPayrollRepository implements PayrollRepository {
  public async list(query: ListPayrollsQuery): Promise<readonly Payroll[]> {
    const where: Prisma.PayrollWhereInput = {
      companyId: query.companyId,
    };
    if (query.month) where.month = query.month;
    if (query.year) where.year = query.year;
    if (query.status) where.status = query.status as PayrollStatus;

    const records = await prisma.payroll.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return records.map(mapPrismaToDomainPayroll);
  }

  public async listMy(query: ListMyPayrollsQuery): Promise<readonly Payroll[]> {
    const where: Prisma.PayrollWhereInput = {
      companyId: query.companyId,
      userId: query.userId,
    };
    if (query.month) where.month = query.month;
    if (query.year) where.year = query.year;

    const records = await prisma.payroll.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return records.map(mapPrismaToDomainPayroll);
  }

  public async findByIdForTenant(companyId: string, id: string): Promise<Payroll | null> {
    const record = await prisma.payroll.findFirst({
      where: { id, companyId },
    });
    if (!record) return null;
    return mapPrismaToDomainPayroll(record);
  }

  public async findActiveEmployees(companyId: string): Promise<readonly EmployeeGenerationInput[]> {
    const users = await prisma.user.findMany({
      where: { companyId, isActive: true, role: "employee" },
      select: {
        id: true,
        companyId: true,
        salary: true,
        sursalaire: true,
        transportAllowance: true,
        housingAllowance: true,
        partsIGR: true,
      },
    });

    return users.map((u) => ({
      id: u.id,
      companyId: u.companyId,
      salary: u.salary || 0,
      sursalaire: u.sursalaire || 0,
      transportAllowance: u.transportAllowance || 0,
      housingAllowance: u.housingAllowance || 0,
      partsIGR: u.partsIGR || 1.0,
    }));
  }

  public async findAttendanceRecords(companyId: string, userId: string, period: PayrollPeriod): Promise<readonly AttendanceRecordInput[]> {
    const startStr = period.startDate().toISOString().split("T")[0];
    const endStr = period.endDate().toISOString().split("T")[0];

    const records = await prisma.attendance.findMany({
      where: {
        companyId,
        userId,
        date: { gte: startStr, lte: endStr },
      },
    });

    return records.map((r) => ({
      date: r.date,
      status: r.status,
      overtimeMinutes: r.overtimeMinutes,
      overtimeRate: r.overtimeRate,
    }));
  }

  public async findUnpaidLeaveDays(companyId: string, userId: string, period: PayrollPeriod): Promise<number> {
    const start = period.startDate();
    const end = period.endDate();

    const leaves = await prisma.leave.findMany({
      where: {
        companyId,
        userId,
        leaveType: LeaveType.unpaid,
        status: LeaveStatus.approved,
        startDate: { gte: start, lte: end },
      },
    });

    return leaves.reduce((sum, l) => sum + l.totalDays, 0);
  }

  public async existsForPeriod(companyId: string, userId: string, period: PayrollPeriod): Promise<boolean> {
    const existing = await prisma.payroll.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: period.month,
          year: period.year,
        },
      },
    });
    return !!existing && existing.companyId === companyId;
  }

  public async createConfigSnapshot(adminId: string): Promise<string> {
    const service = PayslipConfigService.getInstance();
    return service.createSnapshot(adminId);
  }

  public async save(payroll: Payroll): Promise<Payroll> {
    const data = {
      companyId: payroll.companyId,
      userId: payroll.userId,
      month: payroll.period.month,
      year: payroll.period.year,
      basicSalary: payroll.earnings.basicSalary.toNumber(),
      sursalaire: payroll.earnings.sursalaire.toNumber(),
      transportAllowance: payroll.earnings.transportAllowance.toNumber(),
      housingAllowance: payroll.earnings.housingAllowance.toNumber(),
      presentDays: payroll.presentDays,
      absentDays: payroll.absentDays,
      lateDays: payroll.lateDays,
      leaveDays: payroll.leaveDays,
      unpaidLeaveDays: payroll.unpaidLeaveDays,
      overtimePay: payroll.earnings.overtimePay.toNumber(),
      absentDeduction: payroll.absentDeduction.toNumber(),
      lateDeduction: payroll.lateDeduction.toNumber(),
      unpaidLeaveDeduction: payroll.unpaidLeaveDeduction.toNumber(),
      bonuses: payroll.earnings.bonuses.toNumber(),
      grossSalary: payroll.grossSalary.toNumber(),
      itsTax: payroll.itsTax.toNumber(),
      igrTax: payroll.igrTax.toNumber(),
      cnpsEmployee: payroll.cnpsEmployee.toNumber(),
      cnpsEmployer: payroll.cnpsEmployer.toNumber(),
      fdfpTax: payroll.fdfpTax.toNumber(),
      totalDeductions: payroll.totalDeductions.toNumber(),
      netSalary: payroll.netSalary.toNumber(),
      status: payroll.status.value as PayrollStatus,
      configSnapshotId: payroll.configSnapshotId || null,
      finalizedAt: payroll.finalizedAt || null,
    };

    if (payroll.id) {
      const updated = await prisma.payroll.update({
        where: { id: payroll.id, companyId: payroll.companyId },
        data,
      });
      return mapPrismaToDomainPayroll(updated);
    } else {
      const created = await prisma.payroll.create({
        data,
      });
      return mapPrismaToDomainPayroll(created);
    }
  }

  public async saveMany(payrolls: readonly Payroll[]): Promise<readonly Payroll[]> {
    const results: Payroll[] = [];
    for (const p of payrolls) {
      const saved = await this.save(p);
      results.push(saved);
    }
    return results;
  }
}
