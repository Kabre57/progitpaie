import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { AttendanceStatus } from "@prisma/client";
import { getCachedReport, cacheReport } from "@/lib/redis";
import { ApiResponse } from "@/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireTenant(request, "admin");
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const monthsCount = parseInt(searchParams.get("months") || "6", 10);

    const cacheKey = `report:trend:${user.companyId}:${monthsCount}`;
    const cachedData = await getCachedReport(cacheKey);
    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData }, { status: 200 });
    }

    const trends = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      const startStr = startOfMonth.toISOString().split("T")[0];
      const endStr = endOfMonth.toISOString().split("T")[0];

      const attendanceRecords = await prisma.attendance.findMany({
        where: { date: { gte: startStr, lte: endStr }, user: { companyId: user.companyId } },
      });

      const present = attendanceRecords.filter((r) => r.status === AttendanceStatus.present).length;
      const absent = attendanceRecords.filter((r) => r.status === AttendanceStatus.absent).length;
      const late = attendanceRecords.filter((r) => r.status === AttendanceStatus.late).length;
      const onLeave = attendanceRecords.filter((r) => r.status === AttendanceStatus.on_leave).length;
      const halfDay = attendanceRecords.filter((r) => r.status === AttendanceStatus.half_day).length;

      const monthName = date.toLocaleString("en-US", { month: "short", year: "numeric" });

      trends.push({
        month: monthName,
        year,
        monthNumber: month,
        present,
        absent,
        late,
        onLeave,
        halfDay,
        total: attendanceRecords.length,
      });
    }

    await cacheReport(cacheKey, trends, 300);

    return NextResponse.json(
      {
        success: true,
        data: trends,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get trend report error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch trend report",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
