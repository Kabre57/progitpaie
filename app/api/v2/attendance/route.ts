import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaAttendanceRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAttendanceRepository";
import { ListAttendanceUseCase } from "@/lib/application/attendance/use-cases/ListAttendanceUseCase";
import { listAttendanceQuerySchema } from "@/shared/validation/attendance-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaAttendanceRepository();
const listUseCase = new ListAttendanceUseCase(repository);

// GET /api/v2/attendance - Liste des pointages (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listAttendanceQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de requête invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await listUseCase.execute({
      companyId: authResult.companyId,
      userId: parseResult.data.userId || (authResult.role === "employee" ? authResult.userId : undefined),
      startDate: parseResult.data.startDate,
      endDate: parseResult.data.endDate,
      status: parseResult.data.status,
      departmentId: parseResult.data.departmentId,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/attendance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
