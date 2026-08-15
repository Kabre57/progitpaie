import type {
  AttendanceImportEmployee,
  AttendanceImportRepository,
  UpsertAttendanceImportInput,
  UpsertImportedOvertimeInput,
} from "@/lib/application/attendance/ports/AttendanceImportRepository";
import { prisma } from "@/lib/db";

export class PrismaAttendanceImportRepository implements AttendanceImportRepository {
  public async listEmployees(companyId: string): Promise<readonly AttendanceImportEmployee[]> {
    const employees = await prisma.user.findMany({
      where: { companyId },
      select: { id: true, employeeId: true, email: true },
    });
    return employees;
  }

  public async createEmployee(companyId: string, employeeId: string, name: string): Promise<AttendanceImportEmployee> {
    const employee = await prisma.user.create({
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
    return employee;
  }

  public async upsertAttendance(input: UpsertAttendanceImportInput): Promise<void> {
    await prisma.attendance.upsert({
      where: { userId_date: { userId: input.userId, date: input.date } },
      update: {
        status: input.status,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        hoursWorked: input.hoursWorked,
        workingMinutes: input.workingMinutes,
        overtimeMinutes: input.overtimeMinutes,
        notes: input.notes,
      },
      create: {
        companyId: input.companyId,
        userId: input.userId,
        date: input.date,
        status: input.status,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        hoursWorked: input.hoursWorked,
        workingMinutes: input.workingMinutes,
        overtimeMinutes: input.overtimeMinutes,
        notes: input.notes,
      },
    });
  }

  public async upsertOvertime(input: UpsertImportedOvertimeInput): Promise<void> {
    const existing = await prisma.overtime.findFirst({
      where: { companyId: input.companyId, userId: input.userId, date: input.date },
      select: { id: true },
    });
    if (existing) {
      await prisma.overtime.update({
        where: { id: existing.id },
        data: { minutes: input.minutes, rate: input.rate, reason: input.reason },
      });
      return;
    }
    await prisma.overtime.create({
      data: {
        companyId: input.companyId,
        userId: input.userId,
        date: input.date,
        minutes: input.minutes,
        rate: input.rate,
        reason: input.reason,
        status: "pending",
      },
    });
  }
}
