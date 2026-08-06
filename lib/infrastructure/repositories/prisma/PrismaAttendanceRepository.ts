import { prisma } from "@/lib/db";
import { Attendance } from "@/lib/domain/attendance/entities/Attendance";
import { AttendanceRepository, ListAttendanceQuery, TodaySummaryDTO } from "@/lib/application/attendance/ports/AttendanceRepository";
import { mapPrismaToDomainAttendance } from "./mappers/prisma-attendance-entity.mapper";
import { AttendanceStatus as PrismaStatus, Prisma } from "@prisma/client";

export class PrismaAttendanceRepository implements AttendanceRepository {
  public async list(query: ListAttendanceQuery): Promise<readonly Attendance[]> {
    const where: Prisma.AttendanceWhereInput = {
      companyId: query.companyId,
    };
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status as PrismaStatus;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = query.startDate;
      if (query.endDate) where.date.lte = query.endDate;
    }
    if (query.departmentId) {
      where.user = { departmentId: query.departmentId };
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: [{ date: "desc" }, { checkIn: "desc" }],
    });

    return records.map(mapPrismaToDomainAttendance);
  }

  public async findByIdForTenant(companyId: string, id: string): Promise<Attendance | null> {
    const record = await prisma.attendance.findFirst({
      where: { id, companyId },
    });
    if (!record) return null;
    return mapPrismaToDomainAttendance(record);
  }

  public async findByUserAndDate(companyId: string, userId: string, date: string): Promise<Attendance | null> {
    const record = await prisma.attendance.findFirst({
      where: { companyId, userId, date },
    });
    if (!record) return null;
    return mapPrismaToDomainAttendance(record);
  }

  public async getTodaySummary(companyId: string, date: string): Promise<TodaySummaryDTO> {
    const [totalEmployees, attendances] = await Promise.all([
      prisma.user.count({ where: { companyId, isActive: true } }),
      prisma.attendance.findMany({
        where: { companyId, date },
        select: { status: true },
      }),
    ]);

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let onLeaveCount = 0;

    attendances.forEach((a) => {
      if (a.status === "present") presentCount++;
      else if (a.status === "late") lateCount++;
      else if (a.status === "absent") absentCount++;
      else if (a.status === "on_leave") onLeaveCount++;
    });

    const attendanceRate = totalEmployees > 0 ? Math.round(((presentCount + lateCount) / totalEmployees) * 100) : 0;

    return {
      totalEmployees,
      presentCount,
      lateCount,
      absentCount,
      onLeaveCount,
      presentToday: presentCount,
      lateToday: lateCount,
      absentToday: absentCount,
      attendanceRate,
      avgHoursThisMonth: 8.0,
      totalLateThisMonth: lateCount,
      presentTrend: 0,
      lateTrend: 0,
    };
  }

  public async save(attendance: Attendance): Promise<Attendance> {
    const data = {
      companyId: attendance.companyId,
      userId: attendance.userId,
      date: attendance.date,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut || null,
      status: attendance.status.value as PrismaStatus,
      hoursWorked: attendance.workDuration.hoursWorked,
      workingMinutes: attendance.workDuration.workingMinutes,
      overtimeMinutes: attendance.workDuration.overtimeMinutes,
      overtimeRate: attendance.workDuration.overtimeRate,
      locationLat: attendance.location?.latitude || null,
      locationLng: attendance.location?.longitude || null,
      accuracyMeters: attendance.location?.accuracyMeters || null,
      distanceMeters: attendance.location?.distanceMeters || null,
      isWithinFence: attendance.location ? attendance.location.isWithinFence : true,
      notes: attendance.notes,
      exceptionStatus: attendance.exceptionStatus || null,
      exceptionType: attendance.exceptionType || null,
      exceptionReason: attendance.exceptionReason || null,
      overriddenById: attendance.overriddenById || null,
      overriddenAt: attendance.overriddenAt || null,
      outOfOffice: attendance.outOfOffice,
    };

    if (attendance.id) {
      const updated = await prisma.attendance.update({
        where: { id: attendance.id, companyId: attendance.companyId },
        data,
      });
      return mapPrismaToDomainAttendance(updated);
    } else {
      const created = await prisma.attendance.create({
        data,
      });
      return mapPrismaToDomainAttendance(created);
    }
  }
}
