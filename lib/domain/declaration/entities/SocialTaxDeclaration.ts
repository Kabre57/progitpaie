import { Money } from "@/lib/domain/payroll/money";
import { TaxAuthority } from "../value-objects/TaxAuthority";

export interface DeclarationEmployeeLine {
  employeeId: string;
  name: string;
  grossSalary: Money;
  taxAmount: Money;
  employerContribution?: Money;
}

export interface SocialTaxDeclarationProps {
  companyId: string;
  authority: TaxAuthority;
  month: number;
  year: number;
  totalEmployees: number;
  totalGrossSalary: Money;
  totalEmployeeTax: Money;
  totalEmployerContribution?: Money;
  lines?: readonly DeclarationEmployeeLine[];
}

export class SocialTaxDeclaration {
  public readonly companyId: string;
  public readonly authority: TaxAuthority;
  public readonly month: number;
  public readonly year: number;
  public readonly totalEmployees: number;
  public readonly totalGrossSalary: Money;
  public readonly totalEmployeeTax: Money;
  public readonly totalEmployerContribution: Money;
  public readonly lines: readonly DeclarationEmployeeLine[];

  constructor(props: SocialTaxDeclarationProps) {
    if (!props.companyId) throw new Error("companyId est obligatoire");
    if (props.month < 1 || props.month > 12) throw new Error("Mois invalide");

    this.companyId = props.companyId;
    this.authority = props.authority;
    this.month = props.month;
    this.year = props.year;
    this.totalEmployees = props.totalEmployees;
    this.totalGrossSalary = props.totalGrossSalary;
    this.totalEmployeeTax = props.totalEmployeeTax;
    this.totalEmployerContribution = props.totalEmployerContribution || Money.zero();
    this.lines = props.lines || [];
  }

  public get periodString(): string {
    return `${this.year}/${String(this.month).padStart(2, "0")}`;
  }

  public calculateTotalAmountToPay(): Money {
    return this.totalEmployeeTax.add(this.totalEmployerContribution);
  }
}
