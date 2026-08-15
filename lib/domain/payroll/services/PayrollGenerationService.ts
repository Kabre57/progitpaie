import { Money } from "../money";
import { Payroll } from "../entities/Payroll";
import { PayrollEarning } from "../entities/PayrollEarning";
import { PayrollPeriod } from "../value-objects/PayrollPeriod";
import { PayrollStatus } from "../value-objects/PayrollStatus";
import { calculatePayslip } from "../calculator/payslip-calculator";
import { CI_ITS_2024_DEFAULT_RATES, CI_ITS_2024_RULE, CI_ITS_2024_SCHEDULE } from "../rules/ci-its-2024-rule";
import type { IGRSchedule, TaxRatesConfig } from "../types/payroll-types";

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
  name?: string;
  employeeId?: string;
}

/**
 * Génère les brouillons de bulletins selon la règle CI-ITS-2024-v1.
 *
 * Les bulletins finalisés existants restent immuables : ce service ne crée que de
 * nouveaux brouillons. Aucun calcul post-2024 ne doit repasser par l’ancien moteur
 * IS + CN + IGR de `lib/payroll-tax.ts`.
 */
export class PayrollGenerationService {
  public constructor(
    private readonly rates: TaxRatesConfig = CI_ITS_2024_DEFAULT_RATES,
    private readonly itsSchedule: IGRSchedule = CI_ITS_2024_SCHEDULE
  ) {}

  public generateForEmployee(
    employee: EmployeeGenerationInput,
    period: PayrollPeriod,
    attendanceRecords: readonly AttendanceRecordInput[],
    unpaidLeaveDays: number,
    configSnapshotId?: string
  ): Payroll {
    const presentCount = attendanceRecords.filter((record) => record.status === "present").length;
    const lateCount = attendanceRecords.filter((record) => record.status === "late").length;
    const absentCount = attendanceRecords.filter((record) => record.status === "absent").length;
    const halfDayCount = attendanceRecords.filter((record) => record.status === "half_day").length;
    const leaveCount = attendanceRecords.filter((record) => record.status === "on_leave").length;

    const basicSalary = employee.salary || 0;
    const hourlyRate = basicSalary / (26 * 8);
    const overtimePay = Math.round(attendanceRecords.reduce((sum, record) => {
      if (!record.overtimeMinutes || record.overtimeMinutes <= 0) return sum;
      const hours = record.overtimeMinutes / 60;
      return sum + hours * hourlyRate * (record.overtimeRate || 1.15);
    }, 0));

    const perDaySalary = basicSalary / 26;
    const absentDeduction = Math.round(absentCount * perDaySalary);
    const lateDeduction = Math.round(Math.floor(lateCount / 3) * perDaySalary);
    const unpaidLeaveDeduction = Math.round(unpaidLeaveDays * perDaySalary);

    const payslip = calculatePayslip(
      {
        employee: {
          id: employee.id,
          name: employee.name ?? employee.id,
          employeeId: employee.employeeId ?? employee.id,
          baseSalary: basicSalary,
          sursalaire: employee.sursalaire ?? 0,
          transportAllowance: employee.transportAllowance ?? 0,
          housingAllowance: employee.housingAllowance ?? 0,
          category: "",
          partsIGR: employee.partsIGR ?? 1,
          cnpsNumber: "",
          joiningDate: period.startDate().toISOString(),
          contractType: "CDI",
          isExpatriate: false,
          departmentName: "",
          jobTitle: "",
        },
        month: period.month,
        year: period.year,
        variables: {
          overtimeHours: 0,
          overtimeRate: 0,
          overtimeAmount: overtimePay,
          bonuses: [],
          absenceDays: absentCount,
          absenceDeduction: absentDeduction,
          lateDeduction,
          unpaidLeaveDeduction,
          loanDeduction: 0,
        },
      },
      this.rates,
      this.itsSchedule,
      true
    );

    // L’agrégat historique stocke le brut déjà diminué des retenues de présence.
    // Les cotisations/ITS restent des retenues distinctes, évitant tout double compte.
    const grossAfterAttendance = Math.max(
      0,
      payslip.grossSalary + payslip.transportAllowance - payslip.attendanceDeductions
    );
    const statutoryDeductions = Math.max(0, payslip.totalDeductions - payslip.attendanceDeductions);
    const cnpsEmployer =
      payslip.employerContributions.cnpsRetirement +
      payslip.employerContributions.cnpsFamily +
      payslip.employerContributions.cnpsAccident;
    const fdfpTax = payslip.employerContributions.fdfpTA + payslip.employerContributions.fdfpTFC;

    const earnings = new PayrollEarning({
      basicSalary: Money.of(basicSalary),
      sursalaire: Money.of(employee.sursalaire ?? 0),
      transportAllowance: Money.of(employee.transportAllowance ?? 0),
      housingAllowance: Money.of(employee.housingAllowance ?? 0),
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
      grossSalary: Money.of(grossAfterAttendance),
      itsTax: Money.of(payslip.taxDeductions.its),
      // Compatibilité de stockage : IGR autonome nul sous la règle ITS 2024.
      igrTax: Money.zero(),
      cnpsEmployee: Money.of(payslip.employeeContributions.cnpsRetirement),
      cnpsEmployer: Money.of(cnpsEmployer),
      fdfpTax: Money.of(fdfpTax),
      totalDeductions: Money.of(statutoryDeductions),
      netSalary: Money.of(payslip.netSalary),
      configSnapshotId,
    });
  }

  public getRuleVersion(): string {
    return this.rates.ruleVersion ?? CI_ITS_2024_RULE.id;
  }
}
