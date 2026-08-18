import { prisma } from "@/lib/db";
import { Employee } from "@/lib/domain/employee/entities/Employee";
import { EmployeeRepository, ListEmployeesQuery } from "@/lib/application/employee/ports/EmployeeRepository";
import { mapPrismaToDomainEmployee } from "./mappers/prisma-employee-entity.mapper";
import { Prisma, UserRole } from "@prisma/client";

function toUserRole(role: string): UserRole {
  return Object.values(UserRole).includes(role as UserRole) ? role as UserRole : UserRole.employee;
}

export class PrismaEmployeeRepository implements EmployeeRepository {
  public async list(query: ListEmployeesQuery): Promise<readonly Employee[]> {
    const where: Prisma.UserWhereInput = {
      companyId: query.companyId,
      role: "employee",
      // Par défaut, ne retourner que les salariés actifs (isActive: true) sauf demande explicite
      isActive: query.isActive !== undefined ? query.isActive : true,
    };
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { employeeId: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const records = await prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return records.map(mapPrismaToDomainEmployee);
  }

  public async findByIdForTenant(companyId: string, id: string): Promise<Employee | null> {
    const record = await prisma.user.findFirst({
      where: { id, companyId },
    });
    if (!record) return null;
    return mapPrismaToDomainEmployee(record);
  }

  public async findByEmail(email: string): Promise<Employee | null> {
    const record = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!record) return null;
    return mapPrismaToDomainEmployee(record);
  }

  public async findByEmployeeId(companyId: string, employeeId: string): Promise<Employee | null> {
    const record = await prisma.user.findFirst({
      where: { companyId, employeeId },
    });
    if (!record) return null;
    return mapPrismaToDomainEmployee(record);
  }

  public async delete(companyId: string, id: string): Promise<boolean> {
    try {
      // Tentative de suppression physique (Hard Delete)
      const result = await prisma.user.deleteMany({
        where: { id, companyId },
      });
      if (result.count > 0) return true;
    } catch {
      // Fallback vers la désactivation (Soft Delete) si des relations de clés étrangères existent
      await prisma.user.updateMany({
        where: { id, companyId },
        data: { isActive: false },
      });
      return true;
    }
    return false;
  }

  public async save(employee: Employee): Promise<Employee> {
    const data = {
      companyId: employee.companyId,
      employeeId: employee.employeeId ? employee.employeeId.value : null,
      name: employee.name,
      email: employee.email,
      role: toUserRole(employee.role),
      departmentId: employee.departmentId || null,
      shiftId: employee.shiftId || null,
      salary: employee.salary.toNumber(),
      sursalaire: employee.sursalaire.toNumber(),
      transportAllowance: employee.transportAllowance.toNumber(),
      housingAllowance: employee.housingAllowance.toNumber(),
      partsIGR: employee.partsIGR,
      cnpsNumber: employee.cnpsNumber || null,
      idCardNumber: employee.idCardNumber || null,
      bankAccount: employee.bankAccount || null,
      bankName: employee.bankName || null,
      paymentMethod: employee.paymentMethod,
      joiningDate: employee.joiningDate || undefined,
      isActive: employee.isActive,
    };

    if (employee.id) {
      const updated = await prisma.user.update({
        where: { id: employee.id, companyId: employee.companyId },
        data,
      });
      return mapPrismaToDomainEmployee(updated);
    } else {
      const created = await prisma.user.create({
        data: {
          ...data,
          password: "$2a$10$UnmanagedPasswordPlaceholderHashToSatisfySchemaConstraint",
        },
      });
      return mapPrismaToDomainEmployee(created);
    }
  }
}
