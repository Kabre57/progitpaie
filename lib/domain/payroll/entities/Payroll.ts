import { Money } from "../money";
import { PayrollPeriod } from "../value-objects/PayrollPeriod";
import { PayrollStatus } from "../value-objects/PayrollStatus";
import { PayrollEarning } from "./PayrollEarning";

export interface PayrollProps {
  id?: string;
  companyId: string;
  userId: string;
  period: PayrollPeriod;
  status: PayrollStatus;
  earnings: PayrollEarning;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  unpaidLeaveDays: number;
  absentDeduction: Money;
  lateDeduction: Money;
  unpaidLeaveDeduction: Money;
  grossSalary: Money;
  itsTax: Money;
  igrTax: Money;
  cnpsEmployee: Money;
  cnpsEmployer: Money;
  fdfpTax: Money;
  totalDeductions: Money;
  netSalary: Money;
  configSnapshotId?: string | null;
  finalizedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Agrégat Racine Domaine représentant un bulletin de paie.
 */
export class Payroll {
  public readonly id?: string;
  public readonly companyId: string;
  public readonly userId: string;
  public readonly period: PayrollPeriod;
  private _status: PayrollStatus;
  private _earnings: PayrollEarning;
  public readonly presentDays: number;
  public readonly absentDays: number;
  public readonly lateDays: number;
  public readonly leaveDays: number;
  public readonly unpaidLeaveDays: number;
  public readonly absentDeduction: Money;
  public readonly lateDeduction: Money;
  public readonly unpaidLeaveDeduction: Money;
  public readonly grossSalary: Money;
  public readonly itsTax: Money;
  public readonly igrTax: Money;
  public readonly cnpsEmployee: Money;
  public readonly cnpsEmployer: Money;
  public readonly fdfpTax: Money;
  public readonly totalDeductions: Money;
  private _netSalary: Money;
  public readonly configSnapshotId?: string | null;
  private _finalizedAt?: Date | null;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: PayrollProps) {
    if (!props.companyId) throw new Error("companyId est obligatoire");
    if (!props.userId) throw new Error("userId est obligatoire");

    this.id = props.id;
    this.companyId = props.companyId;
    this.userId = props.userId;
    this.period = props.period;
    this._status = props.status;
    this._earnings = props.earnings;
    this.presentDays = props.presentDays;
    this.absentDays = props.absentDays;
    this.lateDays = props.lateDays;
    this.leaveDays = props.leaveDays;
    this.unpaidLeaveDays = props.unpaidLeaveDays;
    this.absentDeduction = props.absentDeduction;
    this.lateDeduction = props.lateDeduction;
    this.unpaidLeaveDeduction = props.unpaidLeaveDeduction;
    this.grossSalary = props.grossSalary;
    this.itsTax = props.itsTax;
    this.igrTax = props.igrTax;
    this.cnpsEmployee = props.cnpsEmployee;
    this.cnpsEmployer = props.cnpsEmployer;
    this.fdfpTax = props.fdfpTax;
    this.totalDeductions = props.totalDeductions;
    this._netSalary = props.netSalary;
    this.configSnapshotId = props.configSnapshotId;
    this._finalizedAt = props.finalizedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public get status(): PayrollStatus {
    return this._status;
  }

  public get earnings(): PayrollEarning {
    return this._earnings;
  }

  public get netSalary(): Money {
    return this._netSalary;
  }

  public get finalizedAt(): Date | null | undefined {
    return this._finalizedAt;
  }

  public updateBonuses(newBonuses: Money): void {
    if (!this._status.canEdit()) {
      throw new Error("Impossible de modifier un bulletin de paie déjà finalisé");
    }
    const diff = newBonuses.subtract(this._earnings.bonuses);
    this._earnings = this._earnings.withBonuses(newBonuses);
    this._netSalary = this._netSalary.add(diff);
  }

  public finalize(now: Date = new Date()): void {
    if (!this._status.canFinalize()) {
      throw new Error("Le bulletin de paie est déjà finalisé");
    }
    this._status = PayrollStatus.finalized();
    this._finalizedAt = now;
  }

  public belongsToCompany(companyId: string): boolean {
    return this.companyId === companyId;
  }
}
