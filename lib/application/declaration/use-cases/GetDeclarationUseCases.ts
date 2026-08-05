import { DeclarationRepository } from "../ports/DeclarationRepository";
import { DeclarationDTO } from "../dto/DeclarationDTO";

export class GetCnpsDeclarationUseCase {
  constructor(private readonly repository: DeclarationRepository) {}

  public async execute(companyId: string, month: number, year: number): Promise<DeclarationDTO> {
    const dec = await this.repository.getCnpsDeclaration(companyId, month, year);
    return {
      period: dec.periodString,
      authority: dec.authority.name,
      formName: dec.authority.formName,
      totalEmployees: dec.totalEmployees,
      totalGrossSalary: Math.round(dec.totalGrossSalary.toNumber()),
      cnpsEmployeeTotal: Math.round(dec.totalEmployeeTax.toNumber()),
      cnpsEmployerTotal: Math.round(dec.totalEmployerContribution.toNumber()),
      totalCNPSToPay: Math.round(dec.calculateTotalAmountToPay().toNumber()),
      employeeDetails: dec.lines.map((l) => ({
        employeeId: l.employeeId,
        name: l.name,
        grossSalary: Math.round(l.grossSalary.toNumber()),
        cnpsEmployee: Math.round(l.taxAmount.toNumber()),
        cnpsEmployer: Math.round(l.employerContribution?.toNumber() || 0),
      })),
    };
  }
}

export class GetItsDeclarationUseCase {
  constructor(private readonly repository: DeclarationRepository) {}

  public async execute(companyId: string, month: number, year: number): Promise<DeclarationDTO> {
    const dec = await this.repository.getItsDeclaration(companyId, month, year);
    return {
      period: dec.periodString,
      country: "Côte d'Ivoire",
      authority: dec.authority.name,
      formName: dec.authority.formName,
      totalEmployees: dec.totalEmployees,
      totalGrossSalary: Math.round(dec.totalGrossSalary.toNumber()),
      totalITS: Math.round(dec.totalEmployeeTax.toNumber()),
      totalIGR: Math.round(dec.totalEmployerContribution.toNumber()),
      totalTaxToPay: Math.round(dec.calculateTotalAmountToPay().toNumber()),
    };
  }
}
