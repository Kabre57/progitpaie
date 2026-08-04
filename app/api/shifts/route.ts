import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiResponse, CreateShiftBody } from "@/types";

// GET /api/shifts - Get all active shifts
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const shifts = await prisma.shift.findMany({
      where: { companyId: authResult.companyId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { name: "asc" },
    });

    const formattedShifts = shifts.map((s) => ({
      ...s,
      _id: s.id,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedShifts,
        message: "Shifts fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get shifts error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch shifts",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// POST /api/shifts - Create new shift (admin only)
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body: CreateShiftBody = await request.json();

    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Shift name is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (!body.startTime || !body.endTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Start time and end time are required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (!body.workingHours || body.workingHours <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Working hours must be greater than 0",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const existingShift = await prisma.shift.findFirst({
      where: { companyId: authResult.companyId, name: { equals: body.name.trim(), mode: "insensitive" } },
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

    const shift = await prisma.shift.create({
      data: {
        companyId: authResult.companyId,
        name: body.name.trim(),
        startTime: body.startTime,
        endTime: body.endTime,
        workingHours: body.workingHours,
        lateThresholdMinutes: body.lateThresholdMinutes || 15,
        isActive: true,
      },
    });

    const responseData = {
      ...shift,
      _id: shift.id,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Shift created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create shift error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create shift",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
