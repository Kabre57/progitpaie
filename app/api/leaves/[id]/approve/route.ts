import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { LeaveType, LeaveStatus, AttendanceStatus } from "@prisma/client";
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

    const adminId = authResult.userId;
    const { id } = await params;
    const body: ApproveLeaveBody = await request.json().catch(() => ({}));

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

    // Déduction du solde de congé (sans bloquer l'administrateur si solde dépassé)
    if (leave.leaveType !== LeaveType.unpaid) {
      const user = await prisma.user.findUnique({ where: { id: leave.userId } });
      if (user) {
        let available = 0;
        let updateField = "";

        if (leave.leaveType === LeaveType.annual) {
          available = user.leaveBalanceAnnual;
          updateField = "leaveBalanceAnnual";
        } else if (leave.leaveType === LeaveType.sick) {
          available = user.leaveBalanceSick;
          updateField = "leaveBalanceSick";
        } else if (leave.leaveType === LeaveType.casual) {
          available = user.leaveBalanceCasual;
          updateField = "leaveBalanceCasual";
        }

        if (updateField) {
          const newBalance = Math.max(0, available - leave.totalDays);
          await prisma.user.update({
            where: { id: user.id },
            data: { [updateField]: newBalance },
          });
        }
      }
    }

    // Approbation officielle du congé
    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.approved,
        approvedById: adminId,
        adminComment: body.adminComment || "",
      },
    });

    // Génération automatique des fiches de présence pour la période de congé
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = d.toISOString().split("T")[0];
        await prisma.attendance.upsert({
          where: {
            userId_date: {
              userId: leave.userId,
              date: dateStr,
            },
          },
          update: {
            status: AttendanceStatus.on_leave,
            notes: `Congé approuvé (${leave.leaveType})`,
          },
          create: {
            companyId: authResult.companyId,
            userId: leave.userId,
            date: dateStr,
            checkIn: new Date(d.setHours(8, 0, 0, 0)),
            checkOut: new Date(d.setHours(17, 0, 0, 0)),
            status: AttendanceStatus.on_leave,
            hoursWorked: 8,
            notes: `Congé approuvé (${leave.leaveType})`,
          },
        });
      }
    }

    // Notification utilisateur
    await createNotification({
      userId: leave.userId,
      title: "Demande de congé approuvée",
      message: `Votre demande de congé pour la période du ${new Date(leave.startDate).toLocaleDateString("fr-FR")} au ${new Date(leave.endDate).toLocaleDateString("fr-FR")} a été validée par l'administration.`,
      type: "success",
    });

    return NextResponse.json({
      success: true,
      message: "Demande de congé approuvée avec succès",
      data: {
        ...updatedLeave,
        _id: updatedLeave.id,
      },
    });
  } catch (error: any) {
    console.error("Approve leave error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de l'approbation du congé",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
