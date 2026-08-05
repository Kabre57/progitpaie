import { Money } from "@/lib/domain/payroll/money";
import { LoanType } from "../value-objects/LoanType";
import { LoanStatus } from "../value-objects/LoanStatus";

export interface EmployeeLoanProps {
  id?: string;
  companyId: string;
  userId: string;
  type: LoanType;
  amount: Money;
  monthlyDeduction: Money;
  totalRepaid?: Money;
  startDate: Date;
  status?: LoanStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EmployeeLoan {
  public readonly id?: string;
  public readonly companyId: string;
  public readonly userId: string;
  public readonly type: LoanType;
  public readonly amount: Money;
  public readonly monthlyDeduction: Money;
  private _totalRepaid: Money;
  public readonly startDate: Date;
  private _status: LoanStatus;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: EmployeeLoanProps) {
    if (!props.companyId) throw new Error("companyId est obligatoire");
    if (!props.userId) throw new Error("userId est obligatoire");
    if (props.amount.toNumber() <= 0) throw new Error("Le montant du prêt doit être supérieur à zéro");
    if (props.monthlyDeduction.toNumber() <= 0) throw new Error("La retenue mensuelle doit être supérieure à zéro");

    this.id = props.id;
    this.companyId = props.companyId;
    this.userId = props.userId;
    this.type = props.type;
    this.amount = props.amount;
    this.monthlyDeduction = props.monthlyDeduction;
    this._totalRepaid = props.totalRepaid || Money.zero();
    this.startDate = props.startDate;
    this._status = props.status || (this.remainingAmount.toNumber() <= 0 ? LoanStatus.completed() : LoanStatus.active());
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public get totalRepaid(): Money {
    return this._totalRepaid;
  }

  public get remainingAmount(): Money {
    const diff = this.amount.subtract(this._totalRepaid);
    return diff.toNumber() < 0 ? Money.zero() : diff;
  }

  public get status(): LoanStatus {
    return this._status;
  }

  public repayInstallment(repaymentAmount: Money): void {
    if (repaymentAmount.toNumber() <= 0) {
      throw new Error("Le montant du remboursement doit être positif");
    }
    this._totalRepaid = this._totalRepaid.add(repaymentAmount);

    if (this.remainingAmount.toNumber() <= 0) {
      this._status = LoanStatus.completed();
    }
  }
}
