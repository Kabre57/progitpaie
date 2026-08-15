import type { EmployeeExportRecord, EmployeeExportRepository } from "@/lib/application/employee/ports/EmployeeExportRepository";
import { prisma } from "@/lib/db";

function toNumber(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

export class PrismaEmployeeExportRepository implements EmployeeExportRepository {
  public async listActive(companyId: string): Promise<readonly EmployeeExportRecord[]> {
    const employees = await prisma.user.findMany({
      where: { isActive: true, companyId },
      select: {
        employeeId: true,
        name: true,
        email: true,
        department: { select: { name: true } },
        shift: { select: { name: true } },
        salary: true,
        joiningDate: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
    return employees.map((employee) => ({
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      departmentName: employee.department?.name ?? null,
      shiftName: employee.shift?.name ?? null,
      salary: toNumber(employee.salary),
      joiningDate: employee.joiningDate,
      isActive: employee.isActive,
    }));
  }
}
