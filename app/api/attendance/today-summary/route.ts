import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import { AttendanceStatus } from "@prisma/client";
import { ApiResponse } from "@/types";

// GET /api/attendance/today-summary - Get today's attendance summary
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Get total active employees
    const totalEmployees = await prisma.user.count({ where: { isActive: true } });

    // Get today's attendance records
    const todayRecords = await prisma.attendance.findMany({ where: { date: todayStr } });

    // Calculate summary
    const presentToday = todayRecords.filter(
      (r) => r.status === AttendanceStatus.present || r.status === AttendanceStatus.late
    ).length;
    const absentToday = todayRecords.filter((r) => r.status === AttendanceStatus.absent).length;
    const lateToday = todayRecords.filter((r) => r.status === AttendanceStatus.late).length;
    const onLeaveToday = todayRecords.filter((r) => r.status === AttendanceStatus.on_leave).length;

    // Employees who haven't checked in yet
    const notCheckedIn = Math.max(0, totalEmployees - todayRecords.length);

    return NextResponse.json<ApiResponse<unknown>>(
      {
        success: true,
        data: {
          totalEmployees,
          presentToday,
          absentToday,
          lateToday,
          onLeaveToday,
          notCheckedIn,
          date: todayStr,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get today summary error:", error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Internal server error",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
