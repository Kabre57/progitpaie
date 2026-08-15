import type {
  DocumentCompanyProfile,
  DocumentEmployeeProfile,
  DocumentGenerationRepository,
  DocumentPayslipSource,
} from "@/lib/application/document/ports/DocumentGenerationRepository";
import { prisma } from "@/lib/db";

function toNumber(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

function toCompanyProfile(company: {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  cnpsNumber: string | null;
}): DocumentCompanyProfile {
  return company;
}

export class PrismaDocumentGenerationRepository implements DocumentGenerationRepository {
  public async getCompany(companyId: string): Promise<DocumentCompanyProfile | null> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, address: true, phone: true, email: true, taxNumber: true, cnpsNumber: true },
    });
    return company ? toCompanyProfile(company) : null;
  }

  public async getEmployee(companyId: string, userId: string | undefined): Promise<DocumentEmployeeProfile | null> {
    if (!userId) return null;
    const employee = await prisma.user.findFirst({
      where: { id: userId, companyId },
      select: {
        id: true,
        name: true,
        jobTitle: true,
        joiningDate: true,
        address: true,
        nationality: true,
        contractType: true,
        salary: true,
        transportAllowance: true,
        housingAllowance: true,
        company: { select: { id: true, name: true, address: true, phone: true, email: true, taxNumber: true, cnpsNumber: true } },
      },
    });
    if (!employee) return null;
    return {
      id: employee.id,
      name: employee.name,
      jobTitle: employee.jobTitle,
      joiningDate: employee.joiningDate,
      address: employee.address,
      nationality: employee.nationality,
      contractType: employee.contractType,
      salary: toNumber(employee.salary),
      transportAllowance: toNumber(employee.transportAllowance),
      housingAllowance: toNumber(employee.housingAllowance),
      company: employee.company ? toCompanyProfile(employee.company) : null,
    };
  }

  public async getPayslip(
    companyId: string,
    userId: string | undefined,
    month: number | undefined,
    year: number | undefined
  ): Promise<DocumentPayslipSource | null> {
    if (!userId || !month || !year) return null;
    const payroll = await prisma.payroll.findFirst({
      where: { userId, month, year, user: { companyId } },
      select: {
        grossSalary: true,
        totalDeductions: true,
        netSalary: true,
        user: { select: { name: true } },
      },
    });
    if (!payroll) return null;
    return {
      employeeName: payroll.user.name,
      grossSalary: toNumber(payroll.grossSalary),
      totalDeductions: toNumber(payroll.totalDeductions),
      netSalary: toNumber(payroll.netSalary),
    };
  }
}
