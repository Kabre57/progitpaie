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
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const cacheKey = `report:top-performers:${year}:${month}:${limit}`;
    const cachedData = await getCachedReport(cacheKey);
    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData }, { status: 200 });
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    const startStr = startOfMonth.toISOString().split("T")[0];
    const endStr = endOfMonth.toISOString().split("T")[0];

    const workingDays = 26;

    const employees = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        employeeId: true,
        department: { select: { name: true } },
      },
    });

    const performerStats = await Promise.all(
      employees.map(async (emp) => {
        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            userId: emp.id,
            date: { gte: startStr, lte: endStr },
          },
        });

        const presentDays = attendanceRecords.filter((r) => r.status === AttendanceStatus.present).length;
        const lateDays = attendanceRecords.filter((r) => r.status === AttendanceStatus.late).length;
        const absentDays = attendanceRecords.filter((r) => r.status === AttendanceStatus.absent).length;

        const attendedDays = presentDays + lateDays;
        const attendanceRate = workingDays > 0 ? Math.round((attendedDays / workingDays) * 100) : 0;
        const punctualityScore = Math.max(0, Math.round(100 - lateDays * 3.85));

        return {
          userId: emp.id,
          name: emp.name,
          employeeId: emp.employeeId || "N/A",
          department: emp.department?.name || "N/A",
          presentDays,
          absentDays,
          lateDays,
          attendanceRate,
          punctualityScore,
        };
      })
    );

    const sortedPerformers = performerStats.sort((a, b) => {
      if (b.attendanceRate !== a.attendanceRate) {
        return b.attendanceRate - a.attendanceRate;
      }
      if (a.lateDays !== b.lateDays) {
        return a.lateDays - b.lateDays;
      }
      return b.punctualityScore - a.punctualityScore;
    });

    const topPerformers = sortedPerformers.slice(0, limit);

    await cacheReport(cacheKey, topPerformers, 300);

    return NextResponse.json(
      {
        success: true,
        data: topPerformers,
        meta: { month, year, limit, totalEmployees: employees.length },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get top performers error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch top performers",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
