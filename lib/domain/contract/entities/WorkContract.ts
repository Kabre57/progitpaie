import { Money } from "@/lib/domain/payroll/money";
import { ContractType } from "../value-objects/ContractType";
import { EmployeeCategory } from "../value-objects/EmployeeCategory";

export interface WorkContractProps {
  id?: string;
  companyId: string;
  userId: string;
  type: ContractType;
  category: EmployeeCategory;
  jobTitle: string;
  startDate: Date;
  endDate?: Date | null;
  probationPeriodMonths?: number;
  baseSalary: Money;
  sursalaire?: Money;
  transportAllowance?: Money;
  housingAllowance?: Money;
  documentUrl?: string | null;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WorkContract {
  public readonly id?: string;
  public readonly companyId: string;
  public readonly userId: string;
  public readonly type: ContractType;
  public readonly category: EmployeeCategory;
  public readonly jobTitle: string;
  public readonly startDate: Date;
  public readonly endDate?: Date | null;
  public readonly probationPeriodMonths: number;
  public readonly baseSalary: Money;
  public readonly sursalaire: Money;
  public readonly transportAllowance: Money;
  public readonly housingAllowance: Money;
  public readonly documentUrl?: string | null;
  private _status: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: WorkContractProps) {
    if (!props.companyId) throw new Error("companyId est obligatoire");
    if (!props.userId) throw new Error("userId est obligatoire");
    if (!props.jobTitle || props.jobTitle.trim().length === 0) throw new Error("L'intitulé du poste est obligatoire");

    if (props.type.isFixedTerm() && !props.endDate) {
      throw new Error("Une date de fin est obligatoire pour les contrats à durée déterminée ou de stage");
    }

    this.id = props.id;
    this.companyId = props.companyId;
    this.userId = props.userId;
    this.type = props.type;
    this.category = props.category;
    this.jobTitle = props.jobTitle.trim();
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.probationPeriodMonths = props.probationPeriodMonths || 0;
    this.baseSalary = props.baseSalary;
    this.sursalaire = props.sursalaire || Money.zero();
    this.transportAllowance = props.transportAllowance || Money.zero();
    this.housingAllowance = props.housingAllowance || Money.zero();
    this.documentUrl = props.documentUrl;
    this._status = props.status || "active";
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public get status(): string {
    return this._status;
  }

  public calculateTotalMonthlyCompensation(): Money {
    return this.baseSalary.add(this.sursalaire).add(this.transportAllowance).add(this.housingAllowance);
  }

  public calculateProbationEndDate(): Date | null {
    if (this.probationPeriodMonths <= 0) return null;
    const endProbation = new Date(this.startDate);
    endProbation.setUTCMonth(endProbation.getUTCMonth() + this.probationPeriodMonths);
    return endProbation;
  }

  public terminate(): void {
    this._status = "terminated";
  }
}
