import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { LeaveStatus } from "@prisma/client";
import { ApiResponse, ApproveLeaveBody } from "@/types";
import { createNotification } from "@/lib/notifications";

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
    const body: ApproveLeaveBody = await request.json().catch(() => ({}));

    // Filtre companyId obligatoire : garantit l'isolation tenant
    const leave = await prisma.leave.findFirst({ where: { id, companyId: authResult.companyId } });
    if (!leave) {
      return NextResponse.json(
        {
          success: false,
          error: "Demande de congé non trouvée",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (leave.status !== LeaveStatus.pending) {
      return NextResponse.json(
        {
          success: false,
          error: `Cette demande de congé a déjà le statut : ${leave.status}`,
          code: "INVALID_STATUS",
        },
        { status: 400 }
      );
    }

    await prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.rejected,
        approvedById: authResult.userId,
        adminComment: body.adminComment || "",
      },
    });

    // Notification utilisateur en Français
    await createNotification({
      userId: leave.userId,
      title: "Demande de congé refusée",
      message: `Votre demande de congé pour la période du ${new Date(leave.startDate).toLocaleDateString("fr-FR")} au ${new Date(leave.endDate).toLocaleDateString("fr-FR")} a été refusée par l'administration.${body.adminComment ? ` Motif : ${body.adminComment}` : ""}`,
      type: "error",
      link: "/employee/leaves",
    });

    const populatedLeave = await prisma.leave.findFirst({
      where: { id, companyId: authResult.companyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    const responseData = populatedLeave
      ? {
          ...populatedLeave,
          _id: populatedLeave.id,
          userId: { ...populatedLeave.user, _id: populatedLeave.user.id },
          approvedBy: populatedLeave.approvedBy
            ? { ...populatedLeave.approvedBy, _id: populatedLeave.approvedBy.id }
            : null,
        }
      : null;

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Demande de congé refusée avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reject leave error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors du refus de la demande de congé",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
