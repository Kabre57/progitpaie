import { Money } from "@/lib/domain/payroll/money";
import { TerminationType } from "../value-objects/TerminationType";
import { SeveranceBreakdown } from "../value-objects/SeveranceBreakdown";

export interface SeveranceCalculationProps {
  id?: string;
  companyId: string;
  userId: string;
  contractId?: string | null;
  terminationType: TerminationType;
  exitDate: Date;
  seniorityYears: number;
  breakdown: SeveranceBreakdown;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SeveranceCalculation {
  public readonly id?: string;
  public readonly companyId: string;
  public readonly userId: string;
  public readonly contractId?: string | null;
  public readonly terminationType: TerminationType;
  public readonly exitDate: Date;
  public readonly seniorityYears: number;
  public readonly breakdown: SeveranceBreakdown;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: SeveranceCalculationProps) {
    if (!props.companyId) throw new Error("companyId est obligatoire");
    if (!props.userId) throw new Error("userId est obligatoire");
    if (props.seniorityYears < 0) throw new Error("L'ancienneté ne peut pas être négative");

    this.id = props.id;
    this.companyId = props.companyId;
    this.userId = props.userId;
    this.contractId = props.contractId;
    this.terminationType = props.terminationType;
    this.exitDate = props.exitDate;
    this.seniorityYears = props.seniorityYears;
    this.breakdown = props.breakdown;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public get totalNetExit(): Money {
    return this.breakdown.calculateTotalNetExit();
  }
}
