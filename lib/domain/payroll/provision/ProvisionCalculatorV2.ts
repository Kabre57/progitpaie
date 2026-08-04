import Decimal from "decimal.js";
import { Money } from "../money";
import type { ProvisionEmployeeAggregate } from "./data";
import { LeaveEntitlement } from "./LeaveEntitlement";
import { PROVISION_V2_RULE_SET, type ProvisionRuleSet } from "./ProvisionRuleSet";
import { SalaryReference } from "./SalaryReference";
import { TerminationBenefit } from "./TerminationBenefit";
import type { ProvisionWarning } from "./types";

const ProvisionDecimal = Decimal.clone({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface EmployeeProvisionV2Result {
  readonly userId: string;
  readonly employeeId: string | null;
  readonly employeeName: string;
  readonly joiningDate: Date;
  readonly leaveEntitlement: LeaveEntitlement;
  readonly leaveSalaryReference: SalaryReference;
  readonly leaveProvision: ReturnType<LeaveEntitlement["getProvisionDetails"]>;
  readonly terminationBenefit: TerminationBenefit;
  readonly terminationSalaryReference: SalaryReference;
  readonly warnings: readonly ProvisionWarning[];
}

export interface CompanyProvisionV2Result {
  readonly companyId: string;
  readonly referenceDate: Date;
  readonly ruleVersion: string;
  readonly employees: readonly EmployeeProvisionV2Result[];
  readonly totalLeaveProvision: Money;
  readonly totalTerminationExposure: Money;
  readonly totalExposure: Money;
  readonly warnings: readonly ProvisionWarning[];
}

export class ProvisionCalculatorV2 {
  public constructor(private readonly ruleSet: ProvisionRuleSet = PROVISION_V2_RULE_SET) {}

  public calculate(
    companyId: string,
    referenceDate: Date,
    aggregates: readonly ProvisionEmployeeAggregate[]
  ): CompanyProvisionV2Result {
    const employees = aggregates.map((aggregate) =>
      this.calculateEmployee(companyId, referenceDate, aggregate)
    );
    const totalLeaveProvision = employees.reduce(
      (total, result) => total.add(result.leaveProvision.amount),
      Money.zero()
    );
    const totalTerminationExposure = employees.reduce(
      (total, result) => total.add(result.terminationBenefit.theoreticalExposure),
      Money.zero()
    );
    const warnings = employees.flatMap((result) => result.warnings);

    return {
      companyId,
      referenceDate: new Date(referenceDate),
      ruleVersion: this.ruleSet.version,
      employees,
      totalLeaveProvision,
      totalTerminationExposure,
      totalExposure: totalLeaveProvision.add(totalTerminationExposure),
      warnings,
    };
  }

  private calculateEmployee(
    companyId: string,
    referenceDate: Date,
    aggregate: ProvisionEmployeeAggregate
  ): EmployeeProvisionV2Result {
    if (aggregate.employee.companyId !== companyId) {
      throw new Error(`Le salarié ${aggregate.employee.id} n'appartient pas au tenant demandé`);
    }

    const fallbackSalary = aggregate.employee.currentBaseSalary.add(
      aggregate.employee.currentSursalaire
    );
    const leaveSalaryReference = SalaryReference.create({
      basis: "LEAVE",
      payrolls: aggregate.payrolls,
      fallbackMonthlySalary: fallbackSalary,
      expectedMonths: this.ruleSet.salaryLookbackMonths,
    });
    const terminationSalaryReference = SalaryReference.create({
      basis: "TERMINATION",
      payrolls: aggregate.payrolls,
      fallbackMonthlySalary: fallbackSalary,
      expectedMonths: this.ruleSet.salaryLookbackMonths,
    });

    const ledgerDays = (entryType: string) =>
      aggregate.leaveLedger
        .filter((entry) => entry.entryType === entryType)
        .reduce((total, entry) => total.plus(entry.days), new ProvisionDecimal(0));
    const seniorityMonths = this.monthsBetween(
      aggregate.employee.joiningDate,
      aggregate.employee.exitDate && aggregate.employee.exitDate < referenceDate
        ? aggregate.employee.exitDate
        : referenceDate
    );
    const serviceMonths = this.serviceMonthsInReferenceYear(
      aggregate.employee.joiningDate,
      aggregate.employee.exitDate,
      referenceDate
    );
    const leaveEntitlement = LeaveEntitlement.createFrom({
      userId: aggregate.employee.id,
      employeeName: aggregate.employee.name,
      companyId,
      referenceDate,
      serviceMonths,
      seniorityMonths,
      openingBalance: ledgerDays("OPENING_BALANCE"),
      carriedDays: ledgerDays("CARRY_FORWARD"),
      consumedDays: ledgerDays("LEAVE_CONSUMED"),
      paidDays: ledgerDays("LEAVE_COMPENSATED"),
      probationMonths: this.probationMonthsInReferenceYear(
        aggregate.employee.joiningDate,
        aggregate.employee.probationMonths,
        referenceDate
      ),
      ruleSet: this.ruleSet,
    });
    const leaveProvision = leaveEntitlement.getProvisionDetails(
      leaveSalaryReference.averageMonthlySalary,
      leaveSalaryReference.totalEligibleCompensation
    );
    const terminationSalaries = terminationSalaryReference.periods.length > 0
      ? terminationSalaryReference.periods.map((period) => period.eligibleGross)
      : Array.from(
          { length: this.ruleSet.salaryLookbackMonths },
          () => terminationSalaryReference.averageMonthlySalary
        );
    const terminationBenefit = TerminationBenefit.calculate({
      userId: aggregate.employee.id,
      employeeName: aggregate.employee.name,
      companyId,
      referenceDate,
      seniorityMonths,
      lastTwelveMonthlySalaries: terminationSalaries,
      ruleSet: this.ruleSet,
    });
    const warnings = [
      ...leaveEntitlement.warnings,
      ...leaveSalaryReference.warnings,
      ...terminationSalaryReference.warnings,
      ...terminationBenefit.warnings,
    ];
    if (aggregate.leaveLedger.some((entry) => entry.entryType === "CARRY_FORWARD")) {
      warnings.push({
        code: "CARRIED_DAYS_VALUED_AT_CURRENT_RATE",
        message: "Les jours reportés sont valorisés avec le salaire de référence courant.",
        severity: "info",
      });
    }
    if (aggregate.leaveLedger.some((entry) => entry.ruleVersion.startsWith("LEGACY"))) {
      warnings.push({
        code: "LEGACY_LEAVE_BALANCE_USED",
        message: "Le calcul utilise un solde de congés migré depuis le système historique.",
        severity: "warning",
      });
    }

    return {
      userId: aggregate.employee.id,
      employeeId: aggregate.employee.employeeId,
      employeeName: aggregate.employee.name,
      joiningDate: new Date(aggregate.employee.joiningDate),
      leaveEntitlement,
      leaveSalaryReference,
      leaveProvision,
      terminationBenefit,
      terminationSalaryReference,
      warnings,
    };
  }

  private monthsBetween(start: Date, end: Date): number {
    if (end <= start) return 0;
    let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
    months += end.getUTCMonth() - start.getUTCMonth();
    if (end.getUTCDate() < start.getUTCDate()) months -= 1;
    return Math.max(0, months);
  }

  private serviceMonthsInReferenceYear(
    joiningDate: Date,
    exitDate: Date | null,
    referenceDate: Date
  ): number {
    const periodStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), 0, 1));
    const start = joiningDate > periodStart ? joiningDate : periodStart;
    const end = exitDate && exitDate < referenceDate ? exitDate : referenceDate;
    if (end < start) return 0;
    const millisecondsPerDay = 86_400_000;
    const inclusiveDays = Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
    return ProvisionDecimal.min(12, new ProvisionDecimal(inclusiveDays).dividedBy(30))
      .toDecimalPlaces(4)
      .toNumber();
  }

  private probationMonthsInReferenceYear(
    joiningDate: Date,
    probationMonths: number,
    referenceDate: Date
  ): number {
    if (probationMonths <= 0) return 0;
    const probationEnd = new Date(joiningDate);
    probationEnd.setUTCMonth(probationEnd.getUTCMonth() + probationMonths);
    const periodStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), 0, 1));
    const overlapStart = joiningDate > periodStart ? joiningDate : periodStart;
    const overlapEnd = probationEnd < referenceDate ? probationEnd : referenceDate;
    if (overlapEnd <= overlapStart) return 0;
    return ProvisionDecimal.min(
      probationMonths,
      new ProvisionDecimal(overlapEnd.getTime() - overlapStart.getTime()).dividedBy(86_400_000 * 30)
    )
      .toDecimalPlaces(4)
      .toNumber();
  }
}
