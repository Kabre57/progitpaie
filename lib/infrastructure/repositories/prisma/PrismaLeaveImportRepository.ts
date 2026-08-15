import type {
  CreateImportedLeaveInput,
  LeaveImportEmployee,
  LeaveImportRepository,
} from "@/lib/application/leave/ports/LeaveImportRepository";
import { prisma } from "@/lib/db";

export class PrismaLeaveImportRepository implements LeaveImportRepository {
  public async listEmployees(companyId: string): Promise<readonly LeaveImportEmployee[]> {
    return prisma.user.findMany({
      where: { companyId },
      select: { id: true, employeeId: true, email: true },
    });
  }

  public async createEmployee(companyId: string, employeeId: string, name: string): Promise<LeaveImportEmployee> {
    return prisma.user.create({
      data: {
        companyId,
        employeeId,
        name,
        email: `${employeeId.toLowerCase().replace(/[^a-z0-9]/g, "")}@progitpaie.local`,
        role: "employee",
        password: "$2a$10$UnmanagedPasswordPlaceholderHashToSatisfySchemaConstraint",
      },
      select: { id: true, employeeId: true, email: true },
    });
  }

  public async createLeave(input: CreateImportedLeaveInput): Promise<void> {
    await prisma.leave.create({
      data: {
        companyId: input.companyId,
        userId: input.userId,
        leaveType: input.leaveType,
        startDate: input.startDate,
        endDate: input.endDate,
        totalDays: input.totalDays,
        reason: input.reason,
        status: input.status,
        approvedById: input.approvedById,
      },
    });
  }
}
