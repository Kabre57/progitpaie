import type {
  ManagerAssignmentRepository,
  ManagerAssignmentResult,
} from "@/lib/application/org-chart/ports/ManagerAssignmentRepository";
import { prisma } from "@/lib/db";

export class PrismaManagerAssignmentRepository implements ManagerAssignmentRepository {
  public async assign(companyId: string, employeeId: string, managerId: string | null): Promise<ManagerAssignmentResult> {
    const employeeExists = await prisma.user.findFirst({ where: { id: employeeId, companyId }, select: { id: true } });
    if (!employeeExists) throw new Error("EMPLOYEE_NOT_FOUND_IN_TENANT");

    if (managerId) {
      const manager = await prisma.user.findFirst({ where: { id: managerId, companyId }, select: { id: true } });
      if (!manager) throw new Error("MANAGER_NOT_FOUND_IN_TENANT");
    }

    const employee = await prisma.user.update({
      where: { id: employeeId, companyId },
      data: { managerId },
      select: { id: true, name: true, managerId: true, manager: { select: { name: true } } },
    });
    return {
      employeeId: employee.id,
      employeeName: employee.name,
      managerId: employee.managerId,
      managerName: employee.manager?.name ?? null,
    };
  }
}
