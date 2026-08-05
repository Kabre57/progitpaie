import { Payroll } from "@/lib/domain/payroll/entities/Payroll";
import { PayrollDTO, LegacyPayrollDTO } from "../dto/PayrollDTO";

export function toPayrollDTO(payroll: Payroll, userObj?: { id: string; name: string; email: string; employeeId?: string | null }): PayrollDTO {
  return {
    id: payroll.id || "",
    companyId: payroll.companyId,
    userId: payroll.userId,
    user: userObj ? {
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      employeeId: userObj.employeeId,
    } : undefined,
    month: payroll.period.month,
    year: payroll.period.year,
    status: payroll.status.value,
    basicSalary: payroll.earnings.basicSalary.toNumber(),
    sursalaire: payroll.earnings.sursalaire.toNumber(),
    transportAllowance: payroll.earnings.transportAllowance.toNumber(),
    housingAllowance: payroll.earnings.housingAllowance.toNumber(),
    overtimePay: payroll.earnings.overtimePay.toNumber(),
    bonuses: payroll.earnings.bonuses.toNumber(),
    presentDays: payroll.presentDays,
    absentDays: payroll.absentDays,
    lateDays: payroll.lateDays,
    leaveDays: payroll.leaveDays,
    unpaidLeaveDays: payroll.unpaidLeaveDays,
    absentDeduction: payroll.absentDeduction.toNumber(),
    lateDeduction: payroll.lateDeduction.toNumber(),
    unpaidLeaveDeduction: payroll.unpaidLeaveDeduction.toNumber(),
    grossSalary: payroll.grossSalary.toNumber(),
    itsTax: payroll.itsTax.toNumber(),
    igrTax: payroll.igrTax.toNumber(),
    cnpsEmployee: payroll.cnpsEmployee.toNumber(),
    cnpsEmployer: payroll.cnpsEmployer.toNumber(),
    fdfpTax: payroll.fdfpTax.toNumber(),
    totalDeductions: payroll.totalDeductions.toNumber(),
    netSalary: payroll.netSalary.toNumber(),
    configSnapshotId: payroll.configSnapshotId,
    finalizedAt: payroll.finalizedAt ? payroll.finalizedAt.toISOString() : null,
    createdAt: payroll.createdAt ? payroll.createdAt.toISOString() : undefined,
    updatedAt: payroll.updatedAt ? payroll.updatedAt.toISOString() : undefined,
  };
}

export function toLegacyPayrollDTO(dto: PayrollDTO): LegacyPayrollDTO {
  const user = dto.user || { id: dto.userId, name: "", email: "" };
  return {
    ...dto,
    _id: dto.id,
    userId: {
      ...user,
      _id: user.id,
    } as any,
  };
}
