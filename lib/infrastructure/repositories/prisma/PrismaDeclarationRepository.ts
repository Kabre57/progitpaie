import { prisma } from "@/lib/db";
import { Money } from "@/lib/domain/payroll/money";
import { TaxAuthority } from "@/lib/domain/declaration/value-objects/TaxAuthority";
import { SocialTaxDeclaration, DeclarationEmployeeLine } from "@/lib/domain/declaration/entities/SocialTaxDeclaration";
import { DeclarationRepository } from "@/lib/application/declaration/ports/DeclarationRepository";

export class PrismaDeclarationRepository implements DeclarationRepository {
  public async getCnpsDeclaration(companyId: string, month: number, year: number): Promise<SocialTaxDeclaration> {
    const payrolls = await prisma.payroll.findMany({
      where: { month, year, user: { companyId } },
      include: {
        user: { select: { name: true, employeeId: true } },
      },
    });

    let totalBrut = 0;
    let totalCNPSSalarié = 0;
    let totalCNPSPatronal = 0;

    const lines: DeclarationEmployeeLine[] = payrolls.map((p) => {
      totalBrut += p.grossSalary || 0;
      totalCNPSSalarié += p.cnpsEmployee || 0;
      totalCNPSPatronal += p.cnpsEmployer || 0;
      return {
        employeeId: p.user.employeeId || "N/A",
        name: p.user.name,
        grossSalary: Money.of(p.grossSalary || 0),
        taxAmount: Money.of(p.cnpsEmployee || 0),
        employerContribution: Money.of(p.cnpsEmployer || 0),
      };
    });

    return new SocialTaxDeclaration({
      companyId,
      authority: TaxAuthority.cnps(),
      month,
      year,
      totalEmployees: payrolls.length,
      totalGrossSalary: Money.of(totalBrut),
      totalEmployeeTax: Money.of(totalCNPSSalarié),
      totalEmployerContribution: Money.of(totalCNPSPatronal),
      lines,
    });
  }

  public async getItsDeclaration(companyId: string, month: number, year: number): Promise<SocialTaxDeclaration> {
    const payrolls = await prisma.payroll.findMany({
      where: { month, year, user: { companyId } },
    });

    let totalBrutImposable = 0;
    let totalITS = 0;
    let totalIGR = 0;

    payrolls.forEach((p) => {
      totalBrutImposable += p.grossSalary || 0;
      totalITS += p.itsTax || 0;
      totalIGR += p.igrTax || 0;
    });

    return new SocialTaxDeclaration({
      companyId,
      authority: TaxAuthority.dgi(),
      month,
      year,
      totalEmployees: payrolls.length,
      totalGrossSalary: Money.of(totalBrutImposable),
      totalEmployeeTax: Money.of(totalITS),
      totalEmployerContribution: Money.of(totalIGR),
    });
  }
}
