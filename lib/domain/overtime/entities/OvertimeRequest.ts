import { Money } from "@/lib/domain/payroll/money";
import { OvertimeRate } from "../value-objects/OvertimeRate";
import { OvertimeStatus } from "../value-objects/OvertimeStatus";

export interface OvertimeRequestProps {
  id?: string;
  companyId: string;
  userId: string;
  attendanceId?: string | null;
  date: Date;
  minutes: number;
  rate: OvertimeRate;
  reason: string;
  status: OvertimeStatus;
  approvedById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OvertimeRequest {
  public readonly id?: string;
  public readonly companyId: string;
  public readonly userId: string;
  public readonly attendanceId?: string | null;
  public readonly date: Date;
  public readonly minutes: number;
  public readonly rate: OvertimeRate;
  public readonly reason: string;
  private _status: OvertimeStatus;
  private _approvedById?: string | null;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: OvertimeRequestProps) {
    if (!props.companyId) throw new Error("companyId est obligatoire");
    if (!props.userId) throw new Error("userId est obligatoire");
    if (props.minutes <= 0) throw new Error("Le nombre de minutes doit être supérieur à zéro");

    this.id = props.id;
    this.companyId = props.companyId;
    this.userId = props.userId;
    this.attendanceId = props.attendanceId;
    this.date = props.date;
    this.minutes = props.minutes;
    this.rate = props.rate;
    this.reason = props.reason.trim();
    this._status = props.status;
    this._approvedById = props.approvedById;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public get status(): OvertimeStatus {
    return this._status;
  }

  public get approvedById(): string | null | undefined {
    return this._approvedById;
  }

  public get hours(): number {
    return parseFloat((this.minutes / 60).toFixed(2));
  }

  public approve(adminId: string): void {
    if (!this._status.isPending()) {
      throw new Error("Seule une déclaration d'heures supp. en attente peut être approuvée");
    }
    this._status = OvertimeStatus.approved();
    this._approvedById = adminId;
  }

  public calculateExtraPay(hourlyRate: Money): Money {
    const baseAmount = hourlyRate.multiply(this.hours);
    return baseAmount.multiply(this.rate.getMultiplier());
  }
}
