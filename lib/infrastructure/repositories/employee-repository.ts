/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Repository Employé (Infrastructure)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Encapsule l'accès à la table `User` / `Employee` de la base de données.
 * Déchiffre automatiquement le numéro CNPS et abstrait Prisma du reste du code.
 *
 * ADR-002 : Repository Pattern pour éliminer le couplage direct à Prisma.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { prisma } from "@/lib/db";
import { decryptData } from "@/lib/crypto";
import type { EmployeePayrollData } from "@/lib/domain/payroll/types/payroll-types";

export interface IEmployeeRepository {
  findById(id: string): Promise<EmployeePayrollData | null>;
  findAllActive(companyId?: string): Promise<ReadonlyArray<EmployeePayrollData>>;
}

export class EmployeeRepository implements IEmployeeRepository {
  /**
   * Mappe un enregistrement Prisma User vers le modèle de domaine EmployeePayrollData
   */
  private mapToDomain(user: any): EmployeePayrollData {
    const rawCnps = user.cnpsNumber ? decryptData(user.cnpsNumber) : "Exonéré";

    return {
      id: user.id,
      name: user.name || "SALARIE",
      employeeId: user.employeeId || "001",
      baseSalary: user.baseSalary || 0,
      sursalaire: user.sursalaire || 0,
      transportAllowance: user.transportAllowance || 30000,
      category: user.category || "1A",
      partsIGR: user.partsIGR || 1.0,
      cnpsNumber: rawCnps,
      joiningDate: user.joiningDate ? new Date(user.joiningDate).toISOString() : new Date().toISOString(),
      contractType: (user.contractType as any) || "CDI",
      isExpatriate: user.isExpatriate || false,
      departmentName: user.direction || user.department?.name || "ADMINISTRATION",
      jobTitle: user.jobTitle || "Employé",
    };
  }

  /**
   * Récupère un employé par son ID
   */
  public async findById(id: string): Promise<EmployeePayrollData | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!user) return null;
    return this.mapToDomain(user);
  }

  /**
   * Récupère tous les employés actifs (optionnellement filtrés par entreprise)
   */
  public async findAllActive(companyId?: string): Promise<ReadonlyArray<EmployeePayrollData>> {
    const whereCondition: any = { isActive: true };
    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const users = await prisma.user.findMany({
      where: whereCondition,
      include: { department: true },
      orderBy: { name: "asc" },
    });

    return users.map((u) => this.mapToDomain(u));
  }
}
