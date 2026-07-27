import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import { AttendanceStatus } from "@prisma/client";
import { ApiResponse, CheckOutRequestBody } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Find today's attendance record
    const record = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.userId,
          date: todayStr,
        },
      },
    });

    if (!record) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "No check-in found for today",
          code: "NO_CHECKIN",
        },
        { status: 400 }
      );
    }

    if (record.checkOut) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Already checked out today",
          code: "ALREADY_CHECKED_OUT",
        },
        { status: 400 }
      );
    }

    const checkOutTime = new Date();
    const workingMs = checkOutTime.getTime() - record.checkIn.getTime();
    const workingMinutes = Math.floor(workingMs / (1000 * 60));
    const hoursWorked = Number((workingMinutes / 60).toFixed(2));

    // Get user shift to determine half-day threshold
    let isHalfDay = false;
    const userDoc = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { shift: true },
    });

    if (userDoc?.shift) {
      const halfDayThreshold = (userDoc.shift.workingHours * 60) / 2;
      isHalfDay = workingMinutes < halfDayThreshold;
    }

    // Parse request body
    let body: CheckOutRequestBody = {};
    try {
      body = await request.json();
    } catch {}

    let newStatus = record.status;
    if (isHalfDay && record.status !== AttendanceStatus.late) {
      newStatus = AttendanceStatus.half_day;
    }

    let updatedNotes = record.notes;
    if (body.notes) {
      updatedNotes = record.notes ? `${record.notes} | ${body.notes}` : body.notes;
    }

    const updatedRecord = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: checkOutTime,
        hoursWorked,
        workingMinutes,
        status: newStatus,
        notes: updatedNotes,
      },
    });

    return NextResponse.json<ApiResponse<unknown>>(
      {
        success: true,
        message: isHalfDay ? "Check-out recorded (Half Day)" : "Check-out successful",
        data: {
          id: updatedRecord.id,
          _id: updatedRecord.id,
          date: updatedRecord.date,
          checkIn: updatedRecord.checkIn,
          checkOut: updatedRecord.checkOut,
          hoursWorked: updatedRecord.hoursWorked,
          workingMinutes: updatedRecord.workingMinutes,
          status: updatedRecord.status,
          isHalfDay,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Check-out error:", error);
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
