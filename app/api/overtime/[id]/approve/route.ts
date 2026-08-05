import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { OvertimeStatus } from "@prisma/client";
import { ApiResponse } from "@/types";

// PUT /api/overtime/[id]/approve - Admin valide ou rejette les heures supplémentaires
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // action: "approve" | "reject"

    // Filtre companyId obligatoire : garantit l'isolation tenant
    const overtime = await prisma.overtime.findFirst({ where: { id, companyId: authResult.companyId } });
    if (!overtime) {
      return NextResponse.json(
        {
          success: false,
          error: "Enregistrement non trouvé",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const isApproved = action !== "reject";
    const status = isApproved ? OvertimeStatus.approved : OvertimeStatus.rejected;

    const updated = await prisma.overtime.update({
      where: { id },
      data: {
        status,
        approvedById: authResult.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Si approuvé, mettre à jour le pointage correspondant si la date correspond
    if (isApproved) {
      const dateStr = overtime.date.toISOString().split("T")[0];
      await prisma.attendance.updateMany({
        // Filtre companyId pour ne modifier que les pointages du même tenant
        where: { userId: overtime.userId, date: dateStr, companyId: authResult.companyId },
        data: {
          overtimeMinutes: overtime.minutes,
          overtimeRate: overtime.rate,
        },
      });
    }

    const responseData = {
      ...updated,
      _id: updated.id,
      userId: { ...updated.user, _id: updated.user.id },
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: isApproved ? "Heures supplémentaires approuvées" : "Heures supplémentaires rejetées",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Approve overtime error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process overtime request",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
