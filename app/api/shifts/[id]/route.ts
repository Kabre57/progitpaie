import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { ApiResponse, CreateShiftBody } from "@/types";

// PUT /api/shifts/[id] - Update shift (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const body: Partial<CreateShiftBody> = await request.json();

    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      return NextResponse.json(
        {
          success: false,
          error: "Shift not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (body.name && body.name.trim() !== shift.name) {
      const existingShift = await prisma.shift.findFirst({
        where: {
          name: { equals: body.name.trim(), mode: "insensitive" },
          NOT: { id },
        },
      });

      if (existingShift) {
        return NextResponse.json(
          {
            success: false,
            error: "Shift with this name already exists",
            code: "DUPLICATE_ERROR",
          },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.shift.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        startTime: body.startTime !== undefined ? body.startTime : undefined,
        endTime: body.endTime !== undefined ? body.endTime : undefined,
        workingHours: body.workingHours !== undefined ? body.workingHours : undefined,
        lateThresholdMinutes: body.lateThresholdMinutes !== undefined ? body.lateThresholdMinutes : undefined,
      },
    });

    const responseData = {
      ...updated,
      _id: updated.id,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Shift updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update shift error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update shift",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/shifts/[id] - Soft delete shift (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;

    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      return NextResponse.json(
        {
          success: false,
          error: "Shift not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    await prisma.shift.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Shift deleted successfully",
        data: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete shift error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete shift",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
