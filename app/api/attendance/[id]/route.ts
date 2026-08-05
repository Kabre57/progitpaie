import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { AttendanceStatus } from "@prisma/client";
import { ApiResponse, AttendanceOverrideBody } from "@/types";

// PUT /api/attendance/[id] - Admin override attendance status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult;
    const { id } = await params;
    const body: AttendanceOverrideBody = await request.json();

    if (!body.status) {
      return NextResponse.json(
        {
          success: false,
          error: "Status is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Filtre companyId obligatoire : garantit l'isolation tenant
    const attendance = await prisma.attendance.findFirst({ where: { id, companyId: authResult.companyId } });
    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendance record not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const oldStatus = attendance.status;
    let updatedNotes = attendance.notes;
    if (body.notes) {
      updatedNotes = attendance.notes
        ? `${attendance.notes} | Admin: ${body.notes}`
        : `Admin: ${body.notes}`;
    }

    // Map status string to enum if needed (handling half-day / on-leave hyphens)
    let prismaStatus: AttendanceStatus = body.status as AttendanceStatus;
    if ((body.status as string) === "half-day") prismaStatus = AttendanceStatus.half_day;
    if ((body.status as string) === "on-leave") prismaStatus = AttendanceStatus.on_leave;

    const updated = await prisma.attendance.update({
      where: { id, companyId: authResult.companyId },
      data: {
        status: prismaStatus,
        notes: updatedNotes,
        overriddenById: user.userId,
        overriddenAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        overriddenBy: { select: { id: true, name: true } },
      },
    });

    const responseData = {
      ...updated,
      _id: updated.id,
      userId: {
        ...updated.user,
        _id: updated.user.id,
      },
      overriddenBy: updated.overriddenBy
        ? { ...updated.overriddenBy, _id: updated.overriddenBy.id }
        : null,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: `Attendance status updated from "${oldStatus}" to "${body.status}"`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Attendance override error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update attendance",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// GET /api/attendance/[id] - Get single attendance record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;

    // Filtre companyId obligatoire : garantit l'isolation tenant
    const attendance = await prisma.attendance.findFirst({
      where: { id, companyId: authResult.companyId },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true } },
        overriddenBy: { select: { id: true, name: true } },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendance record not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const responseData = {
      ...attendance,
      _id: attendance.id,
      userId: {
        ...attendance.user,
        _id: attendance.user.id,
      },
      overriddenBy: attendance.overriddenBy
        ? { ...attendance.overriddenBy, _id: attendance.overriddenBy.id }
        : null,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get attendance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch attendance",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
