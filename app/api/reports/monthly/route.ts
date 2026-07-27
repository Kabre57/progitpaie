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

    const cacheKey = `report:monthly:${year}:${month}`;
    const cachedData = await getCachedReport(cacheKey);
    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData }, { status: 200 });
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const records = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfMonth.toISOString().split("T")[0],
          lte: endOfMonth.toISOString().split("T")[0],
        },
      },
      include: {
        user: { select: { id: true, name: true, departmentId: true } },
      },
    });

    const dailyStats: Record<string, { present: number; absent: number; late: number; leave: number }> = {};

    for (let d = 1; d <= endOfMonth.getDate(); d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      dailyStats[dateStr] = { present: 0, absent: 0, late: 0, leave: 0 };
    }

    records.forEach((record) => {
      if (dailyStats[record.date]) {
        if (record.status === AttendanceStatus.present) dailyStats[record.date].present++;
        else if (record.status === AttendanceStatus.absent) dailyStats[record.date].absent++;
        else if (record.status === AttendanceStatus.late) dailyStats[record.date].late++;
        else if (record.status === AttendanceStatus.on_leave) dailyStats[record.date].leave++;
      }
    });

    const responseData = {
      month,
      year,
      dailyStats,
      totalRecords: records.length,
    };

    await cacheReport(cacheKey, responseData, 300);

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get monthly report error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch report",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
