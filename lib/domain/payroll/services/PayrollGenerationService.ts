import { calculatePayrollTaxes } from "@/lib/payroll-tax";
import { Money } from "../money";
import { Payroll } from "../entities/Payroll";
import { PayrollEarning } from "../entities/PayrollEarning";
import { PayrollPeriod } from "../value-objects/PayrollPeriod";
import { PayrollStatus } from "../value-objects/PayrollStatus";

export interface AttendanceRecordInput {
  date: string;
  status: string;
  overtimeMinutes?: number;
  overtimeRate?: number;
}

export interface EmployeeGenerationInput {
  id: string;
  companyId: string;
  salary: number;
  sursalaire?: number;
  transportAllowance?: number;
  housingAllowance?: number;
  partsIGR?: number;
}

export class PayrollGenerationService {
  /**
   * Génère un bulletin de paie brouillon pour un salarié donné sur une période donnée.
   * Utilise le moteur fiscal paritaire V1 `calculatePayrollTaxes`.
   */
  public generateForEmployee(
    employee: EmployeeGenerationInput,
    period: PayrollPeriod,
    attendanceRecords: readonly AttendanceRecordInput[],
    unpaidLeaveDays: number,
    configSnapshotId?: string
  ): Payroll {
    const presentCount = attendanceRecords.filter((r) => r.status === "present").length;
    const lateCount = attendanceRecords.filter((r) => r.status === "late").length;
    const absentCount = attendanceRecords.filter((r) => r.status === "absent").length;
    const halfDayCount = attendanceRecords.filter((r) => r.status === "half_day").length;
    const leaveCount = attendanceRecords.filter((r) => r.status === "on_leave").length;

    // Calcul Heures Supp
    const hourlyRate = (employee.salary || 0) / (26 * 8);
    let overtimePay = 0;
    attendanceRecords.forEach((r) => {
      if (r.overtimeMinutes && r.overtimeMinutes > 0) {
        const hours = r.overtimeMinutes / 60;
        const rateMultiplier = r.overtimeRate || 1.15;
        overtimePay += hours * hourlyRate * rateMultiplier;
      }
    });
    overtimePay = Math.round(overtimePay);

    const basicSalary = employee.salary || 0;
    const perDaySalary = basicSalary / 26;

    const absentDeduction = Math.round(absentCount * perDaySalary);
    const lateDeduction = Math.round(Math.floor(lateCount / 3) * perDaySalary);
    const unpaidLeaveDeduction = Math.round(unpaidLeaveDays * perDaySalary);

    // Moteur fiscal paritaire V1
    const taxResult = calculatePayrollTaxes({
      basicSalary,
      sursalaire: employee.sursalaire || 0,
      transportAllowance: employee.transportAllowance || 0,
      housingAllowance: employee.housingAllowance || 0,
      overtimePay,
      bonuses: 0,
      partsIGR: employee.partsIGR || 1.0,
      absentDeduction,
      lateDeduction,
      unpaidLeaveDeduction,
    });

    const earnings = new PayrollEarning({
      basicSalary: Money.of(basicSalary),
      sursalaire: Money.of(employee.sursalaire || 0),
      transportAllowance: Money.of(employee.transportAllowance || 0),
      housingAllowance: Money.of(employee.housingAllowance || 0),
      overtimePay: Money.of(overtimePay),
      bonuses: Money.zero(),
    });

    return new Payroll({
      companyId: employee.companyId,
      userId: employee.id,
      period,
      status: PayrollStatus.draft(),
      earnings,
      presentDays: presentCount + lateCount + halfDayCount * 0.5,
      absentDays: absentCount,
      lateDays: lateCount,
      leaveDays: leaveCount,
      unpaidLeaveDays,
      absentDeduction: Money.of(absentDeduction),
      lateDeduction: Money.of(lateDeduction),
      unpaidLeaveDeduction: Money.of(unpaidLeaveDeduction),
      grossSalary: Money.of(taxResult.grossSalary),
      itsTax: Money.of(taxResult.itsTax),
      igrTax: Money.of(taxResult.igrTax),
      cnpsEmployee: Money.of(taxResult.cnpsEmployee),
      cnpsEmployer: Money.of(taxResult.cnpsEmployer),
      fdfpTax: Money.of(taxResult.fdfpTax),
      totalDeductions: Money.of(taxResult.totalDeductions),
      netSalary: Money.of(taxResult.netSalary),
      configSnapshotId,
    });
  }
}
