import type {
  AttendanceExportRepository,
} from "@/lib/application/attendance/ports/AttendanceExportRepository";
import { prisma } from "@/lib/db";

function toNumberOrNull(value: { toNumber(): number } | number | null): number | null {
  if (value === null) return null;
  return typeof value === "number" ? value : value.toNumber();
}

export class PrismaAttendanceExportRepository implements AttendanceExportRepository {
  public async list(companyId: string, departmentId: string | undefined, startDate: string, endDate: string) {
    const employees = await prisma.user.findMany({
      where: { isActive: true, companyId, ...(departmentId ? { departmentId } : {}) },
      select: { id: true, name: true, employeeId: true, department: { select: { name: true } } },
    });
    const userIds = employees.map((employee) => employee.id);
    const records = userIds.length === 0
      ? []
      : await prisma.attendance.findMany({
          where: { companyId, userId: { in: userIds }, date: { gte: startDate, lte: endDate } },
          select: { userId: true, date: true, checkIn: true, checkOut: true, status: true, hoursWorked: true },
        });

    return {
      employees: employees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        employeeId: employee.employeeId,
        departmentName: employee.department?.name ?? null,
      })),
      records: records.map((record) => ({
        userId: record.userId,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: record.status,
        hoursWorked: toNumberOrNull(record.hoursWorked),
      })),
    };
  }
}
