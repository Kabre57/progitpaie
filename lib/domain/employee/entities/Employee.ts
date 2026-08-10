import { Money } from "@/lib/domain/payroll/money";
import { EmployeeId } from "../value-objects/EmployeeId";
import { Seniority } from "../value-objects/Seniority";

export interface EmployeeProps {
  id: string;
  companyId: string;
  employeeId?: EmployeeId | null;
  name: string;
  email: string;
  role: string;
  departmentId?: string | null;
  shiftId?: string | null;
  salary: Money;
  sursalaire: Money;
  transportAllowance: Money;
  housingAllowance: Money;
  partsIGR: number;
  cnpsNumber?: string | null;
  idCardNumber?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  paymentMethod: string;
  joiningDate?: Date | null;
  jobTitle?: string | null;
  category?: string | null;
  direction?: string | null;
  service?: string | null;
  contractType?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Employee {
  public readonly id: string;
  public readonly companyId: string;
  public readonly employeeId?: EmployeeId | null;
  private _name: string;
  private _email: string;
  private _role: string;
  public readonly departmentId?: string | null;
  public readonly shiftId?: string | null;
  private _salary: Money;
  private _sursalaire: Money;
  private _transportAllowance: Money;
  private _housingAllowance: Money;
  private _partsIGR: number;
  public readonly cnpsNumber?: string | null;
  public readonly idCardNumber?: string | null;
  public readonly bankAccount?: string | null;
  public readonly bankName?: string | null;
  public readonly paymentMethod: string;
  public readonly joiningDate?: Date | null;
  private _isActive: boolean;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: EmployeeProps) {
    if (!props.companyId) throw new Error("companyId est obligatoire");
    if (!props.name || props.name.trim().length === 0) throw new Error("Le nom est obligatoire");
    if (!props.email || !props.email.includes("@")) throw new Error("Email invalide");

    this.id = props.id;
    this.companyId = props.companyId;
    this.employeeId = props.employeeId;
    this._name = props.name.trim();
    this._email = props.email.trim().toLowerCase();
    this._role = props.role;
    this.departmentId = props.departmentId;
    this.shiftId = props.shiftId;
    this._salary = props.salary;
    this._sursalaire = props.sursalaire;
    this._transportAllowance = props.transportAllowance;
    this._housingAllowance = props.housingAllowance;
    this._partsIGR = props.partsIGR > 0 ? props.partsIGR : 1.0;
    this.cnpsNumber = props.cnpsNumber;
    this.idCardNumber = props.idCardNumber;
    this.bankAccount = props.bankAccount;
    this.bankName = props.bankName;
    this.paymentMethod = props.paymentMethod || "ESPÈCES";
    this.joiningDate = props.joiningDate;
    this.jobTitle = props.jobTitle;
    this.category = props.category;
    this.direction = props.direction;
    this.service = props.service;
    this.contractType = props.contractType;
    this.managerId = props.managerId;
    this.managerName = props.managerName;
    this._isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public readonly jobTitle?: string | null;
  public readonly category?: string | null;
  public readonly direction?: string | null;
  public readonly service?: string | null;
  public readonly contractType?: string | null;
  public readonly managerId?: string | null;
  public readonly managerName?: string | null;

  public get name(): string {
    return this._name;
  }

  public get email(): string {
    return this._email;
  }

  public get role(): string {
    return this._role;
  }

  public get salary(): Money {
    return this._salary;
  }

  public get sursalaire(): Money {
    return this._sursalaire;
  }

  public get transportAllowance(): Money {
    return this._transportAllowance;
  }

  public get housingAllowance(): Money {
    return this._housingAllowance;
  }

  public get partsIGR(): number {
    return this._partsIGR;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public calculateSeniority(referenceDate: Date = new Date()): Seniority {
    if (!this.joiningDate) return Seniority.create(0);
    return Seniority.calculateFromDate(this.joiningDate, referenceDate);
  }

  public calculateTotalGrossBase(): Money {
    return this._salary.add(this._sursalaire).add(this._transportAllowance).add(this._housingAllowance);
  }

  public deactivate(): void {
    this._isActive = false;
  }
}
