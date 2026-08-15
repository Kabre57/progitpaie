import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaLeaveRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLeaveRepository";
import { listLeavesQuerySchema } from "@/shared/validation/leave-v2.schema";
import { ApiResponse } from "@/types";

const leaveRepo = new PrismaLeaveRepository();

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

    const records = await leaveRepo.list({
      companyId: authResult.companyId,
      userId: parseResult.data.userId,
      status: parseResult.data.status,
      leaveType: parseResult.data.leaveType,
    });

    const data = records.map((r) => ({
      _id: r.id,
      id: r.id,
      companyId: r.companyId,
      userId: {
        _id: r.userId,
        id: r.userId,
        name: "Salarié",
        email: "",
        employeeId: undefined,
      },
      leaveType: r.leaveType.value,
      startDate: r.period.startDate.toISOString(),
      endDate: r.period.endDate.toISOString(),
      totalDays: r.period.totalDays,
      reason: r.reason,
      status: r.status,
      approvedById: r.approvedById,
      adminComment: r.adminComment,
      appliedAt: r.appliedAt.toISOString(),
      createdAt: r.appliedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/v2/leaves error:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
