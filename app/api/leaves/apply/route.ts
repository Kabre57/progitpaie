import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { LeaveType, LeaveStatus } from "@prisma/client";
import { ApiResponse } from "@/types";
import { validateBody } from "@/lib/validate";
import { applyLeaveSchema } from "@/lib/validators/leave.schema";

function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const curDate = new Date(startDate);
  const end = new Date(endDate);

  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireTenant(request);
    if (user instanceof NextResponse) {
      return user;
    }

    // Validation Zod du corps de la requête
    const validation = await validateBody(request, applyLeaveSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { leaveType, startDate, endDate, reason } = validation.data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json(
        {
          success: false,
          error: "La date de fin doit être postérieure à la date de début",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Conversion du type de congé vers l'enum Prisma
    let prismaLeaveType: LeaveType = LeaveType.annual;
    if (leaveType === "sick") prismaLeaveType = LeaveType.sick;
    if (leaveType === "casual") prismaLeaveType = LeaveType.casual;
    if (leaveType === "unpaid") prismaLeaveType = LeaveType.unpaid;

    const requestedDays = calculateWorkingDays(start, end);

    // Vérification du chevauchement de congés déjà existants
    const overlapping = await prisma.leave.findFirst({
      where: {
        companyId: user.companyId,
        userId: user.userId,
        status: { in: [LeaveStatus.pending, LeaveStatus.approved] },
        AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        {
          success: false,
          error: "Une demande de congé chevauche déjà cette période",
          code: "OVERLAPPING_LEAVE",
        },
        { status: 409 }
      );
    }

    // Création de la demande de congé (Statut 'pending' par défaut pour validation RH)
    const leaveRequest = await prisma.leave.create({
      data: {
        companyId: user.companyId,
        userId: user.userId,
        leaveType: prismaLeaveType,
        startDate: start,
        endDate: end,
        totalDays: requestedDays,
        reason: reason.trim(),
        status: LeaveStatus.pending,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...leaveRequest,
          _id: leaveRequest.id,
        },
        message: "Demande de congé soumise avec succès et transmise aux RH pour validation",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Apply leave error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de la soumission de la demande de congé",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
