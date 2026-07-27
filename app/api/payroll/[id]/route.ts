import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { PayrollStatus } from "@prisma/client";
import { ApiResponse, UpdatePayrollBody } from "@/types";
import { createNotification } from "@/lib/notifications";

// PUT /api/payroll/[id] - Update payroll (edit bonuses only in draft)
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
    const body: UpdatePayrollBody = await request.json();

    const payroll = await prisma.payroll.findUnique({ where: { id } });
    if (!payroll) {
      return NextResponse.json(
        {
          success: false,
          error: "Payroll not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (payroll.status !== PayrollStatus.draft) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot edit finalized payroll",
          code: "INVALID_STATUS",
        },
        { status: 400 }
      );
    }

    let bonuses = payroll.bonuses;
    let netSalary = payroll.netSalary;

    if (body.bonuses !== undefined) {
      bonuses = body.bonuses;
      netSalary =
        payroll.basicSalary -
        payroll.absentDeduction -
        payroll.lateDeduction -
        payroll.unpaidLeaveDeduction +
        body.bonuses;
    }

    const updated = await prisma.payroll.update({
      where: { id },
      data: {
        bonuses,
        netSalary,
      },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true } },
      },
    });

    const responseData = {
      ...updated,
      _id: updated.id,
      userId: {
        ...updated.user,
        _id: updated.user.id,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Payroll updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update payroll error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update payroll",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/payroll/[id] - Finalize payroll
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;

    const payroll = await prisma.payroll.findUnique({ where: { id } });
    if (!payroll) {
      return NextResponse.json(
        {
          success: false,
          error: "Payroll not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (payroll.status === PayrollStatus.finalized) {
      return NextResponse.json(
        {
          success: false,
          error: "Payroll already finalized",
          code: "ALREADY_FINALIZED",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.payroll.update({
      where: { id },
      data: {
        status: PayrollStatus.finalized,
        finalizedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true } },
      },
    });

    const monthName = new Date(payroll.year, payroll.month - 1).toLocaleString("en-US", { month: "long" });

    await createNotification({
      userId: payroll.userId,
      title: "Payslip Published",
      message: `Your payslip for ${monthName} ${payroll.year} has been generated and is now available for download.`,
      type: "success",
      link: "/employee/payslip",
    });

    const responseData = {
      ...updated,
      _id: updated.id,
      userId: {
        ...updated.user,
        _id: updated.user.id,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Payroll finalized successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Finalize payroll error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to finalize payroll",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
