import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import { LeaveStatus, Prisma } from "@prisma/client";
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
    const status = searchParams.get("status");
    const year = searchParams.get("year");

    const where: Prisma.LeaveWhereInput = { userId: user.userId };

    if (status) {
      where.status = status as LeaveStatus;
    }

    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      where.startDate = { gte: startOfYear, lte: endOfYear };
    }

    const leaves = await prisma.leave.findMany({
      where,
      orderBy: { appliedAt: "desc" },
      include: {
        approvedBy: { select: { id: true, name: true } },
      },
    });

    const formattedLeaves = leaves.map((l) => ({
      ...l,
      _id: l.id,
      approvedBy: l.approvedBy
        ? { ...l.approvedBy, _id: l.approvedBy.id }
        : null,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedLeaves,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get my leaves error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch leave requests",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const leaveId = searchParams.get("id");

    if (!leaveId) {
      return NextResponse.json(
        {
          success: false,
          error: "Leave ID is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const leave = await prisma.leave.findFirst({
      where: {
        id: leaveId,
        userId: user.userId,
      },
    });

    if (!leave) {
      return NextResponse.json(
        {
          success: false,
          error: "Leave request not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (leave.status !== LeaveStatus.pending) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel ${leave.status} leave request`,
          code: "INVALID_STATUS",
        },
        { status: 400 }
      );
    }

    await prisma.leave.delete({ where: { id: leaveId } });

    return NextResponse.json(
      {
        success: true,
        message: "Leave request cancelled successfully",
        data: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cancel leave error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cancel leave request",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
