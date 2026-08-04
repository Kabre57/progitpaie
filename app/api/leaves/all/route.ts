import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { LeaveStatus, Prisma } from "@prisma/client";
import { ApiResponse } from "@/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const department = searchParams.get("department");
    const month = searchParams.get("month");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Prisma.LeaveWhereInput = { user: { companyId: authResult.companyId } };

    if (status) {
      where.status = status as LeaveStatus;
    }

    if (month) {
      const [year, monthNum] = month.split("-");
      const startOfMonth = new Date(`${year}-${monthNum}-01`);
      const endOfMonth = new Date(parseInt(year, 10), parseInt(monthNum, 10), 0);
      where.startDate = { gte: startOfMonth, lte: endOfMonth };
    }

    if (department) {
      where.user = { companyId: authResult.companyId, departmentId: department };
    }

    const skip = (page - 1) * limit;

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        orderBy: { appliedAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, employeeId: true, departmentId: true },
          },
          approvedBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.leave.count({ where }),
    ]);

    const formattedLeaves = leaves.map((l) => ({
      ...l,
      _id: l.id,
      userId: {
        ...l.user,
        _id: l.user.id,
      },
      approvedBy: l.approvedBy
        ? { ...l.approvedBy, _id: l.approvedBy.id }
        : null,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedLeaves,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get all leaves error:", error);
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
