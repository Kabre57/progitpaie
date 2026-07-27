import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import { AttendanceStatus } from "@prisma/client";
import { getCachedReport, cacheReport } from "@/lib/redis";
import { ApiResponse } from "@/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "", 10);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    const cacheKey = `report:dept:${year}:${month}`;
    const cachedData = await getCachedReport(cacheKey);
    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData }, { status: 200 });
    }

    const departments = await prisma.department.findMany({
      where: { isActive: true },
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    const startStr = startOfMonth.toISOString().split("T")[0];
    const endStr = endOfMonth.toISOString().split("T")[0];

    const workingDays = 26;

    const departmentReports = await Promise.all(
      departments.map(async (dept) => {
        const employees = await prisma.user.findMany({
          where: { departmentId: dept.id, isActive: true },
          select: { id: true },
        });

        const employeeIds = employees.map((e) => e.id);
        const totalEmployees = employees.length;

        if (totalEmployees === 0) {
          return {
            departmentName: dept.name,
            totalEmployees: 0,
            presentDays: 0,
            absentDays: 0,
            attendanceRate: 0,
          };
        }

        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            userId: { in: employeeIds },
            date: { gte: startStr, lte: endStr },
          },
        });

        const presentDays = attendanceRecords.filter(
          (r) => r.status === AttendanceStatus.present || r.status === AttendanceStatus.late
        ).length;
        const absentDays = attendanceRecords.filter((r) => r.status === AttendanceStatus.absent).length;

        const expectedAttendance = totalEmployees * workingDays;
        const attendanceRate =
          expectedAttendance > 0 ? Math.round((presentDays / expectedAttendance) * 100) : 0;

        return {
          departmentName: dept.name,
          totalEmployees,
          presentDays,
          absentDays,
          attendanceRate,
        };
      })
    );

    await cacheReport(cacheKey, departmentReports, 300);

    return NextResponse.json(
      {
        success: true,
        data: departmentReports,
        meta: { month, year, workingDays },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get department report error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch department report",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
