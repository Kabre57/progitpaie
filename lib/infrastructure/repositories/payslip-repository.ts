/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Repository Bulletin de Paie (Infrastructure)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Encapsule l'accès à la table `Payroll` et à ses snapshots de configuration.
 *
 * ADR-002 : Repository Pattern pour éliminer le couplage direct à Prisma.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { PayslipResult } from "@/lib/domain/payroll/types/payroll-types";

export type PayrollWithUserDepartment = Prisma.PayrollGetPayload<{
  include: {
    user: {
      include: { department: true };
    };
  };
}>;

export interface IPayslipRepository {
  findByUserAndPeriod(userId: string, month: number, year: number): Promise<PayrollWithUserDepartment | null>;
  findAllByPeriod(month: number, year: number): Promise<ReadonlyArray<PayrollWithUserDepartment>>;
  savePayslip(userId: string, month: number, year: number, result: PayslipResult): Promise<Prisma.PayrollGetPayload<{}>>;
}

export class PayslipRepository implements IPayslipRepository {
  /**
   * Récupère le bulletin d'un utilisateur pour un mois et une année donnés
   */
  public async findByUserAndPeriod(userId: string, month: number, year: number): Promise<PayrollWithUserDepartment | null> {
    return prisma.payroll.findUnique({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
      include: {
        user: {
          include: { department: true },
        },
      },
    });
  }

  /**
   * Récupère tous les bulletins pour un mois et une année donnés
   */
  public async findAllByPeriod(month: number, year: number): Promise<ReadonlyArray<PayrollWithUserDepartment>> {
    return prisma.payroll.findMany({
      where: { month, year },
      include: {
        user: {
          include: { department: true },
        },
      },
      orderBy: { user: { name: "asc" } },
    });
  }

  /**
   * Enregistre ou met à jour un bulletin de paie à partir du résultat du moteur modulaire
   */
  public async savePayslip(
    userId: string,
    month: number,
    year: number,
    result: PayslipResult
  ): Promise<Prisma.PayrollGetPayload<{}>> {
    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    if (!employee) throw new Error("Employé introuvable");
    return prisma.payroll.upsert({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
      update: {
        basicSalary: result.baseSalary,
        sursalaire: result.sursalaire,
        transportAllowance: result.transportAllowance,
        grossSalary: result.grossSalary,
        itsTax: result.taxDeductions.its,
        cnpsEmployee: result.employeeContributions.cnpsRetirement,
        netSalary: result.netSalary,
        updatedAt: new Date(),
      },
      create: {
        companyId: employee.companyId,
        userId,
        month,
        year,
        basicSalary: result.baseSalary,
        sursalaire: result.sursalaire,
        transportAllowance: result.transportAllowance,
        grossSalary: result.grossSalary,
        itsTax: result.taxDeductions.its,
        cnpsEmployee: result.employeeContributions.cnpsRetirement,
        netSalary: result.netSalary,
        status: "draft",
      },
    });
  }
}
