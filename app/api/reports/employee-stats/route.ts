import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import { AttendanceStatus } from "@prisma/client";
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

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const records = await prisma.attendance.findMany({
      where: {
        userId: user.userId,
        date: {
          gte: startOfMonth.toISOString().split("T")[0],
          lte: endOfMonth.toISOString().split("T")[0],
        },
      },
    });

    const stats = {
      presentDays: records.filter((r) => r.status === AttendanceStatus.present).length,
      absentDays: records.filter((r) => r.status === AttendanceStatus.absent).length,
      lateDays: records.filter((r) => r.status === AttendanceStatus.late).length,
      halfDays: records.filter((r) => r.status === AttendanceStatus.half_day).length,
      leaveDays: records.filter((r) => r.status === AttendanceStatus.on_leave).length,
      totalHours: records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0),
    };

    const formattedRecords = records.map((r) => ({
      ...r,
      _id: r.id,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          month,
          year,
          stats,
          records: formattedRecords,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get employee stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stats",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
