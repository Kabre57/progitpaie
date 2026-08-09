import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { prisma } from "@/lib/db";
import { listLeavesQuerySchema } from "@/shared/validation/leave-v2.schema";
import { ApiResponse } from "@/types";

// GET /api/v2/leaves - Liste des demandes de congés avec données utilisateur
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listLeavesQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de recherche invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const records = await prisma.leave.findMany({
      where: {
        companyId: authResult.companyId,
        ...(parseResult.data.userId ? { userId: parseResult.data.userId } : {}),
        ...(parseResult.data.status ? { status: parseResult.data.status as any } : {}),
        ...(parseResult.data.leaveType ? { leaveType: parseResult.data.leaveType as any } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, employeeId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = records.map((r) => ({
      _id: r.id,
      id: r.id,
      companyId: r.companyId,
      userId: {
        _id: r.user.id,
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        employeeId: r.user.employeeId || undefined,
      },
      leaveType: r.leaveType,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      totalDays: r.totalDays,
      reason: r.reason,
      status: r.status,
      approvedById: r.approvedById,
      adminComment: r.adminComment,
      appliedAt: r.appliedAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/leaves error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
